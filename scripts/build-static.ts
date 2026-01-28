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
		// Remove first h1 from content since we display title separately
		const contentHtml = processed.toString().replace(/^<h1>.*?<\/h1>\n?/, "");

		logs.push({
			slug,
			title: data.title || slug,
			date: data.date instanceof Date ? data.date.toISOString().split("T")[0] : data.date,
			tags: data.tags || [],
			excerpt: "",
			contentHtml,
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
	--background: #0c0c0c;
	--foreground: #e8e4df;
	--muted: #8a8680;
	--border: #2a2a28;
	--border-hover: #3a3a38;
	--card: #141414;
	--card-hover: #1a1a1a;
	--accent: #f97316;
	--accent-hover: #fb923c;
	--accent-soft: rgba(249, 115, 22, 0.12);
}

* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

html {
	color-scheme: dark;
}

/* Grain texture overlay */
body::before {
	content: "";
	position: fixed;
	inset: 0;
	background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
	opacity: 0.015;
	pointer-events: none;
	z-index: 1000;
}

body {
	font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
	font-weight: 300;
	background: var(--background);
	color: var(--foreground);
	line-height: 1.6;
	min-height: 100vh;
	letter-spacing: -0.01em;
}

/* Custom scrollbar */
::-webkit-scrollbar {
	width: 6px;
	height: 6px;
}

::-webkit-scrollbar-track {
	background: transparent;
}

::-webkit-scrollbar-thumb {
	background: #333;
	border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
	background: #444;
}

/* Selection color */
::selection {
	background: var(--accent);
	color: var(--background);
}

/* Fade-in animation */
@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(8px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.animate-fade-in {
	animation: fadeIn 0.5s ease forwards;
}

a {
	color: var(--muted);
	text-decoration: none;
	transition: color 0.2s ease;
}

a:hover {
	color: var(--foreground);
}

.container {
	max-width: 672px;
	margin: 0 auto;
	padding: 0 1rem;
}

@media (min-width: 640px) {
	.container {
		padding: 0 1.5rem;
	}
}

/* Navbar */
.navbar {
	position: sticky;
	top: 0;
	z-index: 50;
	padding: 1rem;
	background: transparent;
	transition: all 0.3s ease;
}

.navbar.scrolled {
	background: rgba(12, 12, 12, 0.8);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border-bottom: 1px solid rgba(42, 42, 40, 0.5);
}

.navbar-content {
	max-width: 672px;
	margin: 0 auto;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.navbar-brand {
	font-size: 1rem;
	font-weight: 500;
	color: var(--foreground);
	letter-spacing: -0.02em;
	transition: color 0.2s ease;
}

.navbar-brand:hover {
	color: white;
}

.navbar-links {
	display: flex;
	gap: 0.75rem;
	align-items: center;
}

.navbar-links .link-text {
	display: none;
}

.navbar-link {
	font-size: 0.875rem;
	font-weight: 400;
	color: var(--muted);
	transition: color 0.2s ease;
	display: flex;
	align-items: center;
	gap: 0.375rem;
}

.navbar-link:hover {
	color: var(--foreground);
}

.navbar-link svg {
	width: 1rem;
	height: 1rem;
}

.navbar-link.accent {
	color: var(--accent);
}

.navbar-link.accent:hover {
	color: var(--accent-hover);
}

/* Navbar Search */
.navbar-search {
	flex: 1;
	max-width: 280px;
	margin: 0 1rem;
}

.navbar-search .search-wrapper {
	position: relative;
}

.navbar-search .search-icon {
	position: absolute;
	left: 0.75rem;
	top: 50%;
	transform: translateY(-50%);
	width: 0.875rem;
	height: 0.875rem;
	color: var(--muted);
	transition: color 0.2s ease;
}

.navbar-search .search-wrapper:focus-within .search-icon {
	color: var(--accent);
}

.navbar-search .search-input {
	width: 100%;
	padding: 0.5rem 0.75rem 0.5rem 2.25rem;
	border: 1px solid var(--border);
	border-radius: 0.5rem;
	background: var(--card);
	color: var(--foreground);
	font-size: 0.8125rem;
	font-weight: 300;
	transition: border-color 0.2s ease, background 0.2s ease;
}

.navbar-search .search-input:hover {
	border-color: var(--border-hover);
}

.navbar-search .search-input:focus {
	outline: none;
	border-color: var(--accent);
	background: var(--card-hover);
}

.navbar-search .search-input::placeholder {
	color: var(--muted);
}

@media (min-width: 640px) {
	.navbar {
		padding: 1.25rem 1.5rem;
	}
	.navbar-links {
		gap: 1.5rem;
	}
	.navbar-links .link-text {
		display: inline;
	}
	.navbar-search {
		max-width: 320px;
		margin: 0 1.5rem;
	}
}

/* Header */
.header {
	background: transparent;
}

.header-content {
	padding-top: 2rem;
	padding-bottom: 2rem;
	animation: fadeIn 0.6s ease forwards;
}

.header h1 {
	font-size: 1.75rem;
	font-weight: 500;
	letter-spacing: -0.03em;
	color: var(--foreground);
}

.header p {
	margin-top: 0.5rem;
	font-size: 1rem;
	color: var(--muted);
	font-weight: 300;
}

@media (min-width: 640px) {
	.header-content {
		padding-top: 3rem;
		padding-bottom: 3rem;
	}
	.header h1 {
		font-size: 2.25rem;
	}
	.header p {
		margin-top: 0.75rem;
		font-size: 1.125rem;
	}
}

/* Stats */
.stats {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 0.75rem;
	margin-bottom: 2.5rem;
	animation: fadeIn 0.6s ease 0.1s forwards;
	opacity: 0;
}

@media (min-width: 640px) {
	.stats {
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}
}

.stat-card {
	background: var(--card);
	border-radius: 0.75rem;
	padding: 1rem;
	text-align: center;
	transition: background 0.2s ease;
}

.stat-card:hover {
	background: var(--card-hover);
}

.stat-value {
	font-size: 1.5rem;
	font-weight: 500;
	font-variant-numeric: tabular-nums;
	color: var(--foreground);
	letter-spacing: -0.02em;
}

.stat-label {
	font-size: 0.75rem;
	color: var(--muted);
	font-weight: 400;
	margin-top: 0.25rem;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

@media (min-width: 640px) {
	.stat-card {
		padding: 1.25rem;
	}
	.stat-value {
		font-size: 2rem;
	}
	.stat-label {
		font-size: 0.75rem;
	}
}

/* Search */
.search-container {
	margin-bottom: 2rem;
	animation: fadeIn 0.6s ease 0.2s forwards;
	opacity: 0;
}

.search-wrapper {
	position: relative;
}

.search-icon {
	position: absolute;
	left: 1rem;
	top: 50%;
	transform: translateY(-50%);
	width: 1rem;
	height: 1rem;
	color: var(--muted);
	transition: color 0.2s ease;
}

.search-wrapper:focus-within .search-icon {
	color: var(--accent);
}

.search-input {
	width: 100%;
	padding: 0.875rem 1rem 0.875rem 2.75rem;
	border: 1px solid var(--border);
	border-radius: 0.75rem;
	background: var(--card);
	color: var(--foreground);
	font-size: 0.875rem;
	font-weight: 300;
	transition: border-color 0.2s ease, background 0.2s ease;
}

.search-input:hover {
	border-color: var(--border-hover);
}

.search-input:focus {
	outline: none;
	border-color: var(--accent);
	background: var(--card-hover);
}

.search-input::placeholder {
	color: var(--muted);
}

.search-results {
	margin-top: 0.75rem;
	font-size: 0.875rem;
	color: var(--muted);
}

/* Log List */
.log-list {
	display: flex;
	flex-direction: column;
	gap: 0;
}

.log-card {
	background: transparent;
	border-radius: 0.75rem;
	padding: 1.25rem 1rem;
	margin: 0 -1rem;
	transition: background 0.2s ease;
	animation: fadeIn 0.5s ease forwards;
	opacity: 0;
}

.log-card:nth-child(1) { animation-delay: 0.25s; }
.log-card:nth-child(2) { animation-delay: 0.3s; }
.log-card:nth-child(3) { animation-delay: 0.35s; }
.log-card:nth-child(4) { animation-delay: 0.4s; }
.log-card:nth-child(5) { animation-delay: 0.45s; }
.log-card:nth-child(n+6) { animation-delay: 0.5s; }

.log-card:hover {
	background: var(--card);
}

.log-card a {
	color: inherit;
	text-decoration: none;
	display: block;
}

.log-header {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.log-main {
	flex: 1;
	min-width: 0;
}

.log-date {
	font-size: 0.75rem;
	color: var(--muted);
	font-weight: 400;
}

.log-title {
	font-size: 1rem;
	font-weight: 400;
	color: var(--foreground);
	transition: color 0.2s ease;
	margin-top: 0.25rem;
	letter-spacing: -0.01em;
}

@media (min-width: 640px) {
	.log-card {
		padding: 1.5rem 1.5rem;
		margin: 0 -1.5rem;
	}
	.log-header {
		flex-direction: row;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1.5rem;
	}
	.log-date {
		font-size: 0.875rem;
	}
	.log-title {
		font-size: 1.125rem;
		margin-top: 0.375rem;
	}
}

.log-card:hover .log-title {
	color: white;
}

.log-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 0.75rem;
}

.tag {
	display: inline-flex;
	align-items: center;
	padding: 0.25rem 0.625rem;
	background: var(--card);
	border-radius: 0.375rem;
	font-size: 0.6875rem;
	font-weight: 400;
	color: var(--muted);
	transition: background 0.2s ease, color 0.2s ease;
}

.log-card:hover .tag {
	background: var(--border);
	color: var(--foreground);
}

.tag-more {
	font-size: 0.6875rem;
	color: var(--muted);
}

.log-meta {
	display: none;
}

.log-relative {
	font-size: 0.875rem;
	color: var(--muted);
	font-weight: 300;
}

.log-stats {
	display: flex;
	gap: 1rem;
	margin-top: 0.5rem;
	font-size: 0.75rem;
	color: var(--muted);
	font-variant-numeric: tabular-nums;
	font-weight: 400;
}

.log-stats span {
	opacity: 0.8;
}

.log-stats-mobile {
	display: flex;
	margin-left: 0.5rem;
}

.log-stats-desktop {
	display: none;
}

@media (min-width: 640px) {
	.tag {
		padding: 0.25rem 0.75rem;
		font-size: 0.75rem;
	}
	.tag-more {
		font-size: 0.75rem;
	}
	.log-meta {
		display: block;
		text-align: right;
		flex-shrink: 0;
	}
	.log-stats-mobile {
		display: none;
	}
	.log-stats-desktop {
		display: flex;
		justify-content: flex-end;
	}
}

/* Empty State */
.empty-state {
	background: var(--card);
	border-radius: 0.75rem;
	padding: 3rem 2rem;
	text-align: center;
	color: var(--muted);
	font-weight: 300;
}

/* Load More */
.load-more-container {
	display: flex;
	justify-content: center;
	padding-top: 2rem;
	padding-bottom: 1rem;
}

.load-more-btn {
	padding: 0.75rem 2rem;
	border: 1px solid var(--border);
	background: transparent;
	border-radius: 0.5rem;
	font-size: 0.875rem;
	font-weight: 400;
	color: var(--muted);
	cursor: pointer;
	transition: all 0.2s ease;
}

.load-more-btn:hover {
	border-color: var(--border-hover);
	color: var(--foreground);
	background: var(--card);
}

.load-more-btn:focus {
	outline: none;
	border-color: var(--accent);
}

/* Article Page */
.back-link {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: var(--muted);
	font-weight: 400;
	transition: color 0.2s ease;
}

.back-link:hover {
	color: var(--foreground);
	text-decoration: none;
}

.back-link svg {
	width: 1rem;
	height: 1rem;
	transition: transform 0.2s ease;
}

.back-link:hover svg {
	transform: translateX(-2px);
}

.article-header {
	margin-bottom: 2.5rem;
	padding-bottom: 2rem;
	border-bottom: 1px solid var(--border);
	animation: fadeIn 0.6s ease forwards;
}

.article-header time {
	font-size: 0.875rem;
	color: var(--muted);
	font-weight: 400;
}

.article-header h1 {
	margin-top: 0.75rem;
	font-size: 2rem;
	font-weight: 500;
	letter-spacing: -0.03em;
	color: var(--foreground);
	line-height: 1.2;
}

.article-tags {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 1.25rem;
}

.article-tags .tag {
	padding: 0.375rem 0.875rem;
	font-size: 0.8125rem;
	background: var(--card);
	color: var(--muted);
}

.article-tags .tag:hover {
	background: var(--border);
	color: var(--foreground);
}

/* Prose */
.prose {
	line-height: 1.75;
	font-weight: 300;
	animation: fadeIn 0.6s ease 0.1s forwards;
	opacity: 0;
}

.prose h1 {
	font-size: 2rem;
	font-weight: 500;
	margin-top: 2.5rem;
	margin-bottom: 1rem;
	letter-spacing: -0.02em;
	color: var(--foreground);
}

.prose h2 {
	font-size: 1.5rem;
	font-weight: 500;
	margin-top: 2.5rem;
	margin-bottom: 1rem;
	padding-bottom: 0.75rem;
	border-bottom: 1px solid var(--border);
	letter-spacing: -0.02em;
	color: var(--foreground);
}

.prose h3 {
	font-size: 1.25rem;
	font-weight: 500;
	margin-top: 2rem;
	margin-bottom: 0.75rem;
	letter-spacing: -0.01em;
	color: var(--foreground);
}

.prose p {
	margin-bottom: 1.25rem;
	color: var(--muted);
}

.prose ul, .prose ol {
	margin-bottom: 1.25rem;
	padding-left: 1.5rem;
	color: var(--muted);
}

.prose li {
	margin-bottom: 0.5rem;
}

.prose li::marker {
	color: var(--border-hover);
}

.prose code {
	font-family: 'SF Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 0.85em;
	background: var(--card);
	padding: 0.2rem 0.4rem;
	border-radius: 0.375rem;
	color: var(--foreground);
}

.prose pre {
	background: var(--card);
	border-radius: 0.75rem;
	padding: 1.25rem;
	overflow-x: auto;
	margin-bottom: 1.5rem;
}

.prose pre code {
	background: none;
	padding: 0;
	font-size: 0.875rem;
}

.prose table {
	width: 100%;
	border-collapse: collapse;
	margin-bottom: 2rem;
	font-size: 0.875rem;
}

.prose th, .prose td {
	padding: 0.875rem 1rem;
	text-align: left;
	border-bottom: 1px solid var(--border);
}

.prose th {
	font-weight: 500;
	color: var(--foreground);
	background: var(--card);
}

.prose td {
	color: var(--muted);
}

.prose tr {
	transition: background 0.15s ease;
}

.prose tr:hover td {
	background: var(--card);
}

.prose blockquote {
	border-left: 2px solid var(--accent);
	padding-left: 1.25rem;
	font-style: italic;
	color: var(--muted);
	margin-bottom: 1.5rem;
	margin-left: 0;
}

.prose strong {
	font-weight: 500;
	color: var(--foreground);
}

.prose a {
	color: var(--accent);
	transition: color 0.2s ease;
}

.prose a:hover {
	color: var(--accent-hover);
}

.prose hr {
	border: none;
	border-top: 1px solid var(--border);
	margin: 3rem 0;
}

/* Footer */
.footer {
	border-top: 1px solid var(--border);
	margin-top: 4rem;
}

.footer-content {
	padding-top: 2rem;
	padding-bottom: 2rem;
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

main.container {
	padding-top: 2rem;
	padding-bottom: 2rem;
}

@media (min-width: 640px) {
	main.container {
		padding-top: 2.5rem;
		padding-bottom: 3rem;
	}
}

/* Article page mobile styles */
.article-header h1 {
	font-size: 1.5rem;
	line-height: 1.25;
}

.prose h1 {
	font-size: 1.5rem;
}

.prose h2 {
	font-size: 1.25rem;
}

.prose h3 {
	font-size: 1.125rem;
}

.prose table {
	display: block;
	overflow-x: auto;
	-webkit-overflow-scrolling: touch;
}

.prose th, .prose td {
	padding: 0.625rem 0.875rem;
	white-space: nowrap;
}

.prose pre {
	font-size: 0.8rem;
	padding: 1rem;
}

@media (min-width: 640px) {
	.article-header h1 {
		font-size: 2.25rem;
		line-height: 1.15;
	}
	.prose h1 {
		font-size: 2rem;
	}
	.prose h2 {
		font-size: 1.5rem;
	}
	.prose h3 {
		font-size: 1.25rem;
	}
	.prose th, .prose td {
		padding: 0.875rem 1rem;
		white-space: normal;
	}
	.prose pre {
		font-size: 0.875rem;
		padding: 1.25rem;
	}
}

/* Accent link style for special links */
.accent-link {
	color: var(--accent) !important;
}

.accent-link:hover {
	color: var(--accent-hover) !important;
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
						(statsHtml.length > 0 ? '<div class="log-stats log-stats-mobile">' + statsHtml.join('') + '</div>' : '') +
					'</div>' +
					'<div class="log-meta">' +
						'<span class="log-relative">' + formatRelativeDate(log.date) + '</span>' +
						(statsHtml.length > 0 ? '<div class="log-stats log-stats-desktop">' + statsHtml.join('') + '</div>' : '') +
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
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="description" content="Every commit. Every day.">
	<meta name="theme-color" content="#0c0c0c">
	<title>Ship Log</title>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml">
	<style>${getStyles()}</style>
</head>
<body>
	<nav class="navbar" id="navbar">
		<div class="navbar-content">
			<a href="/" class="navbar-brand">Ship Log</a>
			<div class="navbar-search">
				<label for="search" class="sr-only">Search logs</label>
				<div class="search-wrapper">
					<svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
					</svg>
					<input type="search" id="search" class="search-input" placeholder="Search..." autocomplete="off">
				</div>
			</div>
			<div class="navbar-links">
				<a href="https://biwas.xyz" class="navbar-link" target="_blank" rel="noopener" title="Portfolio">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
						<polyline points="9 22 9 12 15 12 15 22"/>
					</svg>
					<span class="link-text">Portfolio</span>
				</a>
				<a href="https://github.com/biwasxyz" class="navbar-link" target="_blank" rel="noopener" title="GitHub">
					<svg viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
					</svg>
					<span class="link-text">GitHub</span>
				</a>
			</div>
		</div>
	</nav>

	<p id="search-results" class="search-results container"></p>

	<main class="container" style="padding-top: 1rem;">

		<div id="log-list" class="log-list"></div>

		<div id="empty-state" class="empty-state hidden">
			<p>No logs found.</p>
		</div>

		<div id="load-more-container" class="load-more-container hidden">
			<button id="load-more" class="load-more-btn">Load more</button>
		</div>
	</main>

	<script>${getIndexScript(logs)}</script>
	<script>
		(function() {
			var navbar = document.getElementById('navbar');
			var scrolled = false;
			window.addEventListener('scroll', function() {
				if (window.scrollY > 20 && !scrolled) {
					navbar.classList.add('scrolled');
					scrolled = true;
				} else if (window.scrollY <= 20 && scrolled) {
					navbar.classList.remove('scrolled');
					scrolled = false;
				}
			});
		})();
	</script>
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
	<meta name="theme-color" content="#0c0c0c">
	<title>${escapeHtml(log.title)} | Ship Log</title>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml">
	<style>${getStyles()}</style>
</head>
<body>
	<nav class="navbar" id="navbar">
		<div class="navbar-content">
			<a href="/" class="navbar-brand">Ship Log</a>
			<div class="navbar-links">
				<a href="https://biwas.xyz" class="navbar-link" target="_blank" rel="noopener" title="Portfolio">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
						<polyline points="9 22 9 12 15 12 15 22"/>
					</svg>
					<span class="link-text">Portfolio</span>
				</a>
				<a href="https://github.com/biwasxyz" class="navbar-link" target="_blank" rel="noopener" title="GitHub">
					<svg viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
					</svg>
					<span class="link-text">GitHub</span>
				</a>
			</div>
		</div>
	</nav>

	<header class="header">
		<div class="container" style="padding-top: 1rem; padding-bottom: 1rem;">
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

	<script>
		(function() {
			var navbar = document.getElementById('navbar');
			var scrolled = false;
			window.addEventListener('scroll', function() {
				if (window.scrollY > 20 && !scrolled) {
					navbar.classList.add('scrolled');
					scrolled = true;
				} else if (window.scrollY <= 20 && scrolled) {
					navbar.classList.remove('scrolled');
					scrolled = false;
				}
			});
		})();
	</script>
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
