# Codex CLI Skill Pack Sync

## Check Codex Installation

```bash
CODEX_SKILLS_DIR="${CODEX_HOME:-$HOME/.codex}/skills"
TOOLKIT_SKILLS_DIR="$(pwd)/.claude/skills"

# Dynamically discover all skills from toolkit directory, excluding toolkit-only
TOOLKIT_SKILLS=()
for skill_dir in "$TOOLKIT_SKILLS_DIR"/*/; do
  skill_name="$(basename "$skill_dir")"
  [[ "$skill_name" == .* ]] && continue
  # Skip toolkit-only skills (parse YAML frontmatter between --- markers)
  if sed -n '/^---$/,/^---$/p' "$skill_dir/SKILL.md" 2>/dev/null | grep -q '^toolkit-only: true'; then
    continue
  fi
  TOOLKIT_SKILLS+=("$skill_name")
done

# Discover all skills currently installed in Codex directory
CODEX_INSTALLED=($(ls -1 "$CODEX_SKILLS_DIR" 2>/dev/null | grep -v "^\\."))
```

**Note:** Skills are discovered dynamically from both toolkit and Codex directories. Skills with `toolkit-only: true` in their SKILL.md frontmatter are excluded from distribution.

## Status Classification

For each skill in toolkit, determine its status:

```bash
check_codex_skill() {
  local skill_name="$1"
  local codex_path="$CODEX_SKILLS_DIR/$skill_name"
  local toolkit_path="$TOOLKIT_SKILLS_DIR/$skill_name"

  if [[ ! -e "$codex_path" ]]; then
    echo "MISSING"
  elif [[ -L "$codex_path" ]]; then
    local target=$(readlink "$codex_path")
    if [[ "$target" == "$toolkit_path" || "$target" == *"/.claude/skills/$skill_name" ]]; then
      echo "SYMLINK_CURRENT"
    else
      echo "SYMLINK_OTHER"
    fi
  else
    if diff -rq "$codex_path" "$toolkit_path" >/dev/null 2>&1; then
      echo "COPY_CURRENT"
    else
      echo "COPY_OUTDATED"
    fi
  fi
}
```

| Status | Meaning | Action |
|--------|---------|--------|
| `MISSING` | Skill not installed | Offer to install |
| `SYMLINK_CURRENT` | Symlink to this toolkit | No action needed |
| `SYMLINK_OTHER` | Symlink to different toolkit | Skip |
| `COPY_CURRENT` | Copy, content matches | No action needed |
| `COPY_OUTDATED` | Copy, content differs | Offer to update |

## Orphan Detection

Detect skills in Codex that no longer exist in toolkit:

```bash
find_orphaned_skills() {
  local orphans=()
  for skill in "${CODEX_INSTALLED[@]}"; do
    if [[ ! -d "$TOOLKIT_SKILLS_DIR/$skill" ]]; then
      # Check if it's a symlink to this toolkit (now broken/orphaned)
      if [[ -L "$CODEX_SKILLS_DIR/$skill" ]]; then
        local target=$(readlink "$CODEX_SKILLS_DIR/$skill")
        if [[ "$target" == *"/.claude/skills/$skill" ]]; then
          orphans+=("$skill")
        fi
      # Or if it was copied from this toolkit (check for toolkit marker)
      elif [[ -f "$CODEX_SKILLS_DIR/$skill/.toolkit-source" ]]; then
        orphans+=("$skill")
      fi
    fi
  done
  echo "${orphans[@]}"
}
```

| Orphan Type | Description | Default Action |
|-------------|-------------|----------------|
| Broken symlink | Points to deleted toolkit skill | Delete |
| Copied with marker | Has `.toolkit-source` file | Prompt user |
| Unknown origin | No toolkit marker | Skip (not ours) |

## Sync Logic

```bash
sync_codex_skill() {
  local skill_name="$1"
  local status="$2"
  local codex_path="$CODEX_SKILLS_DIR/$skill_name"
  local toolkit_path="$TOOLKIT_SKILLS_DIR/$skill_name"

  case "$status" in
    MISSING|COPY_OUTDATED)
      rm -rf "$codex_path" 2>/dev/null || true
      cp -R "$toolkit_path" "$codex_path"
      # Mark as toolkit-managed for orphan detection
      echo "$TOOLKIT_PATH" > "$codex_path/.toolkit-source"
      echo "UPDATED"
      ;;
    SYMLINK_CURRENT|COPY_CURRENT)
      echo "CURRENT"
      ;;
    SYMLINK_OTHER)
      echo "SKIPPED"
      ;;
  esac
}

delete_orphaned_skill() {
  local skill_name="$1"
  local codex_path="$CODEX_SKILLS_DIR/$skill_name"

  rm -rf "$codex_path"
  echo "DELETED"
}
```

## Status Display

```
CODEX CLI SKILL PACK
────────────────────
Location: ~/.codex/skills
Status:   OUTDATED (3 skills need updating, 1 orphaned)

  Skill                  Status
  ──────────────────────────────────────
  fresh-start            SYMLINK_CURRENT
  phase-start            COPY_OUTDATED    ← needs update
  verify-task            MISSING          ← needs install
  multi-model-verify     ORPHANED         ← removed from toolkit
```

**If all symlinks:**
```
Status: CURRENT (all symlinks - auto-updating)
All {N} skills are symlinked to this toolkit. No sync needed.
```

**If orphaned skills found:**
```
ORPHANED SKILLS (removed from toolkit)
──────────────────────────────────────
The following skills no longer exist in the toolkit:
  - multi-model-verify

These will be deleted during sync.
```

**If not installed:**
```
Status: DIRECTORY NOT FOUND
To install: ./scripts/install-codex-skill-pack.sh
```
