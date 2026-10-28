#!/bin/sh
# Codex SessionStart hook (thunk-skills): puts the Thunk.AI "Next steps" rule in the model's
# context and, in the person's first session, a welcome. The Codex counterpart of the Claude
# hooks module's system-prompt rule and first-run toast. See docs/codex-thunk-pane-design.md.
dir=$(dirname "$0")

# A text file as the body of a JSON string: backslashes, then quotes escaped; line breaks as spaces.
json_text() {
  tr '\n\r\t' '   ' <"$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

# The hook input (session id, cwd, source) is not needed.
cat >/dev/null

context=$(json_text "$dir/session-rule.txt")
message=""
# PLUGIN_DATA is this plugin's own folder in the Codex home, kept across sessions and updates.
if [ -n "$PLUGIN_DATA" ] && [ ! -e "$PLUGIN_DATA/welcomed" ] &&
  mkdir -p "$PLUGIN_DATA" && : >"$PLUGIN_DATA/welcomed"; then
  context="$context $(json_text "$dir/first-run.txt")"
  message=',"systemMessage":"Welcome to Thunk.AI. Ask Codex what you can do with Thunk.AI, or try one of the Thunk.AI Skills plugin'"'"'s suggested prompts."'
fi
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}%s}\n' "$context" "$message"
