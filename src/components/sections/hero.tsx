"use client"

import { Button } from "@/components/ui/button"

export function Hero() {
	return (
		<section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
			{/* ── Content ── */}
			<div className="relative z-10 max-w-2xl">
				<h1 className="font-display text-6xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
					<span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
						Jesus
					</span>
				</h1>

				<p className="mx-auto mt-4 max-w-md font-mono text-sm tracking-[0.25em] text-indigo-400 uppercase">
					Software Engineer
				</p>

				<p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-zinc-400">
					Building at the intersection of systems programming, creative design, and the modern web.
					Focused on creating beautiful, high-performance user experiences and robust architectures.
				</p>

				<div className="mt-10 flex justify-center gap-4">
					<Button
						size="lg"
						className="relative overflow-hidden rounded-full bg-white font-medium text-black transition-all hover:bg-zinc-200 hover:scale-[1.02] shadow-sm"
						asChild
					>
						<a href="#projects">View Work</a>
					</Button>
					<Button
						size="lg"
						variant="outline"
						className="rounded-full border-zinc-800 bg-black/40 font-medium text-zinc-300 backdrop-blur-sm transition-all hover:bg-zinc-900 hover:text-white hover:border-zinc-700"
						asChild
					>
						<a href="#activity">Activity</a>
					</Button>
				</div>
			</div>
		</section>
	)
}
