"use client"

import { useGLTF } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Suspense, useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

type SkullR3FProps = {
	className?: string
}

// Matches the --neon oklch(0.85 0.28 142) ≈ #39ff14
const NEON_GREEN = 0x39ff14
const STAR_COUNT = 500

/** Deterministic pseudo-random hash */
function hash(seed: number) {
	const v = Math.sin(seed * 127.1 + 311.7) * 43758.5453123
	return v - Math.floor(v)
}

function Starfield() {
	const { geometry } = useMemo(() => {
		const positions = new Float32Array(STAR_COUNT * 3)
		const sizes = new Float32Array(STAR_COUNT)

		// Camera at z=8, fov=45. Stars on a flat plane at z=-2.
		// Distance from camera = 10, half-height ≈ 10*tan(22.5°) ≈ 4.14
		// Mountains are tallest at edges (~y≈2.2), slope down toward center
		const starZ = -2

		// Minimum y a star can have at a given x — follows mountain silhouette
		const minY = (absX: number) => {
			if (absX < 2) return 2.6 // sun/skull exclusion zone
			if (absX < 4.5) return 1.6 // valley between center and mountains
			if (absX < 6) return 1.4 + (absX - 4.5) * 0.4 // mountain slopes
			return 1.5 // edges
		}

		for (let i = 0; i < STAR_COUNT; i++) {
			let x: number
			let y: number
			let seed = i
			do {
				x = (hash(seed * 1.73) - 0.5) * 18
				y = hash(seed * 9.13) * 4.5 + 0.3
				seed += STAR_COUNT
			} while (y < minY(Math.abs(x)))

			positions[i * 3] = x
			positions[i * 3 + 1] = y
			positions[i * 3 + 2] = starZ

			sizes[i] = hash(i * 21.37) > 0.85 ? 0.04 : hash(i * 21.37) > 0.5 ? 0.025 : 0.015
		}

		const geometry = new THREE.BufferGeometry()
		geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
		geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1))

		return { geometry, sizes }
	}, [])

	useEffect(() => {
		return () => {
			geometry.dispose()
		}
	}, [geometry])

	return (
		<points geometry={geometry}>
			<pointsMaterial
				color={NEON_GREEN}
				size={0.03}
				sizeAttenuation
				transparent
				opacity={0.6}
				depthWrite={false}
				toneMapped={false}
			/>
		</points>
	)
}

function SkullMesh() {
	const { scene } = useGLTF("/dec_skull.glb")

	const { cloak, wire, center, fitScale } = useMemo(() => {
		const base = scene.clone(true)
		const bbox = new THREE.Box3().setFromObject(base)
		const center = bbox.getCenter(new THREE.Vector3())
		const size = bbox.getSize(new THREE.Vector3())
		const maxDim = Math.max(size.x, size.y, size.z) || 1

		const cloak = base.clone(true)
		const wire = base.clone(true)

		cloak.traverse((obj: THREE.Object3D) => {
			if (obj instanceof THREE.Mesh) {
				obj.material = new THREE.MeshBasicMaterial({
					colorWrite: false,
					side: THREE.FrontSide,
					depthWrite: true,
					depthTest: true,
					polygonOffset: true,
					polygonOffsetFactor: 1,
					polygonOffsetUnits: 1,
				})
			}
		})

		wire.traverse((obj: THREE.Object3D) => {
			if (obj instanceof THREE.Mesh) {
				obj.material = new THREE.MeshBasicMaterial({
					color: NEON_GREEN,
					wireframe: true,
					side: THREE.DoubleSide,
					depthWrite: false,
					toneMapped: false,
				})
			}
		})

		return {
			cloak,
			wire,
			center,
			fitScale: 2.35 / maxDim,
		}
	}, [scene])

	useEffect(() => {
		return () => {
			for (const root of [cloak, wire]) {
				root.traverse((obj: THREE.Object3D) => {
					if (obj instanceof THREE.Mesh) {
						if (Array.isArray(obj.material)) {
							for (const material of obj.material) material.dispose()
						} else {
							obj.material.dispose()
						}
					}
				})
			}
		}
	}, [cloak, wire])

	const groupRef = useRef<THREE.Object3D>(null)
	const mouseRef = useRef({ x: 0, y: 0 })
	const position: [number, number, number] = [-center.x, -center.y - 0.06, -center.z]
	const { gl } = useThree()

	useEffect(() => {
		const canvas = gl.domElement
		const onMove = (e: PointerEvent) => {
			const rect = canvas.getBoundingClientRect()
			mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
			mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
		}
		const onLeave = () => {
			mouseRef.current.x = 0
			mouseRef.current.y = 0
		}
		canvas.addEventListener("pointermove", onMove)
		canvas.addEventListener("pointerleave", onLeave)
		return () => {
			canvas.removeEventListener("pointermove", onMove)
			canvas.removeEventListener("pointerleave", onLeave)
		}
	}, [gl])

	useFrame(() => {
		if (!groupRef.current) return
		const targetX = -mouseRef.current.y * 0.3
		const targetY = Math.PI + mouseRef.current.x * 0.4
		groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.05
		groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.05
	})

	// Eye occluder positions/size — tune these to match your model
	// x: left/right offset, y: height, z: depth into face
	const eyeY = position[1] - 0.25 * fitScale
	const eyeX = 0.28 * fitScale
	const eyeZ = position[2] - 0.5 * fitScale
	const eyeRadius = 0.22 * fitScale

	// Nose occluder — below and between the eyes
	const noseY = position[1] - 0.5 * fitScale
	const noseZ = position[2] - 0.65 * fitScale
	const noseRadius = 0.18 * fitScale

	const occluderMat = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				// DEBUG: set colorWrite to true to see the disks
				color: 0x00ff00,
				colorWrite: false,
				side: THREE.DoubleSide,
				depthWrite: true,
				depthTest: true,
			}),
		[],
	)

	useEffect(() => {
		return () => {
			occluderMat.dispose()
		}
	}, [occluderMat])

	return (
		<group ref={groupRef} rotation={[0, Math.PI, 0]}>
			<primitive object={cloak} renderOrder={0} scale={fitScale} position={position} />
			{/* Eye socket occluders — flat disks rotated to face camera (-Z in local space) */}
			<mesh
				position={[-eyeX, eyeY, eyeZ]}
				rotation={[0, Math.PI + 0.45, 0]}
				renderOrder={0}
				material={occluderMat}
			>
				<circleGeometry args={[eyeRadius, 24]} />
			</mesh>
			<mesh
				position={[eyeX, eyeY, eyeZ]}
				rotation={[0, Math.PI - 0.45, 0]}
				renderOrder={0}
				material={occluderMat}
			>
				<circleGeometry args={[eyeRadius, 24]} />
			</mesh>
			{/* Nose occluder */}
			<mesh
				position={[0, noseY, noseZ]}
				rotation={[0, Math.PI, 0]}
				renderOrder={0}
				material={occluderMat}
			>
				<circleGeometry args={[noseRadius, 24]} />
			</mesh>
			<primitive object={wire} renderOrder={1} scale={fitScale} position={position} />
		</group>
	)
}

export function SkullR3F({ className }: SkullR3FProps) {
	return (
		<Canvas
			className={className}
			gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
			dpr={[1, 1.5]}
			camera={{ position: [0, 0, 8], fov: 45 }}
			onCreated={({ gl }) => {
				gl.setClearAlpha(0)
			}}
		>
			<Starfield />
			<Suspense fallback={null}>
				<SkullMesh />
			</Suspense>
		</Canvas>
	)
}

useGLTF.preload("/dec_skull.glb")
