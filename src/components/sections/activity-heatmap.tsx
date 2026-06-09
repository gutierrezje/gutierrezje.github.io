import { Section } from "@/components/layout/section"
import type { ActivityData, DayData } from "@/lib/activity"

const WEEKS = 52

const INTENSITY_CLASSES = [
	"bg-muted",
	"bg-primary/25",
	"bg-primary/45",
	"bg-primary/70",
	"bg-primary",
]

function countToLevel(count: number): number {
	if (count === 0) return 0
	if (count <= 2) return 1
	if (count <= 5) return 2
	if (count <= 9) return 3
	return 4
}

function buildGrid(data: DayData[]): Array<Array<{ date: string; count: number }>> {
	const map = new Map(data.map((d) => [d.date, d.count]))

	const today = new Date()
	today.setHours(0, 0, 0, 0)

	// Align start to the Sunday of the week that was (WEEKS-1) weeks ago
	const startOfCurrentWeek = new Date(today)
	startOfCurrentWeek.setDate(today.getDate() - today.getDay())

	const start = new Date(startOfCurrentWeek)
	start.setDate(start.getDate() - (WEEKS - 1) * 7)

	return Array.from({ length: WEEKS }, (_, w) =>
		Array.from({ length: 7 }, (_, d) => {
			const date = new Date(start)
			date.setDate(start.getDate() + w * 7 + d)
			const dateStr = date.toISOString().slice(0, 10)
			return { date: dateStr, count: map.get(dateStr) ?? 0 }
		}),
	)
}

function getMonthLabels(grid: Array<Array<{ date: string }>>) {
	const labels: Array<{ label: string; col: number }> = []
	let lastMonth = -1

	for (let wi = 0; wi < grid.length; wi++) {
		const month = new Date(`${grid[wi][0].date}T12:00:00`).getMonth()
		if (month !== lastMonth) {
			labels.push({
				label: new Date(`${grid[wi][0].date}T12:00:00`).toLocaleString("default", {
					month: "short",
				}),
				col: wi,
			})
			lastMonth = month
		}
	}

	return labels
}

// Width per column in px (cell 12px + gap 2px)
const COL_W = 14

function mergeActivity(activity: ActivityData): DayData[] {
	const map = new Map<string, number>()
	for (const { date, count } of [...activity.github, ...activity.leetcode]) {
		map.set(date, (map.get(date) ?? 0) + count)
	}
	return Array.from(map.entries()).map(([date, count]) => ({ date, count }))
}

export function ActivityHeatmap({ activity }: { activity: ActivityData }) {
	const merged = mergeActivity(activity)
	const total = merged.reduce((sum, d) => sum + d.count, 0)
	const grid = buildGrid(merged)
	const monthLabels = getMonthLabels(grid)

	return (
		<Section id="activity">
			<div className="mb-10">
				<h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight md:text-4xl">
					Activity
				</h2>
				<p className="mt-2 text-muted-foreground">GitHub commits + LeetCode submissions.</p>
			</div>

			<div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
				<div className="mb-3 flex items-center justify-between">
					<span className="text-sm font-semibold">Combined</span>
					<span className="text-xs font-mono text-muted-foreground">
						{total === 0 ? "no data" : `${total.toLocaleString()} contributions`}
					</span>
				</div>

				<div className="overflow-x-auto">
					<div style={{ minWidth: `${WEEKS * COL_W}px` }}>
						<div className="relative mb-1 h-4">
							{monthLabels.map(({ label, col }) => (
								<span
									key={`${label}-${col}`}
									className="absolute text-[10px] text-muted-foreground"
									style={{ left: `${col * COL_W}px` }}
								>
									{label}
								</span>
							))}
						</div>

						<div className="flex gap-[2px]">
							{grid.map((week, wi) => (
								<div key={wi} className="flex flex-col gap-[2px]">
									{week.map((day, di) => (
										<div
											key={di}
											className={`size-3 rounded-sm ${INTENSITY_CLASSES[countToLevel(day.count)]} transition-colors`}
											title={`${day.date}: ${day.count} contribution${day.count !== 1 ? "s" : ""}`}
										/>
									))}
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
					<span>Less</span>
					{INTENSITY_CLASSES.map((cls, i) => (
						<div key={i} className={`size-3 rounded-sm ${cls}`} />
					))}
					<span>More</span>
				</div>
			</div>
		</Section>
	)
}
