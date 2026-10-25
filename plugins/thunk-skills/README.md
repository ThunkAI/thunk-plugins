# Thunk.AI Skills

Build, test and analyze [Thunk.AI](https://thunk.ai) thunks from Claude: AI agents that carry
out a business process step by step, with your tools and human review where you need it.

This plugin carries:

- **The `thunk-guide` skill**: which Thunk.AI help articles to read, the order to build a
  thunk in, and how to test, troubleshoot and clean up a thunk.
- **A Thunk.AI pane and next steps** (Claude Code): a pane beside the chat with a first-run
  welcome, things to try and your most recent thunks (the last list Claude looked up; **Show my thunks** asks it to); after Claude uses a Builder tool, a
  suggested next step above the prompt, and Analyze, Explain, Debug errors and Suggest
  improvements for the thunk you have open; `/thunk <name or id>` opens a thunk, `/thunk` the
  pane, and `/thunk-welcome` shows the welcome again. These show in the Claude desktop app's Code tab. In the terminal nothing shows
  unless you run `/thunk` or `/thunk-welcome`, and they do not run in claude.ai or Cowork.

The Builder MCP tools come from the plugin for your Thunk.AI tenant, which installs this one
with it.

## Install

Add the Thunk.AI marketplace (the public one is below; a private edition comes with its own),
then install your tenant's plugin from it with `/plugin`:

```bash
claude plugin marketplace add ThunkAI/thunk-plugins
```

Then run `/mcp`, select
its `thunk-builder` server, choose **Authenticate** and sign in with your Thunk.AI account.
The Thunk.AI pane opens at the next session start and lists your thunks once you are signed in.

## Files

| Path | What it is |
| --- | --- |
| `skills/thunk-guide/` | The skill, built from help-center articles (not committed in thunk-web) |
| `hooks/register.tsx` | The Claude Code hooks module: the pane, the next-step band and system prompt rule |
| `hooks/pane.test.tsx` | Its tests: `claude plugin test .` |
| `types/index.d.ts` | The module's `$.state` contract |
| `plugin.json` | Codex's manifest; `.claude-plugin/plugin.json` is Claude's |

## License

Apache-2.0
