import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import gfm from "remark-gfm";

const logsDirectory = path.join(process.cwd(), "content/logs");

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

function extractExcerpt(content: string): string {
	const lines = content.split("\n");
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed && !trimmed.startsWith("#") && !trimmed.startsWith("---") && !trimmed.startsWith("|")) {
			return trimmed.slice(0, 200) + (trimmed.length > 200 ? "..." : "");
		}
	}
	return "";
}

function extractStats(content: string): { projects: number; commits: number; prs: number } {
	const statsMatch = content.match(/\*\*(\d+) projects? \| (\d+) commits? \| (\d+) PRs?/);
	if (statsMatch) {
		return {
			projects: parseInt(statsMatch[1], 10),
			commits: parseInt(statsMatch[2], 10),
			prs: parseInt(statsMatch[3], 10),
		};
	}
	return { projects: 0, commits: 0, prs: 0 };
}

export function getAllLogSlugs(): string[] {
	const fileNames = fs.readdirSync(logsDirectory);
	return fileNames
		.filter((name) => name.endsWith(".md"))
		.map((name) => name.replace(/\.md$/, ""));
}

export function getLogBySlug(slug: string): Log {
	const fullPath = path.join(logsDirectory, `${slug}.md`);
	const fileContents = fs.readFileSync(fullPath, "utf8");
	const { data, content } = matter(fileContents);

	const processedContent = remark().use(gfm).use(html).processSync(content);
	const contentHtml = processedContent.toString();

	return {
		slug,
		title: data.title || slug,
		date: data.date instanceof Date ? data.date.toISOString().split("T")[0] : data.date,
		categories: data.categories || [],
		tags: data.tags || [],
		excerpt: extractExcerpt(content),
		contentHtml,
	};
}

export function getAllLogs(): LogMeta[] {
	const slugs = getAllLogSlugs();
	const logs = slugs.map((slug) => {
		const fullPath = path.join(logsDirectory, `${slug}.md`);
		const fileContents = fs.readFileSync(fullPath, "utf8");
		const { data, content } = matter(fileContents);

		return {
			slug,
			title: data.title || slug,
			date: data.date instanceof Date ? data.date.toISOString().split("T")[0] : data.date,
			categories: data.categories || [],
			tags: data.tags || [],
			excerpt: extractExcerpt(content),
		};
	});

	return logs.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getLogStats(slug: string): { projects: number; commits: number; prs: number } {
	const fullPath = path.join(logsDirectory, `${slug}.md`);
	const fileContents = fs.readFileSync(fullPath, "utf8");
	const { content } = matter(fileContents);
	return extractStats(content);
}
