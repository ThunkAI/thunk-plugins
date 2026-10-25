<!-- GENERATED, DO NOT EDIT: built from the Thunk.AI help article `show-a-thunk-in-the-claude-desktop-app`. Edits here are overwritten and never committed; change the article in the source repository instead. -->

> Help articles bundled in this skill's folder: `build-thunks-with-the-builder-mcp` is `SKILL.md`; `analyze-a-thunk-with-the-builder-mcp` is `analyzing.md`; `show-a-thunk-in-the-codex-desktop-app` is `codex-desktop-app.md`.

This guide is for AI agents running in the **Claude desktop app** (or in a
cloud session linked to the user's computer) that work on thunks through the
**Thunk.AI Builder MCP**. It covers how to open a thunk in the app's browser
pane and keep the pane on what you are working on. Why you show the thunk, and
which view to show for each change, are in
Building thunks with the Builder MCP (help article `build-thunks-with-the-builder-mcp`)
(**Open the thunk in the browser pane**). For the Codex desktop app, read
Showing a thunk in the Codex desktop app (help article `show-a-thunk-in-the-codex-desktop-app`)
instead.

## At the start of a session

Open the tenant's Thunk.AI app in the browser pane and complete steps 3–5 of
**Open and keep the pane** (site approval, sign-in, a visible pane) before
building, so the user approves and signs in once, up front. The tenant's app
is the site of any thunk `url` the Builder MCP returns (for example from
the thunk list).

## Open and keep the pane

The browser pane's tools are named `mcp__Claude_Browser__*` in a desktop
session and `mcp__remote-devices__Claude_Browser__*` in a cloud session linked
to the user's computer. This guide names them by the part after that prefix.

1. **Load the tools in one call.** If the browser-pane tools are deferred, load
   them all with one ToolSearch whose query is the full prefix, with
   `max_results: 64`. If the only tool present is
   `enable__mcp__remote-devices__Claude_Browser`, call it first.
2. **Reuse an existing tab.** Call `tabs_context`. If a tab is already on the
   thunk URL's site, `navigate` that tab (its `tabId`) to the thunk URL.
   Otherwise call `preview_start` with the thunk URL.
3. **Handle site approval.** If the call says the site isn't allowed yet and
   the session has `request_access`, call it with the site's URL (such as
   `https://<the thunk URL's host>`) and scope `"site"`, so it isn't asked
   again in later sessions. Wait for the answer, then retry once. If it is
   declined, or there is no `request_access`, say so in one line and carry on.
4. **Check the page.** Use `read_page`, or take one small screenshot
   (`computer`, scale 0.5). This checks the state of the pane (a banner, the
   sign-in screen), not how the thunk is configured.
   - If a cookie banner shows, choose the most privacy-preserving option
     ("Only Essential").
   - If the Thunk.AI sign-in screen shows, never sign in on the user's
     behalf. Tell them to sign in with Google or Microsoft in the pane. The
     pane keeps its own sign-ins, separate from their regular browser, so this
     is needed once.
5. **Make sure they can see it.** If `tabs_context` reports the pane as
   hidden, tell the user to press Cmd+Shift+B (Mac) or Ctrl+Shift+B
   (Windows), or to close what's in the side panel and click the globe icon.
   Opening a page does not bring a hidden pane forward on its own.
6. **If the pane can't be reached** (no browser tools after the load, or calls
   error or time out), tell the user in one line that the Claude app's browser
   isn't reachable and that they can open the thunk link themselves. Don't
   retry, and don't switch to Claude in Chrome unless they ask.
7. **Keep it current.** Navigate the same tab as you work, following
   **Show each change in the pane** in
   Building thunks with the Builder MCP (help article `build-thunks-with-the-builder-mcp`). Don't open
   a new tab for each view.
