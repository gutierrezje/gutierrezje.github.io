export type Project = {
	title: string
	description: string
	tags: string[]
	href: string
	featured?: boolean
	inProgress?: boolean
}

export type Social = {
	label: string
	href: string
	icon: "github" | "linkedin"
}

export const INCLUDED_REPOS: string[] = ["diffowl", "leet-buddy"]

export type CuratedOverride = Partial<Project> & { repoName: string }

export const CURATED_OVERRIDES: CuratedOverride[] = [
	{
		repoName: "diffowl",
		title: "DiffOwl",
	},
	{
		repoName: "leet-buddy",
		title: "LeetBuddy",
	},
]

export const EXTRA_PROJECTS: Project[] = []

export const SKILLS: string[] = [
	"TypeScript",
	"React",
	"Next.js",
	"Node.js",
	"Go",
	"Rust",
	"Python",
	"PostgreSQL",
	"Three.js",
	"WebGL",
	"Docker",
	"AWS",
	"Git",
	"Linux",
	"Tailwind CSS",
	"GraphQL",
]

export const SOCIALS: Social[] = [
	{ label: "GitHub", href: "https://github.com/gutierrezje", icon: "github" },
	{ label: "LinkedIn", href: "https://linkedin.com/in/gutierrezje", icon: "linkedin" },
]

export const GITHUB_USERNAME = "gutierrezje"
export const LEETCODE_USERNAME = "gutierrezje" // set to "" to disable
