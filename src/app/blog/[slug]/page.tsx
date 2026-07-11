import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { getPost, getPosts } from "@/lib/blog"

export const dynamicParams = false

export function generateStaticParams() {
	const posts = getPosts()
	// output: export fails on an empty param list (e.g. every post is a draft);
	// emit a sentinel slug that getPost() can never resolve, so its page 404s.
	if (posts.length === 0) return [{ slug: "%00" }]
	return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>
}): Promise<Metadata> {
	const { slug } = await params
	const post = getPost(slug)
	if (!post) return {}

	return {
		title: `${post.title} — Jesus`,
		description: post.description,
	}
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params
	const post = getPost(slug)
	if (!post) notFound()

	return (
		<>
			<Header />
			<main>
				<article className="mx-auto w-full max-w-3xl px-6 py-16">
					<Link
						href="/#blog"
						className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						← Back
					</Link>

					<header className="mt-6 mb-10">
						<p className="font-mono text-xs text-muted-foreground">
							{post.date}
							{post.draft && (
								<span className="ml-3 rounded-full border border-border px-2.5 py-0.5 text-amber-400">
									Draft
								</span>
							)}
						</p>
						<h1 className="mt-2 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight md:text-4xl">
							{post.title}
						</h1>
						{post.tags.length > 0 && (
							<ul className="mt-4 flex flex-wrap gap-2">
								{post.tags.map((tag) => (
									<li
										key={tag}
										className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-muted-foreground"
									>
										{tag}
									</li>
								))}
							</ul>
						)}
					</header>

					<div className="prose prose-invert max-w-none prose-headings:font-[family-name:var(--font-heading)] prose-headings:tracking-tight prose-a:text-foreground prose-code:font-mono prose-pre:border prose-pre:border-border prose-pre:bg-surface">
						<MDXRemote source={post.content} />
					</div>
				</article>
			</main>
			<Footer />
		</>
	)
}
