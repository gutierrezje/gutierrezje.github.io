"use client"

import { useEffect, useRef } from "react"

interface GridParticle {
	baseX: number
	baseY: number
	scale: number
	phase: number
	amplitude: number
	speed: number
	screenX: number
	screenY: number
}

export function PlexusBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false })

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext("2d")
		if (!ctx) return

		let animationFrameId: number
		let resizeFrameId: number | undefined
		let lastFrameTime = 0
		let frameInterval = 1000 / 60
		let isRunning = false
		let grid: GridParticle[][] = []
		let width = window.innerWidth
		let height = window.innerHeight
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

		const spacingX = 65 // Base side length of the equilateral triangles (denser mesh)
		const spacingY = spacingX * 0.866025 // Vertical step to make triangles perfectly equilateral
		const rows = 20
		const mouseRadius = 180
		const mouseRadiusSquared = mouseRadius * mouseRadius

		const initGrid = () => {
			grid = []
			// Width factor compensations: since the top row is scaled down by 0.35, the grid base width
			// needs to be ~3x wider than the viewport to cover the top-left and top-right corners.
			const widthFactor = 3.0
			const cols = Math.ceil((width * widthFactor) / spacingX) + 8

			for (let r = 0; r < rows; r++) {
				grid[r] = []
				const t = r / (rows - 1)
				// Scale goes from 0.35 at the top (far away) to 1.25 at the bottom (close up)
				const scale = 0.35 + 0.9 * t
				// Non-linear Y mapping packs rows closer together at the top of the screen
				const yFraction = t ** 1.45
				const baseY = yFraction * height

				// Isometric shift: offset every odd row by half of the horizontal spacing
				const rowShift = (r % 2) * (spacingX / 2)

				for (let c = 0; c < cols; c++) {
					// Static random offsets to make the mesh look organic
					const offsetX = (Math.random() - 0.5) * spacingX * 0.12
					const offsetY = (Math.random() - 0.5) * spacingY * 0.12

					const baseX = (c - cols / 2) * spacingX + rowShift + offsetX

					grid[r].push({
						baseX,
						baseY: baseY + offsetY * scale,
						scale,
						phase: Math.random() * Math.PI * 2,
						amplitude: Math.random() * 26 + 10,
						speed: Math.random() * 0.0012 + 0.0006,
						screenX: 0,
						screenY: 0,
					})
				}
			}
		}

		const resizeCanvas = () => {
			width = window.innerWidth
			height = window.innerHeight
			canvas.width = width
			canvas.height = height
			// Ultrawide canvases have substantially more cells to update and draw.
			frameInterval = 1000 / (width >= 2560 ? 45 : 60)
			initGrid()
		}

		const handleResize = () => {
			if (resizeFrameId !== undefined) return
			resizeFrameId = requestAnimationFrame(() => {
				resizeFrameId = undefined
				resizeCanvas()
				if (reducedMotion.matches) draw(performance.now(), true)
			})
		}

		resizeCanvas()

		// Backface culling calculation in 2D screen space
		// Computes the signed area of a triangle. Since vertices are defined in clockwise order,
		// any triangle winding counter-clockwise (determinant <= 0) is facing away or collapsed.
		const isBackfacing = (a: GridParticle, b: GridParticle, c: GridParticle) => {
			const det =
				(b.screenX - a.screenX) * (c.screenY - a.screenY) -
				(b.screenY - a.screenY) * (c.screenX - a.screenX)
			return det <= 0
		}

		const getTriangleLight = (a: GridParticle, b: GridParticle, c: GridParticle) => {
			const edgeAX = b.screenX - a.screenX
			const edgeAY = b.screenY - a.screenY
			const edgeBX = c.screenX - a.screenX
			const edgeBY = c.screenY - a.screenY
			const slope = (edgeAY - edgeBY) / Math.max(spacingY, 1)
			const horizontalTilt = (edgeAX + edgeBX) / Math.max(spacingX * 2, 1)
			return Math.max(0, Math.min(1, 0.42 + slope * 0.32 - horizontalTilt * 0.12))
		}

		const drawTriangle = (
			a: GridParticle,
			b: GridParticle,
			c: GridParticle,
			alphaMultiplier: number,
			baseAlpha: number,
		) => {
			if (isBackfacing(a, b, c)) return

			const light = getTriangleLight(a, b, c)
			const shade = Math.round(58 + light * 42)

			ctx.beginPath()
			ctx.moveTo(a.screenX, a.screenY)
			ctx.lineTo(b.screenX, b.screenY)
			ctx.lineTo(c.screenX, c.screenY)
			ctx.closePath()
			ctx.fillStyle = `rgba(${shade - 8}, ${shade}, ${shade + 14}, ${(baseAlpha + light * 0.025) * alphaMultiplier})`
			ctx.fill()
			ctx.stroke()
		}

		// Animation Loop
		const draw = (timestamp: number, force = false) => {
			if (!force && timestamp - lastFrameTime < frameInterval) {
				animationFrameId = requestAnimationFrame(draw)
				return
			}
			lastFrameTime = timestamp
			ctx.clearRect(0, 0, width, height)

			const rows = grid.length
			const cols = grid[0]?.length || 0
			const time = reducedMotion.matches ? 0 : timestamp
			const mouse = mouseRef.current

			// 1. Update positions with Y oscillation & Mouse repulsion
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					const p = grid[r][c]

					// Oscillate vertical height and add a tiny horizontal drift, scaled by perspective depth
					const yOffset = Math.sin(time * p.speed + p.phase) * p.amplitude * p.scale
					const xOffset = Math.cos(time * p.speed * 0.8 + p.phase) * 6 * p.scale

					let targetX = width / 2 + p.baseX * p.scale + xOffset
					let targetY = p.baseY + yOffset

					// Mouse repulsion in screen space coordinates
					if (mouse.active && !reducedMotion.matches) {
						const dx = targetX - mouse.x
						const dy = targetY - mouse.y
						const distanceSquared = dx * dx + dy * dy
						if (distanceSquared > 0 && distanceSquared < mouseRadiusSquared) {
							const distance = Math.sqrt(distanceSquared)
							const force = (1 - distance / mouseRadius) * 32 * p.scale
							const forcePerPixel = force / distance
							targetX += dx * forcePerPixel
							targetY += dy * forcePerPixel
						}
					}

					p.screenX = targetX
					p.screenY = targetY
				}
			}

			// 2. Draw Triangles and Lines
			for (let r = 0; r < rows - 1; r++) {
				const avgScale = (grid[r][0].scale + grid[r + 1][0].scale) / 2
				const alphaMultiplier = Math.min(1.2, avgScale * 0.85)
				ctx.strokeStyle = `rgba(28, 36, 48, ${0.18 * alphaMultiplier})`
				ctx.lineWidth = 0.42 * alphaMultiplier

				for (let c = 0; c < cols - 1; c++) {
					const p = grid[r][c]
					const pRight = grid[r][c + 1]
					const pDown = grid[r + 1][c]
					const pDiag = grid[r + 1][c + 1]

					// View frustum culling: skip rendering if the cell is completely off-screen
					const minX = Math.min(p.screenX, pRight.screenX, pDown.screenX, pDiag.screenX)
					const maxX = Math.max(p.screenX, pRight.screenX, pDown.screenX, pDiag.screenX)
					if (maxX < -50 || minX > width + 50) {
						continue
					}

					// Triangulation coordinates defined in consistent clockwise order
					let tri1A: GridParticle
					let tri1B: GridParticle
					let tri1C: GridParticle
					let tri2A: GridParticle
					let tri2B: GridParticle
					let tri2C: GridParticle

					if (r % 2 === 0) {
						tri1A = p
						tri1B = pRight
						tri1C = pDown
						tri2A = pRight
						tri2B = pDiag
						tri2C = pDown
					} else {
						tri1A = p
						tri1B = pDiag
						tri1C = pDown
						tri2A = p
						tri2B = pRight
						tri2C = pDiag
					}

					drawTriangle(tri1A, tri1B, tri1C, alphaMultiplier, 0.012)
					drawTriangle(tri2A, tri2B, tri2C, alphaMultiplier, 0.007)
				}
			}

			// 3. Draw tiny vertex dots
			for (let r = 0; r < rows; r++) {
				for (let c = 0; c < cols; c++) {
					const p = grid[r][c]
					// Skip drawing off-screen vertex dots
					if (p.screenX < -10 || p.screenX > width + 10) {
						continue
					}
					ctx.beginPath()
					ctx.arc(p.screenX, p.screenY, 1.05 * p.scale, 0, Math.PI * 2)
					ctx.fillStyle = `rgba(28, 36, 48, ${0.18 * Math.min(1, p.scale)})`
					ctx.fill()
				}
			}

			if (isRunning) animationFrameId = requestAnimationFrame(draw)
		}

		const startAnimation = () => {
			if (isRunning || document.hidden || reducedMotion.matches) return
			isRunning = true
			lastFrameTime = 0
			animationFrameId = requestAnimationFrame(draw)
		}

		const stopAnimation = () => {
			isRunning = false
			cancelAnimationFrame(animationFrameId)
		}

		const handleVisibilityChange = () => {
			if (document.hidden) {
				stopAnimation()
			} else if (reducedMotion.matches) {
				draw(performance.now(), true)
			} else {
				startAnimation()
			}
		}

		const handleMotionPreferenceChange = () => {
			if (reducedMotion.matches) {
				stopAnimation()
				mouseRef.current.active = false
				draw(performance.now(), true)
			} else {
				startAnimation()
			}
		}

		// Mouse events
		const handleMouseMove = (e: MouseEvent) => {
			mouseRef.current.x = e.clientX
			mouseRef.current.y = e.clientY
			mouseRef.current.active = true
		}

		const handleMouseLeave = () => {
			mouseRef.current.active = false
		}

		window.addEventListener("resize", handleResize)
		window.addEventListener("mousemove", handleMouseMove)
		document.addEventListener("mouseleave", handleMouseLeave)
		document.addEventListener("visibilitychange", handleVisibilityChange)
		reducedMotion.addEventListener("change", handleMotionPreferenceChange)

		if (reducedMotion.matches) {
			draw(performance.now(), true)
		} else {
			startAnimation()
		}

		return () => {
			window.removeEventListener("resize", handleResize)
			window.removeEventListener("mousemove", handleMouseMove)
			document.removeEventListener("mouseleave", handleMouseLeave)
			document.removeEventListener("visibilitychange", handleVisibilityChange)
			reducedMotion.removeEventListener("change", handleMotionPreferenceChange)
			stopAnimation()
			if (resizeFrameId !== undefined) cancelAnimationFrame(resizeFrameId)
		}
	}, [])

	return (
		<canvas
			ref={canvasRef}
			className="fixed inset-0 -z-10 block size-full pointer-events-none"
			style={{ background: "transparent" }}
		/>
	)
}
