"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface LogMeta {
	slug: string;
	title: string;
	date: string;
	tags: string[];
	commits: number;
	prs: number;
}

interface LogListProps {
	logs: LogMeta[];
}

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

const ITEMS_PER_PAGE = 10;

export default function LogList({ logs }: LogListProps) {
	const [search, setSearch] = useState("");
	const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
	const loaderRef = useRef<HTMLDivElement>(null);

	// Filter logs based on search
	const filteredLogs = logs.filter((log) => {
		if (!search.trim()) return true;
		const query = search.toLowerCase();
		return (
			log.title.toLowerCase().includes(query) ||
			log.tags.some((tag) => tag.toLowerCase().includes(query)) ||
			log.date.includes(query)
		);
	});

	// Reset display count when search changes
	useEffect(() => {
		setDisplayCount(ITEMS_PER_PAGE);
	}, [search]);

	// Infinite scroll with Intersection Observer
	const loadMore = useCallback(() => {
		if (displayCount < filteredLogs.length) {
			setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredLogs.length));
		}
	}, [displayCount, filteredLogs.length]);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					loadMore();
				}
			},
			{ threshold: 0.1 }
		);

		if (loaderRef.current) {
			observer.observe(loaderRef.current);
		}

		return () => observer.disconnect();
	}, [loadMore]);

	const visibleLogs = filteredLogs.slice(0, displayCount);
	const hasMore = displayCount < filteredLogs.length;

	return (
		<div>
			{/* Search */}
			<div className="mb-6">
				<div className="relative">
					<svg
						className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={2}
						stroke="currentColor"
						aria-hidden="true"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
						/>
					</svg>
					<input
						type="search"
						placeholder="Search logs by title, tag, or date..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full rounded-lg border border-[var(--border)] bg-[var(--card)] py-2.5 pl-10 pr-4 text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
					/>
				</div>
				{search && (
					<p className="mt-2 text-sm text-[var(--muted)]">
						{filteredLogs.length} {filteredLogs.length === 1 ? "result" : "results"} for &ldquo;{search}&rdquo;
					</p>
				)}
			</div>

			{/* Log list */}
			<div className="space-y-4">
				{visibleLogs.map((log) => (
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
										{log.commits > 0 && <span className="tabular-nums">{log.commits} commits</span>}
										{log.prs > 0 && <span className="tabular-nums">{log.prs} PRs</span>}
									</div>
								</div>
							</div>
						</Link>
					</article>
				))}
			</div>

			{/* Empty state */}
			{filteredLogs.length === 0 && (
				<div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-8 text-center">
					<p className="text-[var(--muted)]">
						{search ? <>No logs found for &ldquo;{search}&rdquo;</> : "No logs yet."}
					</p>
				</div>
			)}

			{/* Infinite scroll loader */}
			{hasMore && (
				<div ref={loaderRef} className="flex justify-center py-8">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
				</div>
			)}

			{/* End of list */}
			{!hasMore && filteredLogs.length > ITEMS_PER_PAGE && (
				<p className="py-6 text-center text-sm text-[var(--muted)]">
					End of logs
				</p>
			)}
		</div>
	);
}
