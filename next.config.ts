import type { NextConfig } from "next"

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined

const nextConfig: NextConfig = {
	output: "export",
	images: {
		unoptimized: true,
	},
	basePath,
}

export default nextConfig
