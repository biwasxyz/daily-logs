# Ship Log

Static site for daily development logs. Pure HTML/CSS/JS, deployed to Cloudflare Pages.

## Commands

```bash
npm run build        # Generate static site to dist/
npm run dev          # Build and serve locally
npm run deploy       # Build and deploy to Cloudflare Pages

./scripts/generate-log.sh              # Generate log for today
./scripts/generate-log.sh 2026-01-15   # Generate log for specific date
```

## Project Structure

```
daily-logs/
├── content/logs/           # Markdown log files
├── scripts/
│   ├── build-static.ts     # Static site generator
│   └── generate-log.sh     # Auto-generate logs from git
├── dist/                   # Build output (gitignored)
└── public/                 # Static assets (favicon)
```

## Adding Logs

### Automatic

```bash
./scripts/generate-log.sh           # Today's date
./scripts/generate-log.sh 2026-01-15  # Specific date
```

The script scans repos in `~/repos/private`, `~/repos/contrib`, `~/repos/forks` for commits and PRs.

### Manual

Create `content/logs/YYYY-MM-DD-daily-summary.md`:

```markdown
---
title: "Daily Summary - YYYY-MM-DD"
date: YYYY-MM-DD
categories: [daily-summary]
tags: [commits, project-name]
---

# Daily Summary: YYYY-MM-DD

**X projects | Y commits | Z PRs merged**

## What I Worked On

Summary here.

## project-name (N commits)

| Hash | Message |
| ---- | ------- |
| `abc123` | feat: something |
```

## Deployment

Deployed to Cloudflare Pages (static hosting). Build outputs to `dist/`.

```bash
npm run deploy  # or push to main for auto-deploy
```

## Tech Stack

- **Build**: TypeScript script with remark for markdown
- **Hosting**: Cloudflare Pages (static)
- **Styling**: Pure CSS with dark mode support
- **JavaScript**: Vanilla JS for search and pagination
