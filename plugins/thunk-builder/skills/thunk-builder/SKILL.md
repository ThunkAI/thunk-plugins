---
name: thunk-builder
description: >-
  How to build, analyze and explain thunks with the Thunk.AI Builder MCP (tools such as
  create_thunk, get_definition, batch_steps, run_work_item, get_help_article; connected as
  thunk-builder, Thunk.AI or another name): which help articles to read before designing
  or editing a thunk, step AI instructions, schema, tools and connections, running and
  testing work items, diagnosing a run, MCP export or chat apps; the order to build in
  (steps and tool outlines first); opening the thunk in the side-panel browser (the Claude
  desktop app's browser pane, or Codex's) so the user can watch. Also analyzing a thunk,
  often a customer's production thunk you must not edit: troubleshoot a work item or step,
  run a health check, or clean it up / upgrade it in a mocked copy with tests and a .docx
  report. And explaining a thunk, or the platform through one, as a guided tour in the
  browser pane. Use whenever you are about to build, change, test, analyze, troubleshoot,
  review, debug or explain a thunk through the Builder MCP.
---

<!-- GENERATED, DO NOT EDIT: built from the Thunk.AI help article `build-thunks-with-the-builder-mcp`. Edits here are overwritten and never committed; change the article in the source repository instead. -->

> Help articles bundled in this skill's folder: `analyze-a-thunk-with-the-builder-mcp` is `analyzing.md`.

This skill is for working on Thunk.AI thunks through the **Thunk.AI Builder MCP**. It covers a
few different kinds of task, and each one has its own instructions.

## Pick your path

| The user asks you to | Path | Its instructions |
| --- | --- | --- |
| Build a new thunk, or change, copy or test one | Build or change | **Build or change a thunk** |
| Explain what a thunk does, or teach the platform through one | Explain | **Explain a thunk** |
| Find out why a work item or step failed or did the wrong thing | Troubleshoot | **Troubleshoot or analyze a thunk**: `analyzing.md`, Scenario A |
| Check a thunk over, or clean it up, review or upgrade it | Analyze | **Troubleshoot or analyze a thunk**: `analyzing.md`, Scenarios B and C |

If you can't tell which path the user wants, ask, with the paths as numbered choices. Paths
chain (a health check often ends in a troubleshoot or a cleanup, and a troubleshoot in a
change), so say when you switch.

Every path follows the **Common instructions** first. The help articles to read for each task
are listed at the end, under **Help articles for each task**.

## Common instructions

These apply to every path.

### The Builder MCP and its tools

The help center (info.thunk.ai) is the source of truth for how to build good
thunks.

The tools this guide names belong to the **Thunk.AI Builder MCP**
(`/api/builder/mcp` on your Thunk.AI tenant). Its name depends on how it was
connected: `thunk-builder` as a local MCP server, a claude.ai connector such
as Thunk.AI, a Claude Code plugin per tenant, whose tools appear as
`mcp__plugin_thunk-<tenant>_thunk-builder__*`, or a Codex plugin per tenant,
whose server is named `thunk-<tenant>`. This guide names tools by their bare
names (`get_definition`, `batch_steps`); use them from whichever of those
servers this session has. This guide tells you **which articles to read** for
the task in front of you. Read them before you act; do not work from memory.

### Start a session first

If the Builder MCP has a `create_session` tool, call it before anything else
with a short `title` and a `description` of what you are building. Read the
instructions it returns and pass the returned `sessionId` to every other
Builder tool. Where the server requires sessions, a call without a valid
`sessionId` is refused with `session_required` or `session_not_found`: call
`create_session` again and carry on. Over HTTP the id travels in the
`X-Builder-Session` header instead. Sessions are yours alone and show up under
Account → Builder → Sessions.

### More than one tenant

Each Thunk.AI tenant (such as the public one and a dedicated customer tenant)
is a separate server with its own thunks and accounts, and a thunk id exists
on only one of them. If this session has the Builder MCP for more than one
tenant, find out which tenant the user means before the first call, ask if it
isn't clear, and keep every call for that thunk on that server. Never copy a
design or data from one tenant to another unless the user asks for exactly
that.

### The Builder MCP informs; the browser pane shows

Treat the browser pane (the in-app browser) as a presentation vehicle for the
user, not as an information source for your work or your explanation. Get
thunk facts and configuration from the Builder MCP, especially
`get_definition` and `get_thunk`. Use the pane to navigate to and display the
relevant part of the app for the user; do not rely on its page text,
screenshots or controls to learn how the thunk is configured. If the UI
appears to differ from what the Builder MCP returns, tell the user about the
difference and verify it through the Builder MCP.

### Open the thunk in the browser pane

This is mandatory, not optional. As soon as `create_thunk` or `copy_thunk`
returns a `url` (or, when working on an existing thunk, as soon as `get_thunk`
or `list_thunks` returns one), open that URL beside the conversation so the
user can watch the thunk while you work on it. Do this for every thunk you
build, copy, edit, inspect, analyze, troubleshoot, review or report on,
before continuing with other work, and always put the clickable link in your
message too. Reuse the current browser tab when possible. If opening fails or
no browser pane is available, say so and give the link anyway. Do not treat
this as optional because the user did not explicitly ask to see the UI.
Never let it hold up the build. The panel is mainly for the
user to watch. Make changes through the Builder MCP tools by default: they are
faster and more reliable than the UI, and their results can be checked.

**At the start of a session in the Claude desktop app**, open the tenant's
Thunk.AI app in the browser pane and complete steps 3–5 of
**In the Claude desktop app** (site approval, sign-in, a visible pane) before
building, so the user approves and signs in once, up front. The tenant's app
is the site of any thunk `url` the Builder MCP returns (for example from
`list_thunks`).

**When the user asks to see it done in the UI.** If the user explicitly asks to
see how to do something in the Thunk.AI app (for example "show me how to add a
step in the UI" or "walk me through connecting Gmail"), you may drive the app in
the side-panel browser: navigate, click and type there, and say what you are
doing at each step so they can follow along and do it themselves next time.
Where the session has no tools that can drive that browser, describe the clicks
for them to follow instead.

- Do only what they asked to see, then go back to the Builder MCP for the rest
  of the work, and check the result with `get_definition`.
- A general request such as "build it" or "fix it" is not a request to use the
  UI. Neither is an MCP call that failed or seems slow.
- Never sign in for the user, and ask before anything in the UI that deletes,
  publishes, shares or touches a live external system.

#### Show each change in the pane

Once the pane is open, keep it on what you're working on. Whenever you change
the thunk through the Builder MCP, or fetch specific information from it,
navigate the pane to the view that shows it: before the call, so the user
watches the change land, or after it, to show what you changed or found.
If the page doesn't show the change after the call, navigate to the same URL
again to reload it.

Do this by **changing the URL only**: `navigate` the same tab (Claude desktop)
or call `open_in_codex` again (Codex). Never click through the app to get
there. Navigate once per view, not once per call, and skip it if the pane is
already there. Prefer a `url` the tool returned; otherwise build one on the
thunk URL's host (`<host>` in the table):

| What you changed or fetched | URL to show |
|---|---|
| The thunk as a whole (`get_thunk`, `get_definition`) | the thunk's `url` |
| A step (`batch_steps`) | that step's `url` from `get_definition` |
| A work item (`create_work_item`, `run_work_item`, `get_work_item_state`) | the work item's `url` |
| One step's run on a work item (`get_step_history`, or a step in `get_work_item_state`) | that step run's `url` |
| Test work items / test results (`batch_work_item_tests`, `query_work_items`) | `<host>/thunk/<thunkId>/testing?testingTab=rows` / `?testingTab=results` |
| Connections and their tools (`add_thunk_connection`, `batch_connections`, `refresh_connection_tools`) | `<host>/thunk/<thunkId>/tools` |
| Errors (`get_errors`) | an error's `runUrl`, or `<host>/thunk/<thunkId>/monitor?tab=errors` |
| Review (`run_review`, `get_review`) | the review's `url` |
| Reports (`batch_reports`, `run_report`) | `<host>/thunk/<thunkId>/monitor/reporting` |
| Files and folders (`batch_content_folders`, `upload_files`) | `<host>/thunk/<thunkId>/files` |
| MCP export (`set_export`) | `<host>/thunk/<thunkId>/deployment?deployTab=export` |
| Thunk options (`set_options`) | `<host>/thunk/<thunkId>/settings` |
| Members (`add_thunk_members`) | `<host>/thunk/<thunkId>/team` |

For anything not listed, show the thunk's `url`. If the pane isn't open (no
side-panel browser, or it couldn't be reached), give the URL as a link
instead. This doesn't apply to work you do on a thunk that is not the one in
the pane, such as reading a source thunk while building a copy.

#### In the Claude desktop app

The browser pane's tools are named `mcp__Claude_Browser__*` in a desktop
session and `mcp__remote-devices__Claude_Browser__*` in a cloud session linked
to the user's computer. Below they are named by the part after that prefix.

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
   **Show each change in the pane**. Don't open
   a new tab for each view.

#### In the Codex desktop app

Call `mcp__codex_app__open_in_codex` with
`target: { type: "browser", url: "<the thunk's url>" }` and
`placement: "right"`. Do this as soon as the thunk's URL is available, for
every thunk task (not only builds), and reuse the current browser tab when
possible. If the panel opens asynchronously, the app shows it when it is
ready; carry on with the work. If the call fails or no browser pane is
available, say so in one line and give the clickable link anyway.

#### Elsewhere

In the Claude Code terminal, Cursor, Claude chat without the desktop app, or
any agent with no side-panel browser, give the thunk's link (`url` in the
`get_thunk` result) and carry on. Don't build a page of the thunk or write one
to a file for the user to open.

In every case, give step links (each step's `url` in `get_definition`) when
you discuss a specific step.

### Files

For a FILE or IMAGE input, or a content folder, never send a file's
contents as base64 in a tool argument. If the file is at a public URL, pass it to `upload_files`. If it is on your machine (one you made, or one the
user gave you), call `create_upload_link` and send the file from your shell.
It returns an `uploadUrl` and an `uploadToken`. PUT each file's raw bytes to
`uploadUrl`, one file per request, with the token in the `X-Upload-Token`
header and the file name in the `name` query parameter:

```
curl -T invoice.pdf -H "X-Upload-Token: <uploadToken>" \
  -H "Content-Type: application/pdf" "<uploadUrl>?name=invoice.pdf"
```

You need no other sign-in. Each response lists the files stored so far; use
their `files[].url` in `create_work_item` data or in `batch_content_folders`
`add_files`, or read them again later with `get_upload_link`. A link lasts 30
minutes and takes up to 5 files of up to 16 MB each. The token is returned
only once: keep it to yourself and don't show it in your replies. If you
can't run commands that reach the network, ask the user to put the file at a
public URL for `upload_files`.

### Offer numbered choices when you stop

Whenever you pause for the user's input (a question, a decision, a proposal
to approve, the end of a stage), end your message with a few sensible next
steps as a numbered list, the one you recommend first, so the user can reply
with just a number. They can still answer in their own words.

### How to read an article

- Call `get_help_article` with the article's **slug** (the slugs for
  each task are under **Which articles for which task**).
- Not sure which slug? `search_help_center` with a short query.
- Every Builder tool description also ends with
  `Help articles (get_help_article slugs): …` — those are the articles for that
  specific tool. Read them the first time you use the tool in a session.
- Read 1–3 articles per task, not all of them. Where articles disagree,
  the more specific one wins.

### Rules

- Never guess a slug. If one this guide names returns not-found, `search_help_center`
  for its title instead. A new article becomes readable only after the
  next Thunk.AI release.
- Don't paste article text back into a thunk's instructions. Apply the
  guidance in your own words for that thunk.
- If an article is wrong or missing something you needed, report it with
  `submit_feedback`.

### Before finishing

- Did I open the relevant thunk in the in-app browser and include its link?
- Did every fact I gave about the thunk come from the Builder MCP, not from
  the browser pane?
- If I'm waiting for the user, did I end with numbered choices?

## Build or change a thunk

### Build order

**Build skeleton first, then test it right away.** Lay out the whole thunk
early (its steps, and an outline of its tools), breadth first, then fill it
in one step at a time. Stand in mocks for external systems, and as soon as
it is built, create realistic test data for the main path and run it. Edge
cases, failure cases and the design review come later, when you harden the
nearly finished design.

The user is watching the thunk while you build, in the Thunk.AI app (in the
side-panel browser, or from the link you gave). Build **skeleton first** (breadth first):
make the shape of the whole thunk appear, then fill it in one step at a time.
Don't build it layer by layer (every property, then every tool in full
detail, then finally the steps): that leaves an empty Workflow Plan on screen
for most of the build, and the user can't tell what you are making.

For a new workflow or chat-app thunk:

1. **Create it with every step laid out, then open it.** If
   `create_thunk` accepts `steps` (check its input schema), pass them all in
   the create call, in order and chained by status (`New` → … → the last
   step's final status), plus any `properties` the design already fixes.
   Otherwise `create_thunk`, then one `batch_steps` call that adds the same
   steps. Give each step its real title and a short paragraph of directions
   saying what the step is for. Leave out `toolConfig`, and any binding to a
   property that doesn't exist yet. Check the `results` the response gives
   for its `steps` and `properties` (or the batch's `results`) and fix any
   `error` entry with the batch tools. Then
   open the thunk in the browser pane (see **Open the thunk in the browser
   pane**)
   and give its link.
2. **Decide real or mock for each external system.** For every outside
   system the workflow reads or changes (a CRM, email, a ticketing system, a
   database), look in `get_definition` for an account connection that
   already reaches it. If there is a suitable one, **ask the user** whether
   to use it or a mock; never wire a live connection into a new thunk
   without asking. Otherwise, and whenever the user prefers, build a
   **mock**: an MCP-server thunk (`create_thunk kind:"mcpServer"`) of
   deterministic code tools with the real system's tool names and realistic
   answers, published with `set_export` and added to this thunk with
   `add_thunk_connection`. The rules for good stand-ins are in
   `improve-a-live-thunk-safely` and in `analyze-a-thunk-with-the-builder-mcp` (C3).
   Tell the user which systems are mocked.
3. **Outline the tools.** One `batch_tools` call that adds each custom tool
   the design needs, with its final name, description, `intent` and input
   schema, and a stub implementation: a short `code` body that returns a
   "not implemented yet" message. Stub an `ai` tool as an `ai` tool (with
   one-line `userGuidance`), because a new AI tool picks up the thunk's
   enabled tools only when it is added, not when a stub is changed into one.
4. **Fill in each step, depth first, in plan order.** For one step at a time:
   - add the properties it reads and writes (`batch_properties`) and bind them
     on the step (`batch_steps` update `inputProperties` / `outputProperties`);
   - write its full directions;
   - replace the stubs of the tools it uses with real implementations
     (`batch_tools` update, with the full definition), check each with
     `run_tool`, and enable them on the step (`toolConfig`);
   - set the plan's input bindings while doing the first step and its output
     bindings while doing the last (`batch_plan_bindings`).

   Finish a step before starting the next. When a step is done, you can run a
   test work item through it before moving on.
5. **Test the main path as soon as it is built**, without waiting to be
   asked. Create test data: a few work items for the typical cases the
   thunk will see most, with `create_work_item` and `tests` so each is a
   test work item with assertions on its expected outputs. Leave edge cases
   and failure cases for hardening (step 6): while the design is still
   changing, they cost runs and fixes on behavior that may not last. Run
   them, read the results (`get_work_item_state`, `get_step_history`), and
   fix what fails. Where the user chose a real connection over a mock, a
   test run reads and changes that real system: say what it will do and get
   their go-ahead first. Then tell the user what you tested and what passed.

   **Use realistic inputs.** Test data should look like what the thunk will
   get in production: realistic names, amounts and wording, in the real
   formats. For an IMAGE or FILE input, use a real document or image, not a
   placeholder: fetch one from a public URL with `upload_files`, or build
   one locally for the test (for example a PDF invoice laid out the way real
   ones are, or a scanned-looking image of a receipt) and upload it with
   `create_upload_link` (see **Files**). Tidy inputs
   pass tests that real ones fail (`building-a-test-plan`).
6. **Harden it when the design is nearly complete.** Once the main path
   passes and the steps and tools have stopped changing, add test work items
   for the edge and failure cases: the edge of the range, missing data, bad
   input, a required input left out, each branch, and the things the thunk
   must *not* do (`building-a-test-plan`). Run them; the go-ahead rule for a
   real connection in step 5 applies here too. Then run the design review
   (`run_review`, poll `get_review`; `workflow-review`). It is slow and
   costly, so run it once here rather than during the build, and again only
   after a set of fixes is finished. Tell the user what the hardening tests
   and the review found, and what you fixed.

Don't run work items through a step whose tools are still stubs.

For an MCP-server thunk, the interface is the outline: create it with its
tool signatures (`create_thunk` with `kind: "mcpServer"` and an `interface`,
or one `batch_tools` call of stubs), open the thunk and give its link, then
implement and
`run_tool`-check one tool at a time, and publish the export (`set_export`)
when they work.

When you change an existing thunk, apply the same idea: add any new steps and
tool outlines first, then fill them in one at a time.

## Explain a thunk

When the user asks for an explanation, first tell which of two asks it is:

1. **Explain this thunk**: the thunk's purpose, workflow, data, tools and
   features. Assume the user knows the platform, and explain how this thunk
   uses it.
2. **Explain the platform through this thunk**: use the thunk as a teaching
   example and guide the user through the Thunk.AI app, explaining each
   platform concept as well as how this thunk uses it.

Both follow the same flow; the only difference is whether you also explain
the platform. If you can't tell which one the user wants, ask, with the two as
numbered choices.

1. **Read the thunk through the Builder MCP first**, with `get_thunk` and
   `get_definition`, so that you explain its actual design. Read the help
   articles for the parts you will explain (see **Which articles for which
   task**), especially for the second ask.
2. **Open the thunk in the browser pane** and give its link (see **Open the
   thunk in the browser pane**). Tell the user the sections of the tour
   in a short list. A usual order is: the thunk's purpose, the Workflow Plan
   and its steps, the work item's data (properties), tools and connections,
   files and content folders, tests, and options such as approval gates.
   Leave out the sections this thunk doesn't use.
3. **Show and explain one section at a time.** Navigate the pane to the view
   for that section (the URLs in **Show each change in the pane**), then
   explain it, mapping the platform concept to this thunk's configuration.
   Keep the UI read-only: navigate and show, but never save, run, delete,
   publish or share anything there. With no browser pane, give the link to
   each section's view instead.
4. **Stop after each section** and wait for the user to choose what to see
   next. Don't advance the tour until they choose to continue. End each
   section with numbered choices: **1. Continue the tour** (naming the next
   section), then two or three deeper dives into the section just shown. The
   user can reply with a number.
5. **After a deep dive, stay at the same place in the tour** and offer
   numbered choices again, with **1. Continue the tour** first.

Don't claim that a feature works just because a description or a step's
directions mention it. Check its configuration through the Builder MCP (for
example, that the tool is enabled on the step, that the connection exists,
that the property is bound), and say plainly when you couldn't verify
something.

An explanation changes nothing and runs nothing. If the user asks for a
change along the way, say so, and make it through the Builder MCP as for any
other edit.

## Troubleshoot or analyze a thunk

To analyze a thunk — often a customer's production thunk you must not edit —
read the `analyze-a-thunk-with-the-builder-mcp` article (`get_help_article`) before you start,
and follow it. It covers three scenarios: (A) troubleshooting one work item
or step, (B) a health check, and (C) a cleanup / upgrade done in a mocked
copy with tests from real data, a hand-over to the owner and a .docx report.
It works only through this Builder MCP; when the cause is the platform, it
files feedback and has the user raise a support ticket.

In this skill that article is `analyzing.md`, in this folder: read it there. Troubleshooting is its Scenario A; a health check is B; a cleanup, review or upgrade is C.

## Help articles for each task

### Start here (first thunk in a session)

| Slug | Why |
| --- | --- |
| `thunk-application-model` | The parts of a thunk and how they fit together |
| `tutorial-how-to-build-your-first-thunk` | End-to-end build walk-through |
| `building-thunks-from-reusable-parts` | Steps, tools and connections as reusable parts |

### Design the workflow

| Task | Slugs |
| --- | --- |
| Lay out steps / statuses (`batch_steps`) | `workflow-plan`, `workflow-orchestration` |
| Define work-item schema (`batch_properties`) | `schematized-state`, `file-and-image-property-types`, `conversation-properties-for-email` |
| Workflow inputs/outputs (`batch_plan_bindings`) | `workflow-plan`, `schematized-state` |
| Run a step only when / until a condition holds | `run-a-step-only-when-a-condition-matches` |
| Error handling and when a step saves results | `choose-how-a-step-handles-errors-and-when-it-saves-results` |
| Human approval / review gates (`set_options`) | `set-human-approval-gates-for-your-workflow`, `ai-governance` |
| Scheduled / recurring steps | `scheduled-work-on-workflow-steps` |
| How an agent finishes (conclude, ask, error) | `how-an-ai-agent-ends-a-run` |
| Recurring patterns | `work-tracker-pattern` |

### Write step AI instructions

Read **`how-to-write-effective-directions`** before writing or rewriting any
step instructions. It says what the platform already supplies (so you don't
restate it) and gives the guidelines for the logic that is left. Then:

| Slug | Why |
| --- | --- |
| `ai-instructions` | The parts of a step's AI instructions |
| `files-in-instructions-and-content-folders` | Referencing files and content folders |
| `ai-reliability-concepts-and-principles` | Why instructions fail and how the platform guards them |

### Tools, connections and content

| Task | Slugs |
| --- | --- |
| Pick / enable tools on a step (`toolConfig`) | `ai-tools`, `ai-tool-libraries`, `conditional-tool-availability` |
| Build custom tools (`batch_tools`) | `custom-tools`, `how-custom-code-tools-work`, `how-to-build-a-tool-wrapper` |
| Specific tool recipes | `how-to-build-a-custom-database-tool`, `how-to-build-a-spreadsheet-lookup-tool`, `how-to-build-a-tool-that-uses-a-conversation` |
| Test a tool (`run_tool`) | `testing-custom-tools` |
| Give a tool unit tests, run them, read graded results (`batch_tool_tests`, `get_tool_tests`) — test one tool without a work item; iterate with `run` + `caseIds` (not saved), then run the whole suite once (saved as its test status) | `testing-custom-tools`, `custom-tools` |
| Save reports, set up the report automation (scheduled report emails / summaries), run a report (`batch_reports`, `run_report`, `get_definition` section `reports`) — `batch_reports` is refused on Production; `run_report` works there | `how-to-save-a-report-from-your-work-items`, `send-reports-on-a-schedule-with-the-report-automation` |
| Connections (`add_thunk_connection`, `batch_connections`) | `connections-to-business-applications`, `connecting-to-external-systems-and-tools`, `reuse-thunk-interfaces-and-plug-in-connections` |
| Content folders (`batch_content_folders`) | `content-folders`, `spreadsheet-content-folders` |
| Documents, PDFs, spreadsheets | `working-with-documents-and-pdfs`, `working-with-spreadsheets`, `generate-documents-from-templates` |

### Kinds of thunk and how they are reached

| Task | Slugs |
| --- | --- |
| Chat App (`create_thunk kind:"chatApp"`, `convo_*`) | `set-up-the-hosted-chat-ui-for-your-thunk`, `conversational-interface-via-a-rest-api` |
| MCP server (`kind:"mcpServer"`, `set_export`) | `publish-your-thunk-as-an-mcp-server-for-ai-agents`, `modular-reuse-of-tools` |
| Inbound requests / webhooks | `inbound-requests`, `receive-requests-through-a-webhook-or-a-shared-form` |
| Copy a thunk (`copy_thunk`) | `how-to-copy-a-thunk` |
| Clean up or upgrade a live thunk in a copy, with stand-in tools | `improve-a-live-thunk-safely` |

### Run and test

| Task | Slugs |
| --- | --- |
| Create / run / rerun work items | `workflow-orchestration`, `manual-testing` |
| Automated tests (`batch_work_item_tests`) | `evals-automated-tests`, `building-a-test-plan` |
| Mock external systems for testing | `improve-a-live-thunk-safely`, `evals-automated-tests` |
| Production readiness | `shipping-enterprise-thunks-testing-and-quality-principles` |
| Design review (`run_review`, `get_review`) | `workflow-review` |
| Switch AI model (`set_options`, model definitions) | `move-a-thunk-to-a-new-ai-model`, `supported-ai-models-and-what-happens-when-they-change` |
| Pause / resume (`set_paused`) | `pause-and-restart-a-thunk` |
| Delete work items (`delete_work_items`) | `how-to-work-with-your-work-items-list`, `data-retention` |
| Propose people for a thunk (`add_thunk_members`; the user adds them at `shareUrl`) | `users-and-access-controls`, `users-organizations-and-governance` |

### Diagnose a run

| Symptom | Slugs |
| --- | --- |
| General health check / cleanup pass, or no specific symptom yet — read first, it sets the order (stuck → errors → wrong results → design review → time → cost) | **`check-a-thunks-health-where-to-start`** |
| A run failed / errored — find which workitems (`get_errors`) | **`reading-a-failed-run`**, `troubleshooting-errors` |
| Agent did the wrong thing / unreliable | `troubleshooting-ai-reliability-issues`, `ai-reliability-mechanisms`, then `how-to-write-effective-directions` to fix the instructions |
| Inspect what happened (`get_step_history`, `get_chat_message_llm_exchange`) | `step-diagnostics`, `tool-call-history-and-performance` |
| What a tool really received and returned, across work items (`get_tool_call_history`) | `tool-call-history-and-performance`, `testing-custom-tools` |
| Too slow | **`time-analysis-how-long-your-thunk-takes`**, `what-working-waiting-and-waiting-for-tool-mean` |
| Too expensive (`get_usage`) | **`token-costs-what-your-thunk-spends-on-ai`**, `understanding-llm-costs-and-latency` |
| Work item stuck waiting | `find-work-that-is-waiting-on-you`, `how-an-ai-agent-ends-a-run` |

Each of the bold articles opens with a **Concepts** section (how to think
about it) followed by **Details** (specific rules and cases). Read Concepts
first; go to Details for the specific case you're dealing with.
