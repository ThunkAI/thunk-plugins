#!/bin/sh
# Codex PostToolUse hook (thunk-skills): after a Builder tool that has a follow-up (follow-ups.tsv,
# the same table as FOLLOW_UPS in ../register.tsx), tells the model the next step to lead its
# "Next steps" with and to put on the thunk card. The Codex counterpart of the Claude pane's
# next-step button. See docs/codex-thunk-pane-design.md.
dir=$(dirname "$0")
input=$(cat)

# A failed call raises no next step.
if printf '%s\n' "$input" | grep -q '"isError"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

# Codex writes tool_name before the tool's input and response, so the first match is the field.
tool=$(printf '%s\n' "$input" |
  grep -o '"tool_name"[[:space:]]*:[[:space:]]*"[A-Za-z0-9_-]*"' | head -n 1 |
  sed 's/.*"\([A-Za-z0-9_-]*\)"$/\1/')
# A Builder server is any MCP server whose name contains "thunk"; Codex turns its hyphens into
# underscores (mcp__thunk_builder__create_thunk). Name no tenant here: the marketplace export
# refuses a file that names another edition's tenant.
case "$tool" in mcp__*thunk*__*) ;; *) exit 0 ;; esac
verb=${tool##*__}
case "$verb" in "" | *[!a-z_]*) exit 0 ;; esac

tab=$(printf '\t')
row=$(grep "^$verb$tab" "$dir/follow-ups.tsv") || exit 0
label=$(printf '%s\n' "$row" | cut -f 2)
prompt=$(printf '%s\n' "$row" | cut -f 3)
text="Thunk.AI next step: $label. Lead your Next steps list with it, worded for the person to ask as: $prompt If you call show_thunk_card for this thunk, pass it as nextStep with this label and prompt."
escaped=$(printf '%s' "$text" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')
printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"%s"}}\n' "$escaped"
