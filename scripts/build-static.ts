#!/usr/bin/env npx tsx
/**
 * Static site generator - converts markdown logs to pure HTML/CSS/JS
 * Outputs to dist/ folder for deployment to Cloudflare Pages
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import gfm from "remark-gfm";

const CONTENT_DIR = path.join(process.cwd(), "content/logs");
const DIST_DIR = path.join(process.cwd(), "dist");

interface LogData {
	slug: string;
	title: string;
	date: string;
	tags: string[];
	excerpt: string;
	contentHtml: string;
	commits: number;
	prs: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

function extractStats(content: string): { projects: number; commits: number; prs: number } {
	const match = content.match(/\*\*(\d+) projects? \| (\d+) commits? \| (\d+) PRs?/);
	if (match) {
		return {
			projects: parseInt(match[1], 10),
			commits: parseInt(match[2], 10),
			prs: parseInt(match[3], 10),
		};
	}
	return { projects: 0, commits: 0, prs: 0 };
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
		if (diff <= 3) {
			streak++;
		} else {
			break;
		}
	}
	return streak;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

// ============================================================================
// Parse Logs
// ============================================================================

async function parseAllLogs(): Promise<LogData[]> {
	const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
	const logs: LogData[] = [];

	for (const file of files) {
		const slug = file.replace(/\.md$/, "");
		const content = fs.readFileSync(path.join(CONTENT_DIR, file), "utf8");
		const { data, content: markdown } = matter(content);
		const stats = extractStats(markdown);

		const processed = await remark().use(gfm).use(html).process(markdown);

		logs.push({
			slug,
			title: data.title || slug,
			date: data.date instanceof Date ? data.date.toISOString().split("T")[0] : data.date,
			tags: data.tags || [],
			excerpt: "",
			contentHtml: processed.toString(),
			commits: stats.commits,
			prs: stats.prs,
		});
	}

	return logs.sort((a, b) => (a.date > b.date ? -1 : 1));
}

// ============================================================================
// HTML Templates
// ============================================================================

function getStyles(): string {
	return `
:root {
	--background: #fafafa;
	--foreground: #171717;
	--muted: #737373;
	--border: #e5e5e5;
	--card: #ffffff;
	--accent: #3b82f6;
	--accent-hover: #2563eb;
}

@media (prefers-color-scheme: dark) {
	:root {
		--background: #0a0a0a;
		--foreground: #ededed;
		--muted: #a3a3a3;
		--border: #262626;
		--card: #171717;
		--accent: #60a5fa;
		--accent-hover: #93c5fd;
	}
}

* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

html {
	color-scheme: light dark;
}

body {
	font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	background: var(--background);
	color: var(--foreground);
	line-height: 1.6;
	min-height: 100vh;
}

a {
	color: var(--accent);
	text-decoration: none;
}

a:hover {
	color: var(--accent-hover);
	text-decoration: underline;
}

.container {
	max-width: 768px;
	margin: 0 auto;
	padding: 0 1rem;
}

/* Header */
.header {
	border-bottom: 1px solid var(--border);
	background: var(--card);
}

.header-content {
	padding: 2.5rem 0;
}

.header h1 {
	font-size: 2rem;
	font-weight: 700;
	letter-spacing: -0.025em;
}

.header p {
	margin-top: 0.5rem;
	font-size: 1.125rem;
	color: var(--muted);
}

/* Stats */
.stats {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 1rem;
	margin-bottom: 2rem;
}

@media (min-width: 640px) {
	.stats {
		grid-template-columns: repeat(4, 1fr);
	}
}

.stat-card {
	border: 1px solid var(--border);
	background: var(--card);
	border-radius: 0.5rem;
	padding: 1rem;
	text-align: center;
}

.stat-value {
	font-size: 1.875rem;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
}

.stat-label {
	font-size: 0.875rem;
	color: var(--muted);
}

/* Search */
.search-container {
	margin-bottom: 1.5rem;
}

.search-wrapper {
	position: relative;
}

.search-icon {
	position: absolute;
	left: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	width: 1rem;
	height: 1rem;
	color: var(--muted);
}

.search-input {
	width: 100%;
	padding: 0.625rem 1rem 0.625rem 2.5rem;
	border: 1px solid var(--border);
	border-radius: 0.5rem;
	background: var(--card);
	color: var(--foreground);
	font-size: 0.875rem;
}

.search-input:focus {
	outline: none;
	box-shadow: 0 0 0 2px var(--accent);
	border-color: transparent;
}

.search-input::placeholder {
	color: var(--muted);
}

.search-results {
	margin-top: 0.5rem;
	font-size: 0.875rem;
	color: var(--muted);
}

/* Log List */
.log-list {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.log-card {
	border: 1px solid var(--border);
	background: var(--card);
	border-radius: 0.5rem;
	padding: 1.25rem;
	transition: box-shadow 0.15s;
}

.log-card:hover {
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.log-card a {
	color: inherit;
	text-decoration: none;
	display: block;
}

.log-header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 1rem;
}

.log-main {
	flex: 1;
	min-width: 0;
}

.log-date {
	font-size: 0.875rem;
	color: var(--muted);
}

.log-title {
	margin-top: 0.25rem;
	font-size: 1.125rem;
	font-weight: 600;
	transition: color 0.15s;
}

.log-card:hover .log-title {
	color: var(--accent);
}

.log-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 0.5rem;
}

.tag {
	display: inline-flex;
	align-items: center;
	padding: 0.125rem 0.625rem;
	background: var(--border);
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 500;
}

.tag-more {
	font-size: 0.75rem;
	color: var(--muted);
}

.log-meta {
	text-align: right;
	flex-shrink: 0;
}

.log-relative {
	font-size: 0.875rem;
	color: var(--muted);
}

.log-stats {
	display: flex;
	gap: 0.75rem;
	margin-top: 0.5rem;
	font-size: 0.75rem;
	color: var(--muted);
	font-variant-numeric: tabular-nums;
}

/* Empty State */
.empty-state {
	border: 1px solid var(--border);
	background: var(--card);
	border-radius: 0.5rem;
	padding: 2rem;
	text-align: center;
	color: var(--muted);
}

/* Load More */
.load-more-container {
	display: flex;
	justify-content: center;
	padding-top: 1.5rem;
}

.load-more-btn {
	padding: 0.625rem 1.5rem;
	border: 1px solid var(--border);
	background: var(--card);
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--foreground);
	cursor: pointer;
	transition: background 0.15s;
}

.load-more-btn:hover {
	background: var(--border);
}

.load-more-btn:focus {
	outline: none;
	box-shadow: 0 0 0 2px var(--accent);
}

/* Article Page */
.back-link {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: var(--muted);
	transition: color 0.15s;
}

.back-link:hover {
	color: var(--foreground);
	text-decoration: none;
}

.back-link svg {
	width: 1rem;
	height: 1rem;
}

.article-header {
	margin-bottom: 2rem;
}

.article-header time {
	font-size: 0.875rem;
	color: var(--muted);
}

.article-header h1 {
	margin-top: 0.5rem;
	font-size: 2rem;
	font-weight: 700;
	letter-spacing: -0.025em;
}

.article-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 1rem;
}

.article-tags .tag {
	padding: 0.25rem 0.75rem;
	font-size: 0.875rem;
}

/* Prose */
.prose {
	line-height: 1.75;
}

.prose h1 {
	font-size: 2rem;
	font-weight: 700;
	margin-top: 2rem;
	margin-bottom: 1rem;
}

.prose h2 {
	font-size: 1.5rem;
	font-weight: 600;
	margin-top: 2rem;
	margin-bottom: 0.75rem;
	padding-bottom: 0.5rem;
	border-bottom: 1px solid var(--border);
}

.prose h3 {
	font-size: 1.25rem;
	font-weight: 600;
	margin-top: 1.5rem;
	margin-bottom: 0.5rem;
}

.prose p {
	margin-bottom: 1rem;
}

.prose ul, .prose ol {
	margin-bottom: 1rem;
	padding-left: 1.5rem;
}

.prose li {
	margin-bottom: 0.25rem;
}

.prose code {
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 0.875em;
	background: var(--border);
	padding: 0.125rem 0.375rem;
	border-radius: 0.25rem;
}

.prose pre {
	background: var(--card);
	border: 1px solid var(--border);
	border-radius: 0.5rem;
	padding: 1rem;
	overflow-x: auto;
	margin-bottom: 1rem;
}

.prose pre code {
	background: none;
	padding: 0;
}

.prose table {
	width: 100%;
	border-collapse: collapse;
	margin-bottom: 1.5rem;
	font-size: 0.875rem;
}

.prose th, .prose td {
	padding: 0.75rem 1rem;
	text-align: left;
	border-bottom: 1px solid var(--border);
}

.prose th {
	font-weight: 600;
	background: var(--card);
}

.prose tr:hover td {
	background: var(--card);
}

.prose blockquote {
	border-left: 3px solid var(--accent);
	padding-left: 1rem;
	font-style: italic;
	color: var(--muted);
	margin-bottom: 1rem;
}

.prose strong {
	font-weight: 600;
}

.prose hr {
	border: none;
	border-top: 1px solid var(--border);
	margin: 2rem 0;
}

/* Footer */
.footer {
	border-top: 1px solid var(--border);
	margin-top: auto;
}

.footer-content {
	padding: 1.5rem 0;
}

/* Focus styles */
a:focus-visible,
button:focus-visible,
input:focus-visible {
	outline: 2px solid var(--accent);
	outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
	*, *::before, *::after {
		animation-duration: 0.01ms !important;
		transition-duration: 0.01ms !important;
	}
}

/* Screen reader only */
.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border-width: 0;
}

.hidden {
	display: none !important;
}

main {
	padding: 2rem 0;
}
`;
}

function getIndexScript(logs: LogData[]): string {
	const logsJson = JSON.stringify(
		logs.map((l) => ({
			slug: l.slug,
			title: l.title,
			date: l.date,
			tags: l.tags,
			commits: l.commits,
			prs: l.prs,
		}))
	);

	return `
(function() {
	const logs = ${logsJson};
	const ITEMS_PER_PAGE = 10;
	let displayCount = ITEMS_PER_PAGE;
	let filteredLogs = logs;

	const searchInput = document.getElementById('search');
	const searchResults = document.getElementById('search-results');
	const logList = document.getElementById('log-list');
	const loadMoreBtn = document.getElementById('load-more');
	const loadMoreContainer = document.getElementById('load-more-container');
	const emptyState = document.getElementById('empty-state');

	function formatDate(dateString) {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	function formatRelativeDate(dateString) {
		const date = new Date(dateString);
		const now = new Date();
		const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return diffDays + ' days ago';
		if (diffDays < 30) return Math.floor(diffDays / 7) + ' weeks ago';
		return Math.floor(diffDays / 30) + ' months ago';
	}

	function escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	function renderLogCard(log) {
		const tagsHtml = log.tags.slice(0, 5).map(tag =>
			'<span class="tag">' + escapeHtml(tag) + '</span>'
		).join('');
		const moreTagsHtml = log.tags.length > 5
			? '<span class="tag-more">+' + (log.tags.length - 5) + ' more</span>'
			: '';

		const statsHtml = [];
		if (log.commits > 0) statsHtml.push('<span>' + log.commits + ' commits</span>');
		if (log.prs > 0) statsHtml.push('<span>' + log.prs + ' PRs</span>');

		return '<article class="log-card">' +
			'<a href="/logs/' + log.slug + '.html">' +
				'<div class="log-header">' +
					'<div class="log-main">' +
						'<time class="log-date" datetime="' + log.date + '">' + formatDate(log.date) + '</time>' +
						'<h2 class="log-title">' + escapeHtml(log.title) + '</h2>' +
						(log.tags.length > 0 ? '<div class="log-tags">' + tagsHtml + moreTagsHtml + '</div>' : '') +
					'</div>' +
					'<div class="log-meta">' +
						'<span class="log-relative">' + formatRelativeDate(log.date) + '</span>' +
						(statsHtml.length > 0 ? '<div class="log-stats">' + statsHtml.join('') + '</div>' : '') +
					'</div>' +
				'</div>' +
			'</a>' +
		'</article>';
	}

	function render() {
		const visible = filteredLogs.slice(0, displayCount);
		const hasMore = displayCount < filteredLogs.length;
		const remaining = filteredLogs.length - displayCount;

		if (filteredLogs.length === 0) {
			logList.innerHTML = '';
			emptyState.classList.remove('hidden');
			loadMoreContainer.classList.add('hidden');
		} else {
			logList.innerHTML = visible.map(renderLogCard).join('');
			emptyState.classList.add('hidden');

			if (hasMore) {
				loadMoreContainer.classList.remove('hidden');
				loadMoreBtn.textContent = 'Load more (' + remaining + ' remaining)';
			} else {
				loadMoreContainer.classList.add('hidden');
			}
		}
	}

	function filterLogs(query) {
		if (!query.trim()) {
			filteredLogs = logs;
			searchResults.textContent = '';
		} else {
			const q = query.toLowerCase();
			filteredLogs = logs.filter(function(log) {
				return log.title.toLowerCase().includes(q) ||
					log.tags.some(function(tag) { return tag.toLowerCase().includes(q); }) ||
					log.date.includes(q);
			});
			searchResults.textContent = filteredLogs.length + ' ' +
				(filteredLogs.length === 1 ? 'result' : 'results') +
				' for "' + query + '"';
		}
		displayCount = ITEMS_PER_PAGE;
		render();
	}

	searchInput.addEventListener('input', function(e) {
		filterLogs(e.target.value);
	});

	loadMoreBtn.addEventListener('click', function() {
		displayCount = Math.min(displayCount + ITEMS_PER_PAGE, filteredLogs.length);
		render();
	});

	render();
})();
`;
}

function generateIndexHtml(logs: LogData[]): string {
	const totalCommits = logs.reduce((acc, l) => acc + l.commits, 0);
	const totalPRs = logs.reduce((acc, l) => acc + l.prs, 0);
	const avgCommits = logs.length > 0 ? (totalCommits / logs.length).toFixed(1) : "0";
	const streak = calculateStreak(logs);

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="description" content="Every commit. Every day.">
	<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
	<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)">
	<title>Ship Log</title>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml">
	<style>${getStyles()}</style>
</head>
<body>
	<header class="header">
		<div class="container header-content">
			<h1>Ship Log</h1>
			<p>Every commit. Every day.</p>
		</div>
	</header>

	<main class="container">
		<div class="stats">
			<div class="stat-card">
				<div class="stat-value">${totalCommits}</div>
				<div class="stat-label">Commits</div>
			</div>
			<div class="stat-card">
				<div class="stat-value">${totalPRs}</div>
				<div class="stat-label">PRs Merged</div>
			</div>
			<div class="stat-card">
				<div class="stat-value">${avgCommits}</div>
				<div class="stat-label">Avg/Day</div>
			</div>
			<div class="stat-card">
				<div class="stat-value">${streak}</div>
				<div class="stat-label">Day Streak</div>
			</div>
		</div>

		<div class="search-container">
			<label for="search" class="sr-only">Search logs</label>
			<div class="search-wrapper">
				<svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
				</svg>
				<input type="search" id="search" class="search-input" placeholder="Search logs by title, tag, or date..." autocomplete="off">
			</div>
			<p id="search-results" class="search-results"></p>
		</div>

		<div id="log-list" class="log-list"></div>

		<div id="empty-state" class="empty-state hidden">
			<p>No logs found.</p>
		</div>

		<div id="load-more-container" class="load-more-container hidden">
			<button id="load-more" class="load-more-btn">Load more</button>
		</div>
	</main>

	<script>${getIndexScript(logs)}</script>
</body>
</html>`;
}

function generateLogPageHtml(log: LogData): string {
	const tagsHtml = log.tags
		.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
		.join("");

	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="description" content="Development log from ${log.date}">
	<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
	<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)">
	<title>${escapeHtml(log.title)} | Ship Log</title>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml">
	<style>${getStyles()}</style>
</head>
<body>
	<header class="header">
		<div class="container" style="padding: 1.5rem 1rem;">
			<a href="/" class="back-link">
				<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
				</svg>
				Back to all logs
			</a>
		</div>
	</header>

	<main>
		<article class="container">
			<header class="article-header">
				<time datetime="${log.date}">${formatDate(log.date)}</time>
				<h1>${escapeHtml(log.title)}</h1>
				${log.tags.length > 0 ? `<div class="article-tags">${tagsHtml}</div>` : ""}
			</header>

			<div class="prose">
				${log.contentHtml}
			</div>
		</article>
	</main>

	<footer class="footer">
		<div class="container footer-content">
			<a href="/" class="back-link">
				<svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
				</svg>
				Back to all logs
			</a>
		</div>
	</footer>
</body>
</html>`;
}

// ============================================================================
// Main Build
// ============================================================================

async function build() {
	console.log("Building static site...\n");

	// Clean and create dist directory
	if (fs.existsSync(DIST_DIR)) {
		fs.rmSync(DIST_DIR, { recursive: true });
	}
	fs.mkdirSync(DIST_DIR, { recursive: true });
	fs.mkdirSync(path.join(DIST_DIR, "logs"), { recursive: true });

	// Parse all logs
	const logs = await parseAllLogs();
	console.log(`Parsed ${logs.length} logs`);

	// Generate index page
	const indexHtml = generateIndexHtml(logs);
	fs.writeFileSync(path.join(DIST_DIR, "index.html"), indexHtml);
	console.log("Generated: index.html");

	// Generate log pages
	for (const log of logs) {
		const logHtml = generateLogPageHtml(log);
		fs.writeFileSync(path.join(DIST_DIR, "logs", `${log.slug}.html`), logHtml);
	}
	console.log(`Generated: ${logs.length} log pages`);

	// Copy favicon if exists
	const faviconSrc = path.join(process.cwd(), "public", "favicon.svg");
	if (fs.existsSync(faviconSrc)) {
		fs.copyFileSync(faviconSrc, path.join(DIST_DIR, "favicon.svg"));
		console.log("Copied: favicon.svg");
	}

	console.log("\nBuild complete! Output: dist/");
}

build().catch(console.error);
