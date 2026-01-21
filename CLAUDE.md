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

The script fetches commits, PRs, and issues from GitHub API.

**After running the script, always fill in the summary sections:**

1. **"What I Worked On"** - Write 3-6 detailed bullet points summarizing the main work:
   - Group related commits by feature/fix/refactor
   - Be specific about what was built, changed, or fixed
   - Mention key technical details (e.g., "migrated from X to Y", "added N new endpoints")
   - Include any PRs merged with context

2. **"Progress Made"** - Write 2-4 bullet points on outcomes/accomplishments:
   - Focus on what was shipped or completed
   - Mention deployments, releases, or milestones
   - Highlight any significant improvements

Example:
```markdown
## What I Worked On

- Migrated daily-logs from Next.js to pure static HTML/CSS/JS for simpler Cloudflare Pages deployment
- Fixed mobile responsiveness issues including header padding, article page layout, and stats alignment
- Added 6 new AI-powered endpoints to x402 API (smart money tracking, NFT valuation, sBTC analytics)
- Released aibtc-mcp-server v1.2.0 with improved scaffold tool validation and UX

## Progress Made

- Ship Log is now live on Cloudflare Pages with full mobile support
- x402 API expanded with AI analytics capabilities
- Reduced daily-logs dependencies from 1229 to 139 packages
```

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
