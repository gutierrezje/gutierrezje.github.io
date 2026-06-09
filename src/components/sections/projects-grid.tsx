import { Section } from "@/components/layout/section"
import { ProjectCard } from "@/components/shared/project-card"
import { WipCard } from "@/components/shared/wip-card"
import type { Project } from "@/lib/constants"

export function ProjectsGrid({ projects }: { projects: Project[] }) {
	const wipProjects = projects.filter((p) => p.inProgress)
	const regularProjects = projects.filter((p) => !p.inProgress)

	return (
		<Section id="projects">
			<div className="mb-10">
				<h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Projects</h2>
				<p className="mt-2 text-zinc-400">A selection of things I&apos;ve built and shipped.</p>
			</div>

			{wipProjects.length > 0 && (
				<div className="mb-10">
					<h3 className="mb-4 font-mono text-xs font-semibold tracking-widest text-indigo-400/80 uppercase">
						Currently Working On
					</h3>
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{wipProjects.map((project) => (
							<WipCard key={project.title} project={project} />
						))}
					</div>
				</div>
			)}

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{regularProjects.map((project) => (
					<ProjectCard key={project.title} project={project} />
				))}
			</div>
		</Section>
	)
}
