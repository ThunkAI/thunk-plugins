# Thunk.AI plugins for Claude and Codex

Build, test and analyze [Thunk.AI](https://thunk.ai) thunks (AI workflow automations) from
Claude Code and from Codex. This repository is the `thunk-ai` plugin marketplace.

| Plugin | What it adds |
| --- | --- |
| `thunk-builder` | The thunk-builder skill: which [Thunk.AI help articles](https://info.thunk.ai) to read for a task, the order to build a thunk in, and how to test, troubleshoot and clean up a thunk. |
| `thunk-prod` | The Thunk.AI Builder MCP server (`https://postern.thunk.ai/api/builder/mcp`): tools to create, edit, run and inspect thunks as your own Thunk.AI account. |

## Claude Code

```bash
claude plugin marketplace add ThunkAI/thunk-plugins
claude plugin install thunk-prod@thunk-ai
```

Installing `thunk-prod` installs `thunk-builder` too. In a session that is already open, run
`/reload-plugins`.

Then, once:

1. **Sign in.** Run `/mcp`, select `plugin:thunk-prod:thunk-builder`, choose
   **Authenticate** and sign in with your Thunk.AI account.
2. **Turn on auto-update.** Run `/plugin`, open **Marketplaces**, select `thunk-ai` and
   choose **Enable auto-update**. Claude Code keeps auto-update off for marketplaces outside
   Anthropic's own, and we publish changes to these plugins often. With it on, Claude Code
   fetches updates in the background and tells you to run `/reload-plugins`.

Without auto-update, get updates by hand with `/plugin marketplace update thunk-ai`, then
`/reload-plugins`.

## Codex

```bash
codex plugin marketplace add ThunkAI/thunk-plugins
codex plugin add thunk-builder@thunk-ai
codex plugin add thunk-prod@thunk-ai
codex mcp login thunk-prod
```

Codex has no plugin dependencies, so add both plugins. Codex copies a plugin when you add it:
to update, run `codex plugin marketplace upgrade thunk-ai`, then `codex plugin add` each
plugin again.

## Claude and ChatGPT chat

Chat apps don't install plugins. Add the Builder MCP as a custom connector instead, with the
URL `https://postern.thunk.ai/api/builder/mcp`, and sign in with your Thunk.AI account.

## About this repository

The files here are generated from Thunk.AI's own repository and published automatically, so
pull requests can't be merged here. To report a problem or suggest a change, open an issue.

Licensed under the [Apache License 2.0](LICENSE).
