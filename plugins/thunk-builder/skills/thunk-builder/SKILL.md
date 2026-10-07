---
name: thunk-builder
description: >-
  How to build and analyze thunks with the Thunk.AI Builder MCP (tools such as
  create_thunk, get_definition, batch_steps, run_work_item, get_help_article —
  connected as thunk-builder, Thunk.AI or another name): which help
  articles to read before designing or editing a thunk, writing step AI
  instructions, schema, tools and connections, running and testing work items,
  diagnosing a run, MCP export or chat apps; the order to build in (steps and
  tool outlines first); in Claude, publishing the thunk as a live Claude
  Artifact card as early as possible. Also analyzing a thunk, often a
  customer's production thunk you must not edit: troubleshoot one work item or step, run a health
  check, or clean it up / upgrade it in a mocked copy with tests from real data
  and a .docx report. Use whenever you are about to build, change, test,
  analyze, troubleshoot, review or debug a thunk through the Builder MCP.
---

# thunk-builder

The help center (info.thunk.ai) is the source of truth for how to build good
thunks.

The tools below belong to the **Thunk.AI Builder MCP**
(`/api/builder/mcp` on your Thunk.AI tenant). Its name depends on how it was
connected: `thunk-builder` as a local MCP server, a claude.ai connector such
as Thunk.AI, a Claude Code plugin per tenant, whose tools appear as
`mcp__plugin_thunk-<tenant>_thunk-builder__*`, or a Codex plugin per tenant,
whose server is named `thunk-<tenant>`. This skill names tools by their bare
names (`get_definition`, `batch_steps`); use them from whichever of those
servers this session has. This skill tells you **which articles to read** for
the task in front of you. Read them before you act; do not work from memory.

**More than one tenant connected?** Each Thunk.AI tenant (such as the public
one and a dedicated customer tenant) is a separate server with its own thunks and accounts, and a
thunk id exists on only one of them. If this session has the Builder MCP for
more than one tenant, find out which tenant the user means before the first
call, ask if it isn't clear, and keep every call for that thunk on that
server. Never copy a design or data from one tenant to another unless the user
asks for exactly that.

**In Claude, publish the thunk card first.** Whenever you create, copy, edit
or analyze a thunk, publish its [thunk card](#show-the-thunk-as-a-card) as
early as possible, before the rest of the work, and give the user the link.
Don't wait until the thunk is finished, and don't wait to be asked to publish
it: a card that is only shown in the conversation cannot read live data. The
card is a Claude Artifact, so it exists only in Claude. In Codex, Cursor or
any other agent, give the user the thunk's link in the Thunk.AI app instead
(see [Without Claude Artifacts](#without-claude-artifacts)).

**Build outside-in.** Lay out the whole thunk early (its steps, and an
outline of its tools), then fill it in one step at a time. See
[Build order](#build-order).

**Analyzing a thunk?** Troubleshooting, a health check, or a cleanup /
upgrade of an existing thunk follows [`analyzing.md`](analyzing.md). See
[Analyzing a thunk](#analyzing-a-thunk).

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

The user is watching the thunk while you build: in the thunk card in Claude,
or in the Thunk.AI app elsewhere. Make the shape of the thunk appear first,
then fill it in one step at a time. Don't build it layer by layer (every
property, then every tool in full detail, then finally the steps): that leaves
an empty Workflow Plan on screen for most of the build, and the user can't
tell what you are making.

For a new workflow or chat-app thunk:

1. **Create it and publish the card.** `create_thunk`, then the
   [thunk card](#show-the-thunk-as-a-card) (in Claude) or the thunk's link
   in the app (elsewhere).
2. **Lay out every step.** One `batch_steps` call that adds all the steps in
   order, chained by status (`New` → … → the last step's final status). Give
   each step its real title and a short paragraph of directions saying what the
   step is for. Leave out `inputProperties`, `outputProperties` and
   `toolConfig` for now: none of them is required, and the properties and
   tools don't exist yet.
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
5. **Test the whole thunk** once every step is filled in.

Don't run work items through a step whose tools are still stubs.

For an MCP-server thunk, the interface is the outline: create it with its
tool signatures (`create_thunk` with `kind: "mcpServer"` and an `interface`,
or one `batch_tools` call of stubs), publish the card (or, outside Claude,
give the thunk's link), then implement and
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

## Show the thunk as a card

**Claude only.** This section needs Claude's Artifact tool, which publishes a
page at a `claude.ai/artifact/...` link and lets it read Thunk.AI through the
viewer's claude.ai connector. Codex, Cursor and other agents have neither: skip
this section and follow [Without Claude Artifacts](#without-claude-artifacts).

Publish a **thunk card** as early as possible whenever you work on a thunk: a
Claude Artifact that shows the thunk live, styled like the Thunk.AI app, with
links into the app. The card type follows the thunk's kind:

- **Workflow thunks:** the Workflow Plan, inputs and outputs, plug-ins,
  connections and workflow state, plus the **work items** (regular and test)
  with their workflow status, what each one is doing now (working, waiting on a
  person, finished) and test results. Opening a work item shows its data (input,
  result and working values; sensitive values stay hidden until the viewer asks)
  and the steps it has run.
- **Chat apps:** the same, plus an **Open chat** button for the hosted end-user
  chat, for testing the conversation.
- **MCP-server thunks:** the **exported interface** (server name, version, MCP
  URL, published or not), each tool's parameters, the tool's **call history**
  (input, output, status and which step made each call), and a **Try it** form
  built from the tool's input schema. Try it runs the tool through `run_tool`
  only after the viewer confirms in the page, never by itself, and is off for
  thunks in Production.

When the page opens it reads the live design, work items and call history
through the viewer's own claude.ai connector, refreshing every 30–60 seconds.
The design falls back to a snapshot embedded at build time. Work items, call
history and run results are live only and never embedded, because they are
people's data and run data.

When to publish it:

- **Creating a thunk** (`create_thunk`, `copy_thunk`): publish the card as soon
  as the call returns the thunk id, before you add steps, properties, bindings
  or tools. It starts nearly empty and fills in by itself as you build,
  because the page refreshes the live design.
- **Editing, testing or analyzing an existing thunk**: publish the card right
  after you first read the thunk (`get_thunk` / `get_definition`), before you
  change, run or diagnose anything. If this session already published a card
  for it, give that link again rather than making a new one.

**Publish it, don't just show it.** Only a published artifact (a
`claude.ai/artifact/...` link) can read Thunk.AI live. In Claude chat, an
artifact that is only displayed in the conversation gets no connector access:
it shows the snapshot of the design taken at build time, and its live sections
stay empty with a message that it cannot read Thunk.AI live. So publish the
card as an artifact immediately, without waiting for the user to ask, and give
the user the published link. The user can then follow the thunk in the card
while you work.

The page and its build script live in the `thunk-card/` folder inside this
skill's folder (the folder that holds this `SKILL.md`). Paths below are relative
to this skill's folder, wherever the skill is installed. Write the JSON and the
page to your scratchpad or another working folder, not into the skill's folder.

1. Read the design: `get_thunk`, then `get_definition` with these `sections`:
   - workflow and chat-app thunks:
     `["properties", "steps", "planBindings", "connections", "plugIns", "tools"]`
   - MCP-server thunks: `["tools", "export"]`

   Write each result to a JSON file in your working folder. If `get_definition`
   was too large and was saved to a tool-results file, that file is already
   the JSON; pass its path.
2. Pick the connector name the page will use (see
   [Connector name](#connector-name) below). It is **Thunk.AI** unless this
   session shows otherwise.
3. Build the page:
   `python3 <this skill's folder>/thunk-card/build.py thunk.json definition.json <working folder>/thunk-cards/<thunk-name>.html --server "<connector name>"`
   Add `build.py --no-run` for an MCP-server thunk you are analyzing for someone else,
   or whenever the user should not run its tools from the card: the page then
   can only read. Use the same output path for the same thunk for the rest of
   the session.
4. Publish it with the Artifact tool. The first time, pass `icon: "workflow"`,
   this `description`, with the thunk's kind filled in (workflow, chat app or MCP
   server): "A Thunk.AI <kind> thunk, shown live from Thunk.AI, where it is built
   and hosted." It is the subtitle on the gallery card, so it must say the page
   is a thunk on Thunk.AI. Also pass **exactly** the `capabilities` value the
   build printed (its last line). It lists only the connector tools that card
   type calls: read-only tools, plus `run_tool` for an MCP-server card built
   without `build.py --no-run`. The publish result states the display name it resolved
   for the server. If it differs from the name you built with, rebuild with the
   resolved name and publish again. To update later, publish the same file path
   again with the same `description`, and omit `icon` and `capabilities`.
5. In a later session, find the existing card with Artifact `action: "list"`
   (its title is the thunk name, followed by "· Thunk.AI" on cards built since
   that suffix was added), `read` it, then publish with its `url` and the
   `description` above, so the link stays the same.

### Connector name

A published page reaches the Builder MCP through the viewer's own claude.ai
connector, which it names by display name. The page holds only that name and
the thunk id: it reaches whatever Thunk.AI instance the viewer's connector is
connected to. The team uses one name, **Thunk.AI**.

- If this session has the Builder MCP as a claude.ai connector (its tools
  appear as `mcp__claude_ai_<Name>__get_definition`, with spaces in the name
  turned into underscores), use that connector's name.
- Otherwise, for example when the Builder MCP is the local `thunk-builder`
  server or comes from a `thunk-<tenant>` plugin, use
  **Thunk.AI**.
- The card loads live data only when the thunk exists on the instance the
  viewer's connector is connected to. A thunk you built or read through the
  same connector always does.

Rules for cards:

- Never add tools to the page's `capabilities` beyond what the build printed.
  The only write tool a card may have is `run_tool`, on an MCP-server card.
- An older card that lists fewer tools than the build now prints is missing
  live sections (they report that live data is turned off). To upgrade it,
  rebuild it and publish with the printed `capabilities`; omitting
  `capabilities` keeps the old list.
- The live page updates itself, so republish only after a round of design
  edits, to keep the snapshot current. Don't republish after every tool call.
- The card embeds the thunk's design and is private to the user who publishes
  it. When the thunk belongs to someone else, such as a customer's production
  thunk, don't share the card beyond the people working on it with the user.
- Someone a card is shared with sees live data only if they have their own
  connector with the same name and access to the thunk; everyone else sees
  the snapshot. Running a tool from the card runs it as the viewer.
- After changing the card's template or build script, run
  `python3 <this skill's folder>/thunk-card/test_build.py`.

### Without Claude Artifacts

In Codex, Cursor or any agent without Claude's Artifact tool, there is no card.
Don't build `thunk-card/` pages or write them to a file for the user to open: a
page opened from a file cannot read Thunk.AI live and shows only the design
snapshot. Instead:

- Give the user the thunk's link in the Thunk.AI app (`url` in the `get_thunk`
  result) at the moment you would have published the card, so they can watch
  the thunk in the app while you build.
- Give step links (each step's `url` in `get_definition`) when you discuss a
  specific step.

## Analyzing a thunk

To analyze a thunk — often a customer's production thunk you must not edit —
read [`analyzing.md`](analyzing.md) in this skill's folder before you start,
and follow it. It covers three scenarios: (A) troubleshooting one work item
or step, (B) a health check, and (C) a cleanup / upgrade done in a mocked
copy with tests from real data, a hand-over to the owner and a .docx report.
It works only through this Builder MCP; when the cause is the platform, it
files feedback and has the user raise a support ticket.

## Rules

- Never guess a slug. If one above returns not-found, `search_help_center`
  for its title instead. A newly committed article only becomes readable after
  the next help-center deploy.
- Don't paste article text back into a thunk's instructions. Apply the
  guidance in your own words for that thunk.
- If an article is wrong or missing something you needed, report it with
  `submit_feedback`.
