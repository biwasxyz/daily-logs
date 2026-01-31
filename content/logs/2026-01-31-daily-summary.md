---
title: "Daily Summary - 2026-01-31"
date: 2026-01-31
categories: [daily-summary]
tags: [commits, aibtc-mcp-server]
---

# Daily Summary: 2026-01-31

**1 project | 7 commits | 1 PR merged | 1 PR open | 2 issues**

## What I Worked On

- Added BNS (Bitcoin Name Service) registration tools to aibtc-mcp
- Implemented V1/V2 contract auto-detection based on namespace (.btc uses V2, others use V1)
- Fixed price lookup to use contract calls instead of deprecated Hiro API
- Improved error handling - real errors now surface instead of being silently swallowed
- Fixed yield hunter APY parsing and reduced fee buffer

## aibtc-mcp-server (7 commits)

### PR #45 - BNS Registration (Merged)

| Hash | Message |
| ---- | ------- |
| `5894f14` | feat: add BNS V1/V2 auto-detection and price lookup |
| `ad88d1c` | feat: add preorder and register BNS tools |
| `194bb44` | fix: use contract calls for price lookup on both V1 and V2 |
| `6e7431b` | fix: throw real errors instead of silently swallowing them |

### PR #42 - Zest Security & Yield Hunter (Open)

| Hash | Message |
| ---- | ------- |
| `5a039aa` | fix(yield-hunter): reduce default fee buffer from 50k to 1k sats |
| `e250cb6` | chore: gitignore AI planning archives |
| `b97cd23` | fix(yield-hunter): correctly parse Zest APY from nested response |

## Pull Requests

| Repo | PR | Title | Status |
| ---- | -- | ----- | ------ |
| aibtc-mcp-server | #45 | feat: add BNS registration tools with V1/V2 auto-detection | Merged |

## Issues

| Repo | Issue | Title | State |
| ---- | ----- | ----- | ----- |
| aibtc-mcp-server | #44 | fix(yield-hunter): fee buffer logic is incorrect - Stacks fees are paid in STX, not sBTC | open |
| aibtc-mcp-server | #43 | refactor: remove duplicate bitcoinAddress/stacksAddress fields | open |

## Progress Made

- BNS registration now works for both V1 (legacy) and V2 (.btc) contracts
- Price lookup fixed - Hiro API endpoint was dead, now uses contract's get-name-price function
- Code quality improved: no more silent error swallowing, real errors propagate to users
- Yield hunter APY parsing fixed (was showing 0% instead of actual rate)
- Released v1.10.0
