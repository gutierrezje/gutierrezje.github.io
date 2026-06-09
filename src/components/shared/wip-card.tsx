import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project } from "@/lib/constants"

export function WipCard({ project }: { project: Project }) {
	return (
		<a href={project.href} className="group block">
			<Card className="relative h-full rounded-xl border border-dashed border-zinc-800/60 bg-zinc-950/40 backdrop-blur-md hover:border-indigo-500/30 hover:bg-zinc-900/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.08)] hover:-translate-y-1">
				<div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/85 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
					</span>
					WIP
				</div>
				<CardHeader>
					<CardTitle className="pr-14 font-display text-lg group-hover:text-indigo-400 transition-colors duration-300">
						{project.title}
					</CardTitle>
					<CardDescription className="text-zinc-400 text-sm mt-1">
						{project.description}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-1.5">
						{project.tags.map((tag) => (
							<Badge
								key={tag}
								variant="outline"
								className="text-xs font-mono border-zinc-800/80 bg-zinc-900/20 text-zinc-400"
							>
								{tag}
							</Badge>
						))}
					</div>
				</CardContent>
			</Card>
		</a>
	)
}
