#!/bin/bash
# generate-log.sh
# Generates a daily summary log by fetching commits and PRs from GitHub API
#
# Usage: ./scripts/generate-log.sh [YYYY-MM-DD]
# Default: today's date
#
# Requirements: gh CLI (authenticated)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$REPO_DIR/content/logs"

# Date to generate log for (default: today)
TARGET_DATE="${1:-$(date +%Y-%m-%d)}"
NEXT_DATE=$(date -j -v+1d -f "%Y-%m-%d" "$TARGET_DATE" "+%Y-%m-%d" 2>/dev/null || date -d "$TARGET_DATE + 1 day" "+%Y-%m-%d")

# Output file
OUTPUT_FILE="$LOGS_DIR/${TARGET_DATE}-daily-summary.md"

# Ensure logs directory exists
mkdir -p "$LOGS_DIR"

echo "Generating log for: $TARGET_DATE"
echo "Fetching data from GitHub API..."
echo ""

# Temp files for collecting data
COMMITS_FILE=$(mktemp)
REPOS_FILE=$(mktemp)
PRS_FILE=$(mktemp)
trap "rm -f $COMMITS_FILE $REPOS_FILE $PRS_FILE" EXIT

# Check gh CLI is available
if ! command -v gh &> /dev/null; then
  echo "Error: gh CLI is required but not installed"
  exit 1
fi

# Get GitHub username
gh_user=$(gh api user --jq '.login' 2>/dev/null || echo "")
if [ -z "$gh_user" ]; then
  echo "Error: Could not get GitHub username. Please run 'gh auth login'"
  exit 1
fi

echo "GitHub user: $gh_user"
echo ""

# Fetch commits from GitHub API using search
echo "Fetching commits from GitHub..."

# Search for commits by the user on this date
# GitHub search uses ISO 8601 dates
gh api -X GET "search/commits" \
  -f q="author:${gh_user} author-date:${TARGET_DATE}" \
  -f sort="author-date" \
  -f per_page="100" \
  --jq '.items[] | "\(.repository.name)|\(.sha[0:7])|\(.commit.message | split("\n")[0])"' 2>/dev/null >> "$COMMITS_FILE" || true

# Count commits per repo
if [ -f "$COMMITS_FILE" ] && [ -s "$COMMITS_FILE" ]; then
  # Get unique repos and their commit counts
  cut -d'|' -f1 "$COMMITS_FILE" | sort | uniq -c | while read count name; do
    echo "$name|$count" >> "$REPOS_FILE"
  done
fi

# Count totals
total_commits=0
total_projects=0
if [ -f "$REPOS_FILE" ] && [ -s "$REPOS_FILE" ]; then
  total_projects=$(wc -l < "$REPOS_FILE" | tr -d ' ')
  total_commits=$(wc -l < "$COMMITS_FILE" | tr -d ' ')
fi

echo "Found: $total_projects projects, $total_commits commits"

# Fetch PRs from GitHub for the date
echo ""
echo "Fetching PRs from GitHub..."
total_prs=0

# Get PRs authored and merged on this date
gh search prs --author="$gh_user" --merged --merged-at="$TARGET_DATE" --json repository,title,number,url --limit 50 2>/dev/null | \
  jq -r '.[] | "\(.repository.nameWithOwner)|\(.number)|\(.title)|\(.url)"' >> "$PRS_FILE" 2>/dev/null || true

if [ -f "$PRS_FILE" ] && [ -s "$PRS_FILE" ]; then
  total_prs=$(wc -l < "$PRS_FILE" | tr -d ' ')
fi

echo "Found: $total_prs PRs merged"
echo ""

if [ "$total_commits" -eq 0 ] && [ "$total_prs" -eq 0 ]; then
  echo "No commits or PRs found for $TARGET_DATE"
  exit 0
fi

# Fetch issues from GitHub for the date
echo "Fetching issues from GitHub..."
ISSUES_FILE=$(mktemp)
trap "rm -f $COMMITS_FILE $REPOS_FILE $PRS_FILE $ISSUES_FILE" EXIT

# Get issues created or updated by the user on this date
gh search issues --author="$gh_user" --created="$TARGET_DATE" --json repository,title,number,url,state --limit 50 2>/dev/null | \
  jq -r '.[] | "\(.repository.nameWithOwner)|\(.number)|\(.title)|\(.state)"' >> "$ISSUES_FILE" 2>/dev/null || true

total_issues=0
if [ -f "$ISSUES_FILE" ] && [ -s "$ISSUES_FILE" ]; then
  total_issues=$(wc -l < "$ISSUES_FILE" | tr -d ' ')
fi

echo "Found: $total_issues issues created"
echo ""

# Collect all tags from repo names
tags="commits"
if [ -f "$REPOS_FILE" ]; then
  while IFS='|' read -r name count; do
    tag=$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr -c '[:alnum:]-' '-' | sed 's/-*$//')
    tags="$tags, $tag"
  done < "$REPOS_FILE"
fi

# Generate the markdown file
echo "Writing: $OUTPUT_FILE"

cat > "$OUTPUT_FILE" << EOF
---
title: "Daily Summary - ${TARGET_DATE}"
date: ${TARGET_DATE}
categories: [daily-summary]
tags: [$tags]
---

# Daily Summary: ${TARGET_DATE}

**${total_projects} projects | ${total_commits} commits | ${total_prs} PRs | ${total_issues} issues**

## What I Worked On

<!-- Add a brief summary of the day's focus -->

EOF

# Add project sections
if [ -f "$REPOS_FILE" ]; then
  while IFS='|' read -r repo_name count; do
    echo "## $repo_name ($count commits)" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "| Hash | Message |" >> "$OUTPUT_FILE"
    echo "| ---- | ------- |" >> "$OUTPUT_FILE"

    # Get commits for this repo
    grep "^${repo_name}|" "$COMMITS_FILE" | while IFS='|' read -r name hash message; do
      echo "| \`$hash\` | $message |" >> "$OUTPUT_FILE"
    done

    echo "" >> "$OUTPUT_FILE"
  done < "$REPOS_FILE"
fi

# Add PRs section if any
if [ -f "$PRS_FILE" ] && [ -s "$PRS_FILE" ]; then
  echo "## Pull Requests" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "| Repo | PR | Title | Status |" >> "$OUTPUT_FILE"
  echo "| ---- | -- | ----- | ------ |" >> "$OUTPUT_FILE"

  while IFS='|' read -r repo pr_num title url; do
    repo_short=$(echo "$repo" | cut -d'/' -f2)
    echo "| $repo_short | #$pr_num | $title | Merged |" >> "$OUTPUT_FILE"
  done < "$PRS_FILE"

  echo "" >> "$OUTPUT_FILE"
fi

# Add issues section if any
if [ -f "$ISSUES_FILE" ] && [ -s "$ISSUES_FILE" ]; then
  echo "## Issues" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "| Repo | Issue | Title | State |" >> "$OUTPUT_FILE"
  echo "| ---- | ----- | ----- | ----- |" >> "$OUTPUT_FILE"

  while IFS='|' read -r repo issue_num title state; do
    repo_short=$(echo "$repo" | cut -d'/' -f2)
    echo "| $repo_short | #$issue_num | $title | $state |" >> "$OUTPUT_FILE"
  done < "$ISSUES_FILE"

  echo "" >> "$OUTPUT_FILE"
fi

# Add progress section
cat >> "$OUTPUT_FILE" << EOF
## Progress Made

<!-- Add end-of-day summary -->
EOF

echo ""
echo "Done! Generated: $OUTPUT_FILE"
echo ""
echo "Next steps:"
echo "  1. Edit the log to add 'What I Worked On' summary"
echo "  2. Add highlights for each project section"
echo "  3. Fill in 'Progress Made' summary"
