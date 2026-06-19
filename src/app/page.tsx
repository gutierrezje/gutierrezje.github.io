import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { PageContent } from "@/components/layout/page-content"
import { BlogPreview } from "@/components/sections/blog-preview"
import { Hero } from "@/components/sections/hero"
import { ProjectsGrid } from "@/components/sections/projects-grid"
import { getPosts } from "@/lib/blog"
import { fetchProjects } from "@/lib/github"

export default async function Home() {
	const [projects, posts] = await Promise.all([fetchProjects(), Promise.resolve(getPosts())])

	return (
		<>
			<Header />
			<main>
				<Hero />
				<PageContent>
					<ProjectsGrid projects={projects} />
					<BlogPreview posts={posts} />
				</PageContent>
			</main>
			<Footer />
		</>
	)
}
