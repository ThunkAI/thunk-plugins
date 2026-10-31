<!-- GENERATED, DO NOT EDIT: built from the Thunk.AI help article `show-a-thunk-in-the-codex-desktop-app`. Edits here are overwritten and never committed; change the article in the source repository instead. -->

> Help articles bundled in this skill's folder: `build-thunks-with-the-builder-mcp` is `SKILL.md`; `analyze-a-thunk-with-the-builder-mcp` is `analyzing.md`; `show-a-thunk-in-the-claude-desktop-app` is `claude-desktop-app.md`.

This guide is for AI agents running in the **Codex desktop app** that work on
thunks through the **Thunk.AI Builder MCP**. It covers how to open a thunk in
the app's in-app browser and keep that tab on what you are working on. Why you
show the thunk, and which view to show for each change, are in
Building thunks with the Builder MCP (help article `build-thunks-with-the-builder-mcp`)
(**Open the thunk in the browser pane**). For the Claude desktop app, read
Showing a thunk in the Claude desktop app (help article `show-a-thunk-in-the-claude-desktop-app`)
instead.

## Open the thunk once, then move that tab

**Every `open_in_codex` call opens a new tab.** It takes no tab to reuse and
returns none, so calling it for each view fills the panel with tabs. Call it
**once per session** to open the thunk, then move that same tab:

1. **Open the thunk once.** Call `mcp__codex_app__open_in_codex` with
   `target: { type: "browser", url: "<the thunk's url>" }` and
   `placement: "right"`, as soon as the thunk's URL is available, for every
   thunk task (not only builds). The panel opens asynchronously; carry on with
   the work. If the call fails or no browser panel is available, say so in one
   line and give the clickable link anyway.
2. **Change the view by moving that tab, when Computer Use is available.** If
   the session has Computer Use (`cua_repl`), navigate the existing in-app
   browser tab instead of opening another one. Call
   `cua.listTabs({ browser: "iab" })`, pick the tab whose `url` is on the
   thunk URL's site, bind it with `cua.getTab(tab.id, { browser: tab.browserId })`,
   and call `goto("<the new url>")` on it. Only change its URL; don't click or
   type there. Use the tab `id` and `browserId` that `listTabs` returns, not a
   URL: binding a tab by URL can fail with "Tab not found".
3. **Without Computer Use, don't call `open_in_codex` again** for each view.
   Give the link to the new view in your message instead, and let the user
   open it. Call `open_in_codex` again only when the user asks to see it in
   the panel, or says they closed the tab. With Computer Use, also call it
   again when `listTabs` shows no tab on the thunk URL's site.

## The Thunk.AI card

The Codex app shows a **Thunk.AI card** in the conversation under some Builder
tool results. You don't call anything to show it:

- **The home card** appears when you start a Builder session. A user new to
  Thunk.AI sees first things to try. Anyone else sees buttons to list their
  thunks, build a new one or check them for errors.
- **A thunk's card** appears when you read a thunk's summary, or create or
  copy a thunk, once the thunk is ready. It shows the thunk's name, its phase
  and whether it is paused, with buttons to analyze it, explain it, debug its
  errors, suggest improvements or open it. A public sample's card offers to
  explain it, copy it or open it.

A button sends its prompt as the user's own message: treat it as their
request. Don't read the thunk again just to show the card. The card is not a
view of the thunk: keep the thunk itself in the in-app browser, as in **Open
the thunk once, then move that tab**. The card doesn't carry your suggested
next step, so still end your reply with the next steps. Where the card does
not render (in the Codex CLI, for example), there is nothing extra to do.
