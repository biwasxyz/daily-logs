#!/bin/bash
# generate-log.sh
# Generates a daily summary log by scanning all git repos for commits
# and fetching PRs/issues from GitHub
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

# Directories to scan for git repos
SCAN_DIRS=(
  "$HOME/repos/private"
  "$HOME/repos/contrib"
  "$HOME/repos/forks"
)

# Output file
OUTPUT_FILE="$LOGS_DIR/${TARGET_DATE}-daily-summary.md"

# Ensure logs directory exists
mkdir -p "$LOGS_DIR"

echo "Generating log for: $TARGET_DATE"
echo "Scanning directories: ${SCAN_DIRS[*]}"
echo ""

# Temp files for collecting data
COMMITS_FILE=$(mktemp)
REPOS_FILE=$(mktemp)
PRS_FILE=$(mktemp)
trap "rm -f $COMMITS_FILE $REPOS_FILE $PRS_FILE" EXIT

# Find all repos with commits on the target date
total_commits=0
total_projects=0

for scan_dir in "${SCAN_DIRS[@]}"; do
  if [ -d "$scan_dir" ]; then
    find "$scan_dir" -maxdepth 2 -name ".git" -type d 2>/dev/null | while read gitdir; do
      repo=$(dirname "$gitdir")
      repo_name=$(basename "$repo")

      # Get commits for the target date
      commits=$(git -C "$repo" log --oneline --format="%h|%s" \
        --after="${TARGET_DATE}T00:00:00" \
        --before="${TARGET_DATE}T23:59:59" 2>/dev/null || true)

      if [ -n "$commits" ]; then
        count=$(echo "$commits" | wc -l | tr -d ' ')
        echo "$repo_name|$count|$repo" >> "$REPOS_FILE"
        echo "$commits" | while read line; do
          echo "$repo_name|$line" >> "$COMMITS_FILE"
        done
      fi
    done
  fi
done

# Count totals
if [ -f "$REPOS_FILE" ] && [ -s "$REPOS_FILE" ]; then
  total_projects=$(wc -l < "$REPOS_FILE" | tr -d ' ')
  total_commits=$(wc -l < "$COMMITS_FILE" | tr -d ' ')
fi

if [ "$total_commits" -eq 0 ]; then
  echo "No commits found for $TARGET_DATE"
  exit 0
fi

echo "Found: $total_projects projects, $total_commits commits"

# Fetch PRs from GitHub for the date
echo ""
echo "Fetching PRs from GitHub..."
total_prs=0

# Get PRs merged on this date from GitHub
if command -v gh &> /dev/null; then
  # Search for PRs by the user merged on this date
  gh_user=$(gh api user --jq '.login' 2>/dev/null || echo "")
  if [ -n "$gh_user" ]; then
    # Get PRs authored and merged
    gh search prs --author="$gh_user" --merged="$TARGET_DATE" --json repository,title,number,url --limit 50 2>/dev/null | \
      jq -r '.[] | "\(.repository.nameWithOwner)|\(.number)|\(.title)|\(.url)"' >> "$PRS_FILE" 2>/dev/null || true

    if [ -f "$PRS_FILE" ] && [ -s "$PRS_FILE" ]; then
      total_prs=$(wc -l < "$PRS_FILE" | tr -d ' ')
    fi
  fi
fi

echo "Found: $total_prs PRs merged"
echo ""

# Collect all tags from repo names
tags="commits"
if [ -f "$REPOS_FILE" ]; then
  while IFS='|' read -r name count path; do
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

**${total_projects} projects | ${total_commits} commits | ${total_prs} PRs merged**

## What I Worked On

<!-- Add a brief summary of the day's focus -->

EOF

# Add project sections
if [ -f "$REPOS_FILE" ]; then
  while IFS='|' read -r repo_name count repo_path; do
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
