import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

export type BlogPost = {
	slug: string
	title: string
	date: string
	description: string
	tags: string[]
	draft: boolean
}

export type BlogPostWithContent = BlogPost & {
	content: string
}

const POSTS_DIR = path.join(process.cwd(), "content/posts")

// Posts with `draft: true` frontmatter are visible during `next dev` but never published.
const includeDrafts = process.env.NODE_ENV === "development"

// YAML parses unquoted dates (date: 2026-07-10) as Date objects; keep the public type a string.
function normalizeDate(value: unknown): string {
	if (value instanceof Date) return value.toISOString().slice(0, 10)
	return typeof value === "string" ? value : ""
}

function readPostFiles(): string[] {
	if (!fs.existsSync(POSTS_DIR)) return []
	return fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
}

export function getPosts(): BlogPost[] {
	const files = readPostFiles()

	return files
		.map((filename) => {
			const slug = filename.replace(/\.(mdx|md)$/, "")
			const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf-8")
			const { data } = matter(raw)

			return {
				slug,
				title: data.title ?? slug,
				date: normalizeDate(data.date),
				description: data.description ?? "",
				tags: data.tags ?? [],
				draft: data.draft === true,
			} satisfies BlogPost
		})
		.filter((post) => includeDrafts || !post.draft)
		.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPost(slug: string): BlogPostWithContent | null {
	const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`)
	const mdPath = path.join(POSTS_DIR, `${slug}.md`)
	const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null

	if (!filePath) return null

	const raw = fs.readFileSync(filePath, "utf-8")
	const { data, content } = matter(raw)

	const draft = data.draft === true
	if (draft && !includeDrafts) return null

	return {
		slug,
		title: data.title ?? slug,
		date: normalizeDate(data.date),
		description: data.description ?? "",
		tags: data.tags ?? [],
		draft,
		content,
	}
}
