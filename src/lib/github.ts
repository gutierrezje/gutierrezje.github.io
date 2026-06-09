import type { Project } from "@/lib/constants"
import { CURATED_OVERRIDES, EXCLUDED_REPOS, EXTRA_PROJECTS } from "@/lib/constants"

type GitHubRepo = {
	name: string
	description: string | null
	topics: string[]
	html_url: string
	fork: boolean
	archived: boolean
}

function toTitleCase(kebab: string): string {
	return kebab
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")
}

export async function fetchProjects(): Promise<Project[]> {
	try {
		const res = await fetch("https://api.github.com/users/gutierrezje/repos?per_page=100", {
			headers: {
				Accept: "application/vnd.github+json",
				"X-GitHub-Api-Version": "2022-11-28",
			},
			next: { revalidate: false },
		})

		if (!res.ok) {
			console.warn(`GitHub API returned ${res.status}, falling back to extra projects`)
			return EXTRA_PROJECTS
		}

		const repos: GitHubRepo[] = await res.json()

		const projects: Project[] = repos
			.filter((repo) => !repo.fork && !repo.archived && !EXCLUDED_REPOS.includes(repo.name))
			.map((repo) => {
				const override = CURATED_OVERRIDES.find((o) => o.repoName === repo.name)
				const { repoName: _, ...overrideFields } = override ?? { repoName: "" }

				return {
					title: toTitleCase(repo.name),
					description: repo.description ?? "",
					tags: repo.topics,
					href: repo.html_url,
					...overrideFields,
				}
			})

		return [...projects, ...EXTRA_PROJECTS]
	} catch (err) {
		console.warn("Failed to fetch GitHub repos:", err)
		return EXTRA_PROJECTS
	}
}
