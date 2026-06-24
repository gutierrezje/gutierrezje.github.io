export function Hero() {
	return (
		<section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
			{/* ── Content ── */}
			<div className="relative z-10 max-w-2xl">
				<h1 className="font-display text-6xl font-bold tracking-tight text-white sm:text-7xl lg:text-8xl">
					<span className="bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
						Jesus Gutierrez
					</span>
				</h1>

				<p className="mx-auto mt-4 max-w-md font-mono text-sm tracking-[0.25em] text-zinc-400 uppercase">
					AI Tools / Backend Systems
				</p>

				<p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-zinc-400">
					I build TypeScript and Python tools that make LLM workflows more reliable: code-review
					agents, evaluation pipelines, and backend systems with durable state, tests, and clear
					failure paths.
				</p>
			</div>
		</section>
	)
}
