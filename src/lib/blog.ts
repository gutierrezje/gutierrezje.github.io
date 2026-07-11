import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { z } from "zod"

const frontmatterSchema = z.object({
	title: z.string().min(1),
	// YAML parses unquoted dates (date: 2026-07-10) as Date objects and quoted
	// ones as strings; coerce both to a YYYY-MM-DD string.
	date: z.coerce.date().transform((d) => d.toISOString().slice(0, 10)),
	description: z.string().default(""),
	tags: z.array(z.string()).default([]),
	draft: z.boolean().default(false),
})

export type BlogPost = z.output<typeof frontmatterSchema> & {
	slug: string
}

export type BlogPostWithContent = BlogPost & {
	content: string
}

const POSTS_DIR = path.join(process.cwd(), "content/posts")

// Posts with `draft: true` frontmatter are visible during `next dev` but never published.
const includeDrafts = process.env.NODE_ENV === "development"

// Fail the build with a pointed error instead of publishing a malformed post.
function parseFrontmatter(filename: string, data: unknown) {
	const result = frontmatterSchema.safeParse(data)
	if (!result.success) {
		throw new Error(
			`Invalid frontmatter in content/posts/${filename}:\n${z.prettifyError(result.error)}`,
		)
	}
	return result.data
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

			return { slug, ...parseFrontmatter(filename, data) } satisfies BlogPost
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

	const meta = parseFrontmatter(path.basename(filePath), data)
	if (meta.draft && !includeDrafts) return null

	return { slug, ...meta, content }
}
