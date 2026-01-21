import Link from "next/link";
import { getAllLogs, getLogStats } from "@/lib/logs";

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
}

function formatRelativeDate(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffTime = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
	return `${Math.floor(diffDays / 30)} months ago`;
}

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
	const totalCommits = logs.reduce((acc, log) => acc + getLogStats(log.slug).commits, 0);
	const totalPRs = logs.reduce((acc, log) => acc + getLogStats(log.slug).prs, 0);
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

				{/* Log list */}
				<div className="space-y-4">
					{logs.map((log) => {
						const stats = getLogStats(log.slug);
						return (
							<article
								key={log.slug}
								className="group rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 transition-shadow hover:shadow-md"
							>
								<Link href={`/logs/${log.slug}`} className="block">
									<div className="flex items-start justify-between gap-4">
										<div className="min-w-0 flex-1">
											<time className="text-sm text-[var(--muted)]" dateTime={log.date}>
												{formatDate(log.date)}
											</time>
											<h2 className="mt-1 text-lg font-semibold group-hover:text-[var(--accent)] transition-colors">
												{log.title}
											</h2>
											{log.tags.length > 0 && (
												<div className="mt-2 flex flex-wrap gap-2">
													{log.tags.slice(0, 5).map((tag) => (
														<span
															key={tag}
															className="inline-flex items-center rounded-full bg-[var(--border)] px-2.5 py-0.5 text-xs font-medium"
														>
															{tag}
														</span>
													))}
													{log.tags.length > 5 && (
														<span className="text-xs text-[var(--muted)]">+{log.tags.length - 5} more</span>
													)}
												</div>
											)}
										</div>
										<div className="flex-shrink-0 text-right">
											<span className="text-sm text-[var(--muted)]">{formatRelativeDate(log.date)}</span>
											<div className="mt-2 flex gap-3 text-xs text-[var(--muted)]">
												{stats.commits > 0 && (
													<span className="tabular-nums">{stats.commits} commits</span>
												)}
												{stats.prs > 0 && (
													<span className="tabular-nums">{stats.prs} PRs</span>
												)}
											</div>
										</div>
									</div>
								</Link>
							</article>
						);
					})}
				</div>

				{logs.length === 0 && (
					<div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
						<p className="text-[var(--muted)]">No logs yet. Check back later.</p>
					</div>
				)}
			</main>

			{/* Footer */}
			<footer className="border-t border-[var(--border)] mt-auto">
				<div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
					<p className="text-center text-sm text-[var(--muted)]">
						Built with Claude Code
					</p>
				</div>
			</footer>
		</div>
	);
}
