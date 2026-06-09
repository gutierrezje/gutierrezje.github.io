import type { ReactNode } from "react"

export function PageContent({ children }: { children: ReactNode }) {
	return <div className="relative z-10 bg-background">{children}</div>
}
