---
name: thunk-builder
description: >-
  How to build and analyze thunks with the Thunk.AI Builder MCP (tools such as
  create_thunk, get_definition, batch_steps, run_work_item, get_help_article — connected
  as thunk-builder, Thunk.AI or another name): which help articles to read before
  designing or editing a thunk, writing step AI instructions, schema, tools and
  connections, running and testing work items, diagnosing a run, MCP export or chat apps;
  the order to build in (steps and tool outlines first); opening the thunk in the
  side-panel browser (the Claude desktop app's browser pane, or Codex's) as soon as its
  url comes back, so the user can watch it being built (driving the UI only when asked to
  show it). Also analyzing a thunk, often a customer's production thunk you must not edit:
  troubleshoot one work item or step, run a health check, or clean it up / upgrade it in a
  mocked copy with tests from real data and a .docx report. Use whenever you are about to
  build, change, test, analyze, troubleshoot, review or debug a thunk through the Builder
  MCP.
---

<!-- GENERATED, DO NOT EDIT: built from the Thunk.AI help article `build-thunks-with-the-builder-mcp`. Edits here are overwritten and never committed; change the article in the source repository instead. -->

> Help articles bundled in this skill's folder: `analyze-a-thunk-with-the-builder-mcp` is `analyzing.md`.

This guide is for AI agents (such as Claude or Codex) that build and analyze thunks through the **Thunk.AI Builder MCP**. People who want to set one up should start with Build thunks from Claude Code or Codex (help article `build-thunks-from-claude-code-or-codex`).

The help center (info.thunk.ai) is the source of truth for how to build good
thunks.

The tools below belong to the **Thunk.AI Builder MCP**
(`/api/builder/mcp` on your Thunk.AI tenant). Its name depends on how it was
connected: `thunk-builder` as a local MCP server, a claude.ai connector such
as Thunk.AI, a Claude Code plugin per tenant, whose tools appear as
`mcp__plugin_thunk-<tenant>_thunk-builder__*`, or a Codex plugin per tenant,
whose server is named `thunk-<tenant>`. This guide names tools by their bare
names (`get_definition`, `batch_steps`); use them from whichever of those
servers this session has. This guide tells you **which articles to read** for
the task in front of you. Read them before you act; do not work from memory.

**More than one tenant connected?** Each Thunk.AI tenant (such as the public
one and a dedicated customer tenant) is a separate server with its own thunks and accounts, and a
thunk id exists on only one of them. If this session has the Builder MCP for
more than one tenant, find out which tenant the user means before the first
call, ask if it isn't clear, and keep every call for that thunk on that
server. Never copy a design or data from one tenant to another unless the user
asks for exactly that.

**Mandatory: open and link every thunk.** This is required for every thunk
task. Whenever you build, copy, edit, inspect, analyze, troubleshoot, review
or report on a thunk, open that thunk's URL in the side-panel browser as soon
as a relevant thunk URL is available (from `create_thunk`, `copy_thunk`,
`get_thunk` or `list_thunks`), before continuing with other work. In Codex,
call `mcp__codex_app__open_in_codex` with
`target: { type: "browser", url: "<thunk URL>" }` and `placement: "right"`; in
the Claude desktop app, use its browser pane. Reuse the current browser tab
when possible. Also include the thunk URL as a clickable link in your
response. If opening fails or no browser pane is available, say so and give
the link anyway. Do not treat this as optional because the user did not
explicitly ask to see the UI. See
**Open the thunk in the browser pane** below.

**At the start of a session in the Claude desktop app**, open the tenant's
Thunk.AI app in the browser pane and complete steps 3–5 of
**Open the thunk in the browser pane** below
(site approval, sign-in, a visible pane) before building, so the user approves
and signs in once, up front. The tenant's app is the site of any thunk `url`
the Builder MCP returns (for example from `list_thunks`).

**Build skeleton first, then test it right away.** Lay out the whole thunk
early (its steps, and an outline of its tools), breadth first, then fill it
in one step at a time. Stand in mocks for external systems, and as soon as
it is built, create test data and run it. See **Build order** below.

**Analyzing a thunk?** Troubleshooting, a health check, or a cleanup /
upgrade of an existing thunk follows the `analyze-a-thunk-with-the-builder-mcp` article. See
**Analyzing a thunk** below.

## Start a session first

If the Builder MCP has a `create_session` tool, call it before anything else
with a short `title` and a `description` of what you are building. Read the
instructions it returns and pass the returned `sessionId` to every other
Builder tool. Where the server requires sessions, a call without a valid
`sessionId` is refused with `session_required` or `session_not_found`: call
`create_session` again and carry on. Over HTTP the id travels in the
`X-Builder-Session` header instead. Sessions are yours alone and show up under
Account → Builder → Sessions.

## Build order

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
   open the thunk in the browser pane (below)
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
5. **Test it as soon as it is built**, without waiting to be asked. Create
   test data: a few realistic work items covering the main path, plus one or
   two edge cases (a missing field, a value that should be rejected), with
   `create_work_item` and `tests` so each is a test work item with
   assertions on its expected outputs. Run them, read the results
   (`get_work_item_state`, `get_step_history`), and fix what fails. Where
   the user chose a real connection over a mock, a test run reads and
   changes that real system: say what it will do and get their go-ahead
   first. Then tell the user what you tested and what passed.

Don't run work items through a step whose tools are still stubs.

**Files from the user** (for a FILE or IMAGE input, or a content folder):
never send a file's contents as base64. If the file is at a public URL,
pass it to `upload_files`. If it is on the user's computer or attached in
this chat, call `create_upload_link`, show the user its `url` as a link, and
ask them to open it, pick the files, and tell you when they are done. They
must be signed in to Thunk.AI as the account this MCP is connected to. Then
call `get_upload_link`; while its status is `pending`, ask again rather than
polling. Use the returned `files[].url` in `create_work_item` data or in
`batch_content_folders` `add_files`. A link lasts 30 minutes, takes up to 5
files, and works once.

For an MCP-server thunk, the interface is the outline: create it with its
tool signatures (`create_thunk` with `kind: "mcpServer"` and an `interface`,
or one `batch_tools` call of stubs), open the thunk and give its link, then
implement and
`run_tool`-check one tool at a time, and publish the export (`set_export`)
when they work.

When you change an existing thunk, apply the same idea: add any new steps and
tool outlines first, then fill them in one at a time.

## How to read an article

- Call `get_help_article` with the **slug** shown below.
- Not sure which slug? `search_help_center` with a short query.
- Every Builder tool description also ends with
  `Help articles (get_help_article slugs): …` — those are the articles for that
  specific tool. Read them the first time you use the tool in a session.
- Read 1–3 articles per task, not all of them. Where articles disagree,
  the more specific one wins.

## Which articles for which task

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
| Add people to a thunk (`add_thunk_members`) | `users-and-access-controls`, `users-organizations-and-governance` |

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

## Open the thunk in the browser pane

This is mandatory, not optional. As soon as `create_thunk` or `copy_thunk`
returns a `url` (or, when working on an existing thunk, as soon as `get_thunk`
or `list_thunks` returns one), open that URL beside the conversation so the
user can watch the thunk while you work on it. Do this for every thunk you
build, copy, edit, inspect, analyze, troubleshoot, review or report on,
before continuing with other work, and always put the clickable link in your
message too. Never let it hold up the build. The panel is mainly for the
user to watch. Make changes through the Builder MCP tools by default: they are
faster and more reliable than the UI, and their results can be checked.

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

### Show each change in the pane

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
thunk URL's host (`<host>` below):

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

### In the Claude desktop app

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
   (`computer`, scale 0.5).
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
   **Show each change in the pane** above. Don't open
   a new tab for each view.

### In the Codex desktop app

Call `mcp__codex_app__open_in_codex` with
`target: { type: "browser", url: "<the thunk's url>" }` and
`placement: "right"`. Do this as soon as the thunk's URL is available, for
every thunk task (not only builds), and reuse the current browser tab when
possible. If the panel opens asynchronously, the app shows it when it is
ready; carry on with the work. If the call fails or no browser pane is
available, say so in one line and give the clickable link anyway.

### Elsewhere

In the Claude Code terminal, Cursor, Claude chat without the desktop app, or
any agent with no side-panel browser, give the thunk's link (`url` in the
`get_thunk` result) and carry on. Don't build a page of the thunk or write one
to a file for the user to open.

In every case, give step links (each step's `url` in `get_definition`) when
you discuss a specific step.

## Analyzing a thunk

To analyze a thunk — often a customer's production thunk you must not edit —
read the `analyze-a-thunk-with-the-builder-mcp` article (`get_help_article`) before you start,
and follow it. It covers three scenarios: (A) troubleshooting one work item
or step, (B) a health check, and (C) a cleanup / upgrade done in a mocked
copy with tests from real data, a hand-over to the owner and a .docx report.
It works only through this Builder MCP; when the cause is the platform, it
files feedback and has the user raise a support ticket.

## Rules

- Never guess a slug. If one above returns not-found, `search_help_center`
  for its title instead. A new article becomes readable only after the
  next Thunk.AI release.
- Don't paste article text back into a thunk's instructions. Apply the
  guidance in your own words for that thunk.
- If an article is wrong or missing something you needed, report it with
  `submit_feedback`.

## Before finishing

Did I open the relevant thunk in the in-app browser and include its link?
