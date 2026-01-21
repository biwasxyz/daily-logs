import { getAllLogs, getLogStats } from "@/lib/logs";
import LogList from "@/components/LogList";

function calculateStreak(logs: { date: string }[]): number {
	if (logs.length === 0) return 0;

	const sortedDates = logs
		.map((l) => new Date(l.date))
		.sort((a, b) => b.getTime() - a.getTime());

	let streak = 1;
	for (let i = 1; i < sortedDates.length; i++) {
		const diff = Math.floor(
			(sortedDates[i - 1].getTime() - sortedDates[i].getTime()) / (1000 * 60 * 60 * 24)
		);
		// Allow 1-2 day gaps (weekends)
		if (diff <= 3) {
			streak++;
		} else {
			break;
		}
	}
	return streak;
}

export default function Home() {
	const logs = getAllLogs();

	// Calculate aggregate stats
	const logsWithStats = logs.map((log) => {
		const stats = getLogStats(log.slug);
		return {
			slug: log.slug,
			title: log.title,
			date: log.date,
			tags: log.tags,
			commits: stats.commits,
			prs: stats.prs,
		};
	});

	const totalCommits = logsWithStats.reduce((acc, log) => acc + log.commits, 0);
	const totalPRs = logsWithStats.reduce((acc, log) => acc + log.prs, 0);
	const avgCommitsPerDay = logs.length > 0 ? (totalCommits / logs.length).toFixed(1) : "0";
	const streak = calculateStreak(logs);

	return (
		<div className="min-h-screen">
			{/* Header */}
			<header className="border-b border-[var(--border)] bg-[var(--card)]">
				<div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
					<h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ship Log</h1>
					<p className="mt-2 text-lg text-[var(--muted)]">Every commit. Every day.</p>
				</div>
			</header>

			{/* Main content */}
			<main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Stats overview */}
				<div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
						<div className="text-3xl font-bold tabular-nums">{totalCommits}</div>
						<div className="text-sm text-[var(--muted)]">Commits</div>
					</div>
					<div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
						<div className="text-3xl font-bold tabular-nums">{totalPRs}</div>
						<div className="text-sm text-[var(--muted)]">PRs Merged</div>
					</div>
					<div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
						<div className="text-3xl font-bold tabular-nums">{avgCommitsPerDay}</div>
						<div className="text-sm text-[var(--muted)]">Avg/Day</div>
					</div>
					<div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
						<div className="text-3xl font-bold tabular-nums">{streak}</div>
						<div className="text-sm text-[var(--muted)]">Day Streak</div>
					</div>
				</div>

				{/* Log list with search and infinite scroll */}
				<LogList logs={logsWithStats} />
			</main>
		</div>
	);
}
