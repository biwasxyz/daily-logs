# Ship Log

Daily development logs built with Next.js and deployed to Cloudflare Workers.

## Quick Commands

```bash
# Development
npm run generate-logs  # Generate src/data/logs.json from markdown
npm run dev            # Start dev server at localhost:3000
npm run build          # Pre-generate data + build for production
npm run deploy         # Pre-generate + build + deploy to Cloudflare

# Log Generation
./scripts/generate-log.sh              # Generate log for today
./scripts/generate-log.sh 2026-01-15   # Generate log for specific date
```

## Project Structure

```
daily-logs/
├── content/logs/          # Markdown log files (YYYY-MM-DD-daily-summary.md)
├── src/
│   ├── app/
│   │   ├── page.tsx       # Home page with log listing
│   │   ├── logs/[slug]/   # Individual log pages
│   │   ├── layout.tsx     # Root layout
│   │   └── globals.css    # Global styles
│   ├── data/
│   │   └── logs.json      # Pre-generated log data (gitignored, built automatically)
│   └── lib/
│       └── logs.ts        # Log data utilities (imports from src/data/logs.json)
├── scripts/
│   ├── generate-log.sh        # Auto-generate daily logs from git
│   └── generate-log-data.ts   # Pre-generate JSON from markdown for CF Workers
└── public/                # Static assets
```

## Build Process

Cloudflare Workers doesn't support Node.js `fs` module at runtime. The build process:

1. **Pre-generate data** (`npm run prebuild`): Parses all markdown files and outputs `src/data/logs.json`
2. **Next.js build**: Bundles the JSON data with the application
3. **Deploy**: Static JSON is available at runtime without filesystem access

After adding new markdown logs, run `npm run generate-logs` for local development, or the build process handles it automatically.

## Log Format

Each log file in `content/logs/` follows this format:

```markdown
---
title: "Daily Summary - YYYY-MM-DD"
date: YYYY-MM-DD
categories: [daily-summary]
tags: [commits, project-name, feature-keyword]
---

# Daily Summary: YYYY-MM-DD

**X projects | Y commits | Z PRs merged**

## What I Worked On

Brief summary of the day's focus areas.

## project-name (N commits)

| Hash | Message |
| ---- | ------- |
| `abc1234` | feat: add new feature |

### Highlights

- Key accomplishment or feature shipped

## Progress Made

End-of-day summary paragraph.
```

## Generating Logs

### Automatic (Recommended)

Run the log generation script:

```bash
./scripts/generate-log.sh              # Today
./scripts/generate-log.sh 2026-01-15   # Specific date
```

The script automatically:
1. **Scans all repos** in `~/repos/private`, `~/repos/contrib`, `~/repos/forks`
2. **Finds commits** for the target date via `git log`
3. **Fetches PRs** merged on that date via `gh` CLI
4. **Generates markdown** with proper frontmatter, commit tables, and PR tables

### Requirements

- `gh` CLI authenticated (`gh auth login`)
- Git repos in the scanned directories

### Configuring Scan Directories

Edit `scripts/generate-log.sh` and update the `SCAN_DIRS` array:

```bash
SCAN_DIRS=(
  "$HOME/repos/private"
  "$HOME/repos/contrib"
  "$HOME/repos/forks"
  "$HOME/work"  # Add more directories
)
```

### Manual

Create a new file in `content/logs/` with the naming pattern:
```
YYYY-MM-DD-daily-summary.md
```

## Daily Log Workflow

1. **End of day**: Run `./scripts/generate-log.sh`
2. **Edit**: Add descriptions, highlights, and "What I Worked On" summary
3. **Verify**: Run `npm run build` to ensure it compiles
4. **Deploy**: Run `npm run deploy` (or auto-deploy via git push)

## Stats Extraction

The app automatically extracts stats from the first line matching:
```
**X projects | Y commits | Z PRs merged**
```

These power the homepage metrics (total commits, PRs, avg/day, streak).

## Deployment

Deployed to Cloudflare Workers via OpenNext:

```bash
npm run deploy   # Full build + deploy
npm run preview  # Local preview with Cloudflare bindings
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Markdown**: gray-matter + remark + remark-gfm
- **Deployment**: Cloudflare Workers via @opennextjs/cloudflare
- **Fonts**: Geist Sans & Mono
