#!/usr/bin/env npx tsx
/**
 * Pre-generates all log data as JSON for static bundling.
 * Run before build: npm run prebuild
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import gfm from "remark-gfm";

const logsDirectory = path.join(process.cwd(), "content/logs");
const outputFile = path.join(process.cwd(), "src/data/logs.json");

interface LogData {
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

async function generateLogData(): Promise<void> {
	console.log("Generating log data...");

	const fileNames = fs.readdirSync(logsDirectory);
	const logs: LogData[] = [];

	for (const fileName of fileNames) {
		if (!fileName.endsWith(".md")) continue;

		const slug = fileName.replace(/\.md$/, "");
		const fullPath = path.join(logsDirectory, fileName);
		const fileContents = fs.readFileSync(fullPath, "utf8");
		const { data, content } = matter(fileContents);

		const processedContent = await remark().use(gfm).use(html).process(content);
		const contentHtml = processedContent.toString();

		logs.push({
			slug,
			title: data.title || slug,
			date: data.date instanceof Date ? data.date.toISOString().split("T")[0] : data.date,
			categories: data.categories || [],
			tags: data.tags || [],
			excerpt: extractExcerpt(content),
			contentHtml,
			stats: extractStats(content),
		});
	}

	// Sort by date descending
	logs.sort((a, b) => (a.date > b.date ? -1 : 1));

	// Ensure output directory exists
	const outputDir = path.dirname(outputFile);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	fs.writeFileSync(outputFile, JSON.stringify(logs, null, 2));
	console.log(`Generated ${logs.length} logs to ${outputFile}`);
}

generateLogData().catch(console.error);
