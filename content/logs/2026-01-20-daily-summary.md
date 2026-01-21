---
title: "Daily Summary - 2026-01-20"
date: 2026-01-20
categories: [daily-summary]
tags: [commits, mcp-server, landing-page, mobile, accessibility, release]
---

# Daily Summary: 2026-01-20

**2 projects | 21 commits | 3 PRs merged**

## What I Worked On

MCP server renaming/release and landing page mobile fixes:

- **aibtc-mcp-server**: Package rename to @aibtc/mcp-server, default to mainnet, v1.1.0 release
- **aibtcdev-landing-page**: Major mobile performance and accessibility improvements

## aibtc-mcp-server (5 commits)

Package rename and mainnet default configuration with new release.

### Package Rename (2 commits)

| Hash      | Message                                              |
| --------- | ---------------------------------------------------- |
| `5d76757` | chore: rename package to @aibtc/mcp-server           |
| `2aa6fbf` | Merge pull request #13 from aibtcdev/chore/rename-to-aibtc-mcp-server |

### Mainnet Default (3 commits)

| Hash      | Message                                              |
| --------- | ---------------------------------------------------- |
| `0433ee1` | feat: default to mainnet, use --testnet flag for testnet |
| `9e24d96` | Merge pull request #14 from aibtcdev/feature/default-mainnet |
| `0c20dfe` | 1.1.0                                                |

### Highlights

- **Package Rename**: Changed from `@anthropic/stx402-mcp` to `@aibtc/mcp-server`
- **Mainnet Default**: Now defaults to mainnet instead of testnet, use `--testnet` flag for testnet
- **Release**: Version 1.1.0 published with both changes

## aibtcdev-landing-page (16 commits)

Major mobile performance and UX improvements following web design audit.

### Landing Page Redesign (3 commits)

| Hash      | Message                                              |
| --------- | ---------------------------------------------------- |
| `ec9fc14` | Fix/web design audit (#22)                           |
| `1f713de` | feat: streamline landing page with 5-step terminal guide |
| `6df2948` | chore: remove guide page (moved to landing page)     |

### Content Updates (4 commits)

| Hash      | Message                                              |
| --------- | ---------------------------------------------------- |
| `70adf05` | fix: update MCP package to @aibtc/mcp-server         |
| `69893aa` | fix: update wallet storage path to ~/.aibtc/         |
| `8451818` | feat: add Start Building CTA, remove redundant Ready to build section |
| `3424253` | fix: improve step interactivity and consolidate footer |

### Navigation & Layout (3 commits)

| Hash      | Message                                              |
| --------- | ---------------------------------------------------- |
| `3e119be` | fix: update nav Start Building link to #build        |
| `3facc73` | fix: center hero text accounting for fixed navbar    |
| `d12340e` | fix: remove double newline causing character rendering bug |

### Mobile Performance (6 commits)

| Hash      | Message                                              |
| --------- | ---------------------------------------------------- |
| `407306d` | fix: smooth mobile scrolling with GPU-accelerated background |
| `81dcfa0` | fix: disable heavy blur effects on mobile for low-end devices |
| `a8d35ec` | fix: improve hero text alignment on mobile           |
| `f8a842b` | fix: use 100lvh to prevent background shift on mobile scroll |
| `40b3982` | fix: use svh for hero section on mobile to prevent content shift |
| `581139b` | fix: accessibility and performance improvements from audit |

### Highlights

- **Landing Page Consolidation**: Merged guide page into landing page with 5-step terminal guide
- **Mobile Performance**: GPU-accelerated backgrounds, disabled heavy blur effects on mobile
- **Viewport Units**: Using `svh` and `lvh` for proper mobile viewport handling
- **Accessibility**: Improvements from web design audit
- **Content Sync**: Updated MCP package references and wallet paths

## Pull Requests

| Repo              | PR  | Title                                              | Status |
| ----------------- | --- | -------------------------------------------------- | ------ |
| aibtc-mcp-server  | #13 | chore: rename package to @aibtc/mcp-server         | Merged |
| aibtc-mcp-server  | #14 | feat: default to mainnet, use --testnet flag       | Merged |
| landing-page      | #22 | Fix/web design audit                               | Merged |

## Progress Made

Shipped aibtc-mcp-server v1.1.0 with package rename to @aibtc/mcp-server and mainnet as the default network. Also completed major mobile performance improvements on the landing page, including GPU-accelerated scrolling, proper viewport unit handling (svh/lvh), and disabled heavy blur effects on low-end mobile devices. Consolidated the guide page into the main landing page with a 5-step terminal guide.
