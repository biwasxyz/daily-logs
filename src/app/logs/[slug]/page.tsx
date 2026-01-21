import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLogSlugs, getLogBySlug } from "@/lib/logs";
import type { Metadata } from "next";

// Force static generation - no dynamic rendering on Cloudflare Workers
export const dynamic = "force-static";
export const dynamicParams = false; // 404 for paths not in generateStaticParams

interface PageProps {
	params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
	const slugs = getAllLogSlugs();
	return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	try {
		const log = getLogBySlug(slug);
		return {
			title: `${log.title} | Daily Logs`,
			description: log.excerpt || `Development log from ${log.date}`,
		};
	} catch {
		return {
			title: "Log Not Found | Daily Logs",
		};
	}
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

export default async function LogPage({ params }: PageProps) {
	const { slug } = await params;

	let log;
	try {
		log = getLogBySlug(slug);
	} catch {
		notFound();
	}

	return (
		<div className="min-h-screen">
			{/* Header */}
			<header className="border-b border-[var(--border)] bg-[var(--card)]">
				<div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={2}
							stroke="currentColor"
							aria-hidden="true"
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
						Back to all logs
					</Link>
				</div>
			</header>

			{/* Article */}
			<article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
				{/* Article header */}
				<header className="mb-8">
					<time className="text-sm text-[var(--muted)]" dateTime={log.date}>
						{formatDate(log.date)}
					</time>
					<h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{log.title}</h1>

					{log.tags.length > 0 && (
						<div className="mt-4 flex flex-wrap gap-2">
							{log.tags.map((tag) => (
								<span
									key={tag}
									className="inline-flex items-center rounded-full bg-[var(--border)] px-3 py-1 text-sm font-medium"
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</header>

				{/* Article content */}
				<div
					className="prose max-w-none"
					dangerouslySetInnerHTML={{ __html: log.contentHtml }}
				/>
			</article>

			{/* Footer */}
			<footer className="border-t border-[var(--border)] mt-auto">
				<div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
					>
						<svg
							className="h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={2}
							stroke="currentColor"
							aria-hidden="true"
						>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
						Back to all logs
					</Link>
				</div>
			</footer>
		</div>
	);
}
