export type DayData = {
	date: string // YYYY-MM-DD
	count: number
}

export type ActivityData = {
	github: DayData[]
	leetcode: DayData[]
}

async function fetchGitHubActivity(username: string): Promise<DayData[]> {
	const token = process.env.GITHUB_TOKEN
	if (!token) {
		console.warn("GITHUB_TOKEN not set — skipping GitHub activity fetch")
		return []
	}

	const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
  `

	try {
		const res = await fetch("https://api.github.com/graphql", {
			method: "POST",
			headers: {
				Authorization: `bearer ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ query, variables: { login: username } }),
			next: { revalidate: false },
		})

		if (!res.ok) return []

		const json = await res.json()
		const weeks: { contributionDays: { date: string; contributionCount: number }[] }[] =
			json.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? []

		return weeks.flatMap((week) =>
			week.contributionDays.map((day) => ({
				date: day.date,
				count: day.contributionCount,
			})),
		)
	} catch (err) {
		console.warn("Failed to fetch GitHub activity:", err)
		return []
	}
}

async function fetchLeetCodeActivity(username: string): Promise<DayData[]> {
	if (!username) return []

	const query = `
    query userCalendar($username: String!) {
      matchedUser(username: $username) {
        userCalendar {
          submissionCalendar
        }
      }
    }
  `

	try {
		const res = await fetch("https://leetcode.com/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Referer: "https://leetcode.com",
			},
			body: JSON.stringify({ query, variables: { username } }),
			next: { revalidate: false },
		})

		if (!res.ok) return []

		const json = await res.json()
		const calendarStr: string | undefined = json.data?.matchedUser?.userCalendar?.submissionCalendar

		if (!calendarStr) return []

		const calendar: Record<string, number> = JSON.parse(calendarStr)

		return Object.entries(calendar).map(([ts, count]) => ({
			date: new Date(Number(ts) * 1000).toISOString().slice(0, 10),
			count,
		}))
	} catch (err) {
		console.warn("Failed to fetch LeetCode activity:", err)
		return []
	}
}

export async function fetchActivity(
	githubUsername: string,
	leetcodeUsername: string,
): Promise<ActivityData> {
	const [github, leetcode] = await Promise.all([
		fetchGitHubActivity(githubUsername),
		fetchLeetCodeActivity(leetcodeUsername),
	])
	return { github, leetcode }
}
