import { SocialLinks } from "@/components/shared/social-links"

const NAV_ITEMS = [
	{ label: "Projects", href: "#projects" },
	{ label: "Blog", href: "#blog" },
]

export function Header() {
	return (
		<header className="sticky top-0 z-40 bg-black/85 backdrop-blur-md">
			<div className="mx-auto flex h-16 w-full items-center justify-between px-6">
				<a
					href="/"
					className="font-display text-xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-80"
				>
					Home
				</a>
				<nav className="flex items-center gap-6">
					{NAV_ITEMS.map((item) => (
						<a
							key={item.label}
							href={item.href}
							className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							{item.label}
						</a>
					))}
					<SocialLinks className="ml-2 hidden sm:flex" />
				</nav>
			</div>
		</header>
	)
}
