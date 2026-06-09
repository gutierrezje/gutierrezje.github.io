import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

export type BlogPost = {
	slug: string
	title: string
	date: string
	description: string
	tags: string[]
}

export type BlogPostWithContent = BlogPost & {
	content: string
}

const POSTS_DIR = path.join(process.cwd(), "content/posts")

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
				date: data.date ?? "",
				description: data.description ?? "",
				tags: data.tags ?? [],
			} satisfies BlogPost
		})
		.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPost(slug: string): BlogPostWithContent | null {
	const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`)
	const mdPath = path.join(POSTS_DIR, `${slug}.md`)
	const filePath = fs.existsSync(mdxPath) ? mdxPath : fs.existsSync(mdPath) ? mdPath : null

	if (!filePath) return null

	const raw = fs.readFileSync(filePath, "utf-8")
	const { data, content } = matter(raw)

	return {
		slug,
		title: data.title ?? slug,
		date: data.date ?? "",
		description: data.description ?? "",
		tags: data.tags ?? [],
		content,
	}
}
