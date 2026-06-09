import type { Metadata } from "next"
import { Inter, Space_Mono } from "next/font/google"
import { PlexusBackground } from "@/components/shared/plexus-background"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
})

const spaceMono = Space_Mono({
	variable: "--font-space-mono",
	subsets: ["latin"],
	weight: ["400", "700"],
	display: "swap",
})

export const metadata: Metadata = {
	title: "Jesus — Developer Portfolio",
	description: "Software engineer.",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${spaceMono.variable} bg-slate-50 text-slate-900 antialiased min-h-screen relative overflow-x-hidden`}
			>
				<PlexusBackground />
				<div className="relative z-10 mx-auto min-h-screen max-w-4xl bg-black text-white shadow-[0_0_60px_rgba(0,0,0,0.85)] border-x border-zinc-900/40 flex flex-col">
					<TooltipProvider>{children}</TooltipProvider>
				</div>
			</body>
		</html>
	)
}
