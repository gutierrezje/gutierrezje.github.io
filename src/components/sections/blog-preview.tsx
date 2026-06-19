import Link from "next/link"
import { Section } from "@/components/layout/section"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { BlogPost } from "@/lib/blog"

export function BlogPreview({ posts }: { posts: BlogPost[] }) {
	if (posts.length === 0) {
		return null
	}

	return (
		<Section id="blog">
			<div className="mb-10">
				<h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight md:text-4xl">
					Blog
				</h2>
				<p className="mt-2 text-muted-foreground">Thoughts on engineering, tools, and craft.</p>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{posts.map((post) => (
					<Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
						<Card className="h-full transition-all hover:-translate-y-1 hover:shadow-md">
							<CardHeader>
								<CardDescription className="text-xs font-mono">{post.date}</CardDescription>
								<CardTitle className="font-[family-name:var(--font-heading)] text-base group-hover:text-primary transition-colors">
									{post.title}
								</CardTitle>
								<CardDescription>{post.description}</CardDescription>
							</CardHeader>
						</Card>
					</Link>
				))}
			</div>
		</Section>
	)
}
