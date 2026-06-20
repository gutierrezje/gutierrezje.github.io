"use client"

import { useEffect, useRef } from "react"

interface MeshPoint {
	x: number
	depth: number
	z: number
	phase: number
	amplitude: number
	speed: number
	screenX: number
	screenY: number
	scale: number
	forward: number
}

type MeshTriangle = {
	a: number
	b: number
	c: number
	tone: number
}

type DrawableTriangle = MeshTriangle & {
	depth: number
}

export function PlexusBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null)

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
		let points: MeshPoint[] = []
		let triangles: MeshTriangle[] = []
		let drawableTriangles: DrawableTriangle[] = []
		let width = window.innerWidth
		let height = window.innerHeight
		let dpr = Math.min(window.devicePixelRatio || 1, 2)
		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")

		const spacing = 146
		const rowStep = spacing * 0.9
		const focalLength = 760
		const cameraDepth = -520
		const cameraHeight = 360
		const cameraPitch = 0.7
		const horizon = 0.48

		const initMesh = () => {
			points = []
			triangles = []
			drawableTriangles = []

			const pitchCos = Math.cos(cameraPitch)
			const pitchSin = Math.sin(cameraPitch)
			const nearDepth = cameraDepth - 100
			const farDepth = 4200 + height * 1.35
			const farForward = (farDepth - cameraDepth) * pitchCos - (0 - cameraHeight) * pitchSin
			const worldHalfWidth = (width * 0.62 * farForward) / focalLength + spacing * 3
			const cols = Math.ceil((worldHalfWidth * 2) / spacing) + 2
			const rows = Math.ceil((farDepth - nearDepth) / rowStep) + 2
			const startX = -(cols * spacing) / 2
			// Light jitter only — too much breaks the radial fan around each vertex.
			const jitter = spacing * 0.14

			// 1. Lay out a shared floor-plane mesh. Every point is reused by all the
			// triangles touching it, so vertical waves bend one connected surface.
			//   index = row * cols + col
			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					// Stagger odd rows half a cell for a triangular (not square) lattice.
					const stagger = (row % 2) * (spacing / 2)
					const x = startX + col * spacing + stagger + (Math.random() - 0.5) * jitter
					const depth = nearDepth + row * rowStep + (Math.random() - 0.5) * jitter
					points.push({
						x,
						depth,
						z: 0,
						phase: Math.random() * Math.PI * 2,
						amplitude: Math.random() * 34 + 18,
						speed: Math.random() * 0.00038 + 0.00018,
						screenX: 0,
						screenY: 0,
						scale: 0,
						forward: 0,
					})
				}
			}

			// 2. Triangulate to match the half-cell stagger so the lattice is a true
			// triangular tiling: every interior vertex is the hub of six triangles
			// fanning radially around it, instead of a skewed rectangular split.
			const idx = (r: number, c: number) => r * cols + c
			const pushTri = (a: number, b: number, c: number, tone: number) => {
				triangles.push({ a, b, c, tone })
			}

			for (let row = 0; row < rows - 1; row++) {
				for (let col = 0; col < cols - 1; col++) {
					// Stable per-cell tones so the facet patchwork reads even at rest.
					const tone = ((row * 5 + col * 3) % 5) / 5
					if (row % 2 === 0) {
						// Even rows are unshifted; the row below is shifted right.
						pushTri(idx(row, col), idx(row, col + 1), idx(row + 1, col), tone)
						pushTri(idx(row, col + 1), idx(row + 1, col + 1), idx(row + 1, col), (tone + 0.4) % 1)
					} else {
						// Odd rows are shifted right; the row below is unshifted.
						pushTri(idx(row, col), idx(row, col + 1), idx(row + 1, col + 1), tone)
						pushTri(idx(row, col), idx(row + 1, col + 1), idx(row + 1, col), (tone + 0.4) % 1)
					}
				}
			}
		}

		const resizeCanvas = () => {
			width = window.innerWidth
			height = window.innerHeight
			dpr = Math.min(window.devicePixelRatio || 1, 2)
			canvas.width = Math.round(width * dpr)
			canvas.height = Math.round(height * dpr)
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
			// Ultrawide canvases have substantially more triangles to update and draw.
			frameInterval = 1000 / (width >= 2560 ? 40 : 45)
			initMesh()
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

		// Animation Loop
		const draw = (timestamp: number, force = false) => {
			if (!force && timestamp - lastFrameTime < frameInterval) {
				animationFrameId = requestAnimationFrame(draw)
				return
			}
			lastFrameTime = timestamp
			ctx.clearRect(0, 0, width, height)

			const time = reducedMotion.matches ? 0 : timestamp

			const pitchCos = Math.cos(cameraPitch)
			const pitchSin = Math.sin(cameraPitch)
			const centerY = height * horizon

			// 1. Update real 3D floor-plane positions, then project through a pitched
			// camera. The bob happens before projection, so lifted vertices naturally
			// expand and shift as part of the perspective transform.
			for (const p of points) {
				const depthT = Math.min(1, p.depth / 4200)
				const zBob = Math.sin(time * p.speed + p.phase)
				p.z = zBob * p.amplitude * (1.05 - depthT * 0.45)

				const relativeDepth = p.depth - cameraDepth
				const relativeHeight = p.z - cameraHeight
				const forward = relativeDepth * pitchCos - relativeHeight * pitchSin
				if (forward <= 1) {
					p.scale = 0
					p.forward = 0
					continue
				}

				const vertical = relativeDepth * pitchSin + relativeHeight * pitchCos
				p.forward = forward
				p.scale = focalLength / forward
				p.screenX = width / 2 + p.x * p.scale
				p.screenY = centerY - vertical * p.scale
			}

			// 2. Collect visible triangles and sort far-to-near. Canvas is a painter,
			// so drawing foreground facets last is what prevents distant wirework
			// from bleeding through the near surface.
			drawableTriangles.length = 0
			for (const tri of triangles) {
				const a = points[tri.a]
				const b = points[tri.b]
				const c = points[tri.c]
				if (a.scale === 0 || b.scale === 0 || c.scale === 0) continue
				const minX = Math.min(a.screenX, b.screenX, c.screenX)
				const maxX = Math.max(a.screenX, b.screenX, c.screenX)
				const minY = Math.min(a.screenY, b.screenY, c.screenY)
				const maxY = Math.max(a.screenY, b.screenY, c.screenY)
				if (maxX < 0 || minX > width || maxY < 0 || minY > height) continue

				drawableTriangles.push({
					...tri,
					depth: (a.forward + b.forward + c.forward) / 3,
				})
			}
			drawableTriangles.sort((a, b) => b.depth - a.depth)

			// 3. Paint each facet as one solid face plus its own border. The nearly
			// opaque fill acts as terrain, blocking strokes from triangles behind it.
			for (const tri of drawableTriangles) {
				const a = points[tri.a]
				const b = points[tri.b]
				const c = points[tri.c]
				const lift = (a.z + b.z + c.z) / 3
				const depthFade = (a.scale + b.scale + c.scale) / 3
				const slope = Math.abs(a.screenY - b.screenY) + Math.abs(b.screenY - c.screenY)
				const light = Math.max(
					0,
					Math.min(1, 0.42 + tri.tone * 0.2 + lift * 0.006 + slope * 0.0016),
				)
				const face = Math.round(238 - light * 24)
				const edgeAlpha = Math.max(0.035, Math.min(0.22, 0.15 * Math.min(1.35, depthFade)))
				const edgeWidth = Math.max(0.42, 0.7 * Math.min(1.3, depthFade))

				ctx.beginPath()
				ctx.moveTo(a.screenX, a.screenY)
				ctx.lineTo(b.screenX, b.screenY)
				ctx.lineTo(c.screenX, c.screenY)
				ctx.closePath()
				ctx.fillStyle = `rgb(${face}, ${face + 3}, ${face + 8})`
				ctx.fill()
				ctx.strokeStyle = `rgba(28, 36, 48, ${edgeAlpha})`
				ctx.lineWidth = edgeWidth
				ctx.stroke()
			}

			// 4. Draw tiny vertex dots after the terrain pass, kept faint so they read
			// as facet vertices instead of a separate particle field.
			for (const p of points) {
				if (
					p.screenX < -10 ||
					p.screenX > width + 10 ||
					p.screenY < -10 ||
					p.screenY > height + 10
				) {
					continue
				}
				ctx.beginPath()
				ctx.arc(p.screenX, p.screenY, Math.max(0.5, 1.05 * p.scale), 0, Math.PI * 2)
				ctx.fillStyle = `rgba(28, 36, 48, ${0.18 * Math.min(1, p.scale)})`
				ctx.fill()
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
				draw(performance.now(), true)
			} else {
				startAnimation()
			}
		}

		window.addEventListener("resize", handleResize)
		document.addEventListener("visibilitychange", handleVisibilityChange)
		reducedMotion.addEventListener("change", handleMotionPreferenceChange)

		if (reducedMotion.matches) {
			draw(performance.now(), true)
		} else {
			startAnimation()
		}

		return () => {
			window.removeEventListener("resize", handleResize)
			document.removeEventListener("visibilitychange", handleVisibilityChange)
			reducedMotion.removeEventListener("change", handleMotionPreferenceChange)
			stopAnimation()
			if (resizeFrameId !== undefined) cancelAnimationFrame(resizeFrameId)
		}
	}, [])

	return (
		<>
			<canvas
				ref={canvasRef}
				className="fixed inset-0 -z-10 block size-full pointer-events-none"
				style={{ background: "transparent" }}
			/>
			<div
				className="pointer-events-none fixed inset-0 -z-10"
				style={{
					background:
						"radial-gradient(ellipse at center, transparent 32%, rgba(255, 255, 255, 0.38) 68%, rgba(255, 255, 255, 0.96) 100%)",
				}}
			/>
			<div
				className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[62vh] bg-gradient-to-b from-white via-white/90 to-transparent backdrop-blur-[10px]"
				style={{
					maskImage: "linear-gradient(to bottom, black, transparent)",
					WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
				}}
			/>
			<div
				className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[58vh] bg-gradient-to-t from-white via-white/85 to-transparent backdrop-blur-[10px]"
				style={{
					maskImage: "linear-gradient(to top, black, transparent)",
					WebkitMaskImage: "linear-gradient(to top, black, transparent)",
				}}
			/>
		</>
	)
}
