import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project } from "@/lib/constants"

export function ProjectCard({ project }: { project: Project }) {
	return (
		<a href={project.href} className="group block">
			<Card className="h-full rounded-xl border border-zinc-800/60 bg-zinc-950/40 backdrop-blur-md hover:border-indigo-500/30 hover:bg-zinc-900/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.08)] hover:-translate-y-1">
				<CardHeader>
					<CardTitle className="font-display text-lg group-hover:text-indigo-400 transition-colors duration-300">
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
