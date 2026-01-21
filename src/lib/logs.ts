/**
 * Log data utilities - uses pre-generated JSON data for Cloudflare Workers compatibility.
 * Data is generated at build time by scripts/generate-log-data.ts
 */

import logsData from "@/data/logs.json";

export interface LogMeta {
	slug: string;
	title: string;
	date: string;
	categories: string[];
	tags: string[];
	excerpt: string;
}

export interface Log extends LogMeta {
	contentHtml: string;
}

interface LogDataEntry {
	slug: string;
	title: string;
	date: string;
	categories: string[];
	tags: string[];
	excerpt: string;
	contentHtml: string;
	stats: {
		projects: number;
		commits: number;
		prs: number;
	};
}

// Type the imported JSON data
const logs = logsData as LogDataEntry[];

export function getAllLogSlugs(): string[] {
	return logs.map((log) => log.slug);
}

export function getLogBySlug(slug: string): Log {
	const log = logs.find((l) => l.slug === slug);
	if (!log) {
		throw new Error(`Log not found: ${slug}`);
	}
	return {
		slug: log.slug,
		title: log.title,
		date: log.date,
		categories: log.categories,
		tags: log.tags,
		excerpt: log.excerpt,
		contentHtml: log.contentHtml,
	};
}

export function getAllLogs(): LogMeta[] {
	return logs.map((log) => ({
		slug: log.slug,
		title: log.title,
		date: log.date,
		categories: log.categories,
		tags: log.tags,
		excerpt: log.excerpt,
	}));
}

export function getLogStats(slug: string): { projects: number; commits: number; prs: number } {
	const log = logs.find((l) => l.slug === slug);
	if (!log) {
		return { projects: 0, commits: 0, prs: 0 };
	}
	return log.stats;
}
