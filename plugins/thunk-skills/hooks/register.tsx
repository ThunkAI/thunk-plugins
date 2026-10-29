import { atom, read, update } from "claude-code";
import type { EngineInterface, Register } from "claude-code";

import type { Account, CurrentThunk, NextStep, Thunk } from "../types";

const PANE = "thunk-home";
const TITLE = "Thunk.AI";

// Thunk.AI's amber accent (the webapp theme's info and folder accent). Only the mark and the
// welcome card's border use it: as text on a light background it is too faint to read, so
// words keep the person's theme colors.
const AMBER = "#eaa606";

// A Builder MCP tool's name: mcp__plugin_<tenant plugin>_thunk-builder__<tool> for a tenant
// plugin's server, mcp__<server>__<tool> for one added by hand. No tenant is named here: the
// public and private exports refuse a file that names another edition's tenant.
const BUILDER_TOOL = /^mcp__(.+)__([a-z_]+)$/;

const account = atom(
  { plugin: "thunk-skills", key: "account" } as const,
  {
    kind: "unknown",
  } as Account,
);
// Whether the pane shows the welcome text: on first run, and again from "About Thunk.AI".
const isNew = atom({ plugin: "thunk-skills", key: "isNew" } as const, false);
const next = atom(
  { plugin: "thunk-skills", key: "next" } as const,
  null as NextStep | null,
);
// Whether thunk-home is open, set on every open and cleared by ui.close. The band reads it so
// it redraws when the pane closes; $.ui.panes() alone would not redraw it.
const isPaneOpen = atom(
  { plugin: "thunk-skills", key: "isPaneOpen" } as const,
  false,
);
// The Builder tools whose thunkId is the thunk the person is working on (not, say, copy_thunk's
// source or a comparison).
const WORKS_ON = new Set([
  "get_thunk",
  "get_definition",
  "get_errors",
  "run_work_item",
  "rerun_work_item",
  "create_work_item",
  "query_work_items",
  "run_review",
  "batch_steps",
  "batch_properties",
  "batch_tools",
  "batch_connections",
]);

// The name in a get_thunk result, when there is one.
function thunkName(text: string | undefined) {
  try {
    return cleanName((JSON.parse(text ?? "") as { name?: unknown }).name);
  } catch {
    return undefined;
  }
}

// The thunk the person is working on: the one Claude opened in the browser pane, or the one
// Claude last worked on through the Builder tools. The band offers actions on it.
const current = atom(
  { plugin: "thunk-skills", key: "current" } as const,
  null as CurrentThunk | null,
);
// The person hid the band's "Open Thunk.AI pane" button; kept in $.store across sessions.
const isChipHidden = atom(
  { plugin: "thunk-skills", key: "isChipHidden" } as const,
  false,
);

const STARTERS: NextStep[] = [
  {
    label: "Build my first thunk",
    prompt:
      "I am new to Thunk.AI. Interview me briefly about a business process I want to automate, then build it as a thunk and open it in the browser pane so I can watch.",
  },
  {
    label: "Take a guided tour",
    prompt:
      "Give me a guided tour of Thunk.AI in the browser pane, using one of the public sample thunks: what a thunk is, its workflow plan, steps, tools and a work item run.",
  },
  {
    label: "What can Thunk.AI do for me?",
    prompt:
      "Ask me what my role and team are, then suggest three processes Thunk.AI could automate for me, with one sentence each on how.",
  },
];

// After Claude uses a Builder tool, the most useful next move. The Codex hooks offer the same ones
// (hooks/codex/follow-ups.tsv; test_package_skill.py fails if the two differ).
const FOLLOW_UPS: Record<string, NextStep> = {
  create_thunk: {
    label: "Run a test work item",
    prompt:
      "Create a realistic test work item on the thunk we just built, run it and walk me through what each step did.",
  },
  batch_steps: {
    label: "Test the new steps",
    prompt:
      "Run a work item through the steps we just changed and tell me whether each one did what it should.",
  },
  run_work_item: {
    label: "Review the run",
    prompt:
      "Review the work item that just ran: where it spent time, any errors or weak outputs, and what to change.",
  },
  get_errors: {
    label: "Fix the cause",
    prompt:
      "Propose the smallest change that fixes the errors we just found, then rerun the failing work item.",
  },
  batch_connections: {
    label: "Try the connection",
    prompt:
      "Run a work item that uses the connection we just set up and confirm its tools work end to end.",
  },
  run_review: {
    label: "Apply the review",
    prompt:
      "Apply the top recommendations from that review to the thunk, then rerun a work item to compare.",
  },
};

// How a prompt names a thunk: by name when the pane knows it, always by id.
// thunk names and ids come from server data and URLs, and go into prompts submitted as the
// person's own words, so neither may carry quotes, line breaks or other control characters.
const THUNK_ID = /^[A-Za-z0-9_=+-]{1,64}$/;

function cleanId(id: unknown) {
  return typeof id === "string" && THUNK_ID.test(id) ? id : undefined;
}

function cleanName(name: unknown) {
  const text =
    typeof name === "string"
      ? name
          .replace(/[\u0000-\u001f\u007f"“”`]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "";
  return text ? text.slice(0, 80) : undefined;
}

function thunkRef(thunk: CurrentThunk) {
  return thunk.name
    ? `"${thunk.name}" (id ${thunk.id})`
    : `with id ${thunk.id}`;
}

// What the person can ask about the thunk they are working on, above the prompt.
const THUNK_ACTIONS: {
  key: string;
  label: string;
  prompt: (thunk: CurrentThunk) => string;
}[] = [
  {
    key: "analyze",
    label: "Analyze",
    prompt: (thunk) =>
      `Analyze my thunk ${thunkRef(thunk)}: what it does, how its recent work items went (passed, failed, time taken) and anything that looks wrong.`,
  },
  {
    key: "explain",
    label: "Explain",
    prompt: (thunk) =>
      `Explain my thunk ${thunkRef(thunk)} in plain terms: its goal, its workflow plan and steps, the tools and connections it uses, and where people review its work.`,
  },
  {
    key: "debug",
    label: "Debug errors",
    prompt: (thunk) =>
      `Find the errors and failed work items on my thunk ${thunkRef(thunk)}, explain the cause of each, and propose the smallest fix. Don't change anything yet.`,
  },
  {
    key: "improve",
    label: "Suggest improvements",
    prompt: (thunk) =>
      `Suggest the three most useful improvements to my thunk ${thunkRef(thunk)} (reliability, speed, cost, or the clarity of its instructions), most valuable first. Don't change anything yet.`,
  },
];

function openThunkStep(target: string): NextStep {
  return {
    label: "Open",
    prompt: `Open my thunk ${target} in the browser pane.`,
  };
}

// The Thunk.AI app's page for one thunk, opened in the browser pane: a thunk.ai host (any
// tenant's) and a /thunk/<id> path. The URL is parsed, never matched as text.
function thunkPageId(url: unknown) {
  try {
    const page = new URL(String(url));
    const isThunkHost =
      page.hostname === "thunk.ai" || page.hostname.endsWith(".thunk.ai");
    const path = /^\/thunk\/([^/]+)/.exec(page.pathname);
    return page.protocol === "https:" && isThunkHost && path?.[1]
      ? cleanId(decodeURIComponent(path[1]))
      : undefined;
  } catch {
    return undefined;
  }
}

// The URLs a call on the side-panel browser opens: navigate and preview_start take a url, and
// browser_batch carries navigate actions.
function browserUrls(tool: string, input: Record<string, unknown>) {
  // A cloud session linked to the desktop app reaches the same browser as remote-devices.
  const name = /^mcp__(?:remote-devices__)?Claude_Browser__(.+)$/.exec(
    tool,
  )?.[1];
  if (name === "navigate" || name === "preview_start") {
    return [input.url];
  }
  if (name === "browser_batch" && Array.isArray(input.actions)) {
    return (input.actions as { name?: unknown; input?: { url?: unknown } }[])
      .filter((action) => action?.name === "navigate")
      .map((action) => action.input?.url);
  }
  return [];
}

// The Codex hooks start their rule with the same sentences (hooks/codex/session-rule.txt).
const NEXT_STEPS_RULE = [
  "This user works with Thunk.AI through the Thunk.AI Builder tools.",
  'After any turn in which you built, changed, ran or analyzed a thunk, end your reply with a short "Next steps" list of two or three concrete actions they could take on that thunk now (for example: run a test work item, add a review step, connect a system, export it as an MCP server), most useful first.',
  "For a user who is new to Thunk.AI, explain any Thunk.AI term (thunk, step, work item, connection) in a few words the first time you use it.",
].join(" ");

type Shown = {
  thunkId?: unknown;
  name?: unknown;
  url?: unknown;
  productionMode?: unknown;
  folderPath?: unknown;
};

// The plugin never calls the Builder server itself: a plugin's own MCP call goes through the
// person's permissions with no one to approve it (auto mode refuses it outright), and a plugin
// cannot approve its own call in the desktop app. It keeps the thunks from the last unfiltered
// list_thunks Claude ran instead, in $.store so the next session starts with them. The pane does
// not list them (too noisy); they name the current thunk, the status line count and the pane's
// example requests.
const SHOWN = 8;

// The thunks in a list_thunks result, or undefined when the call was filtered (a search, a
// folder, a tag, a later page, shared or samples only), so the pane never shows a partial list
// as "your thunks".
function listedThunks(
  input: Record<string, unknown>,
  text: string | undefined,
) {
  const isFiltered =
    // `folder` too: a server older than this plugin still takes the old folder filter name.
    ["search", "folderPath", "folder", "tag", "after"].some(
      (key) => input[key] !== undefined,
    ) ||
    (input.access !== undefined &&
      input.access !== "owned" &&
      input.access !== "all");
  if (isFiltered || !text) {
    return undefined;
  }
  try {
    const listed = JSON.parse(text) as { items?: unknown };
    const items = (Array.isArray(listed.items) ? listed.items : []) as Shown[];
    return items
      .filter((item) => cleanId(item.thunkId))
      .slice(0, SHOWN)
      .map(
        (item): Thunk => ({
          id: cleanId(item.thunkId) ?? "",
          name: cleanName(item.name) ?? "Untitled thunk",
          url: String(item.url),
          phase: String(item.productionMode ?? ""),
          folder: String(item.folderPath ?? "/"),
        }),
      );
  } catch {
    return undefined;
  }
}

// The pane, the band and the status line are for the Claude apps. In the terminal they crowd
// the prompt and take Tab stops, so a terminal session shows none of them unasked: /thunk and
// /thunk-welcome still open the pane there. The desktop app attaches its surface after
// session.start, so the pane opens on the first app surface: at session.start when one is
// already there, else at session.attach. Module state: a reload runs session.start again.
let isInApp = false;

async function welcomeApp($: EngineInterface) {
  if (isInApp) {
    return;
  }
  isInApp = true;
  const state = await read($, account);
  if (state.kind === "ready") {
    await showThunks($, state.thunks, state.listedAt);
  }
  void openPane($, false).catch(() => undefined);
  if (await read($, isNew)) {
    $.ui.toast(
      "Welcome to Thunk.AI. Pick something to try in the Thunk.AI pane.",
    );
  }
}

async function showThunks(
  $: EngineInterface,
  thunks: Thunk[],
  listedAt: number,
) {
  await update(
    $,
    account,
    () => ({ kind: "ready", thunks, listedAt }) as Account,
  );
  if (isInApp) {
    $.ui.status(
      `Thunk.AI · ${thunks.length === SHOWN ? `${SHOWN}+` : thunks.length} thunks`,
    );
  }
}

// The commands the pane lists. Claude loads the thunk-guide skill on its own when a request
// needs it, so the skill is not listed.
const COMMANDS: [string, string][] = [
  ["/thunk <name or id>", "open a thunk in the browser pane"],
  ["/thunk", "open this pane"],
  ["/thunk-welcome", "show the welcome again"],
  ["/mcp", "sign in to the Thunk.AI Builder server"],
];

async function openPane($: EngineInterface, focus: boolean) {
  await $.ui.open({
    id: PANE,
    title: TITLE,
    ...(focus ? { focus: true } : {}),
  });
  await update($, isPaneOpen, () => true);
  // isPaneOpen may already have been true (a pane waiting on a narrow terminal, or behind
  // another tab), so redraw the band for what $.ui.panes() now says.
  $.ui.invalidate("ui.render");
}

// Whether the person can see the pane now: open, drawn (not waiting on a narrow terminal) and
// the tab in front.
async function isPaneVisible($: EngineInterface) {
  if (!(await read($, isPaneOpen))) {
    return false;
  }
  const pane = (await $.ui.panes().catch(() => [])).find(
    (one) => one.id === PANE,
  );
  return pane !== undefined && pane.isPlaced && pane.isShown;
}

async function setChipHidden($: EngineInterface, hidden: boolean) {
  await $.store.set("isChipHidden", hidden);
  await update($, isChipHidden, () => hidden);
}

// Sets the current thunk; true when it changed.
async function setCurrent($: EngineInterface, id: string, name?: string) {
  const state = await read($, account);
  const known =
    cleanName(name) ??
    (state.kind === "ready"
      ? state.thunks.find((one) => one.id === id)?.name
      : undefined);
  const before = await read($, current);
  await update($, current, () => ({ id, ...(known ? { name: known } : {}) }));
  return before?.id !== id;
}

// The desktop app stacks the pane and the browser pane in one column and splits its height, so
// the pane steps aside while a thunk is open in the browser; the band's "Thunk.AI pane" brings it
// back.
// The thunk whose page last made the pane step aside. Module state: a reload starts it over.
let steppedAsideFor: string | null = null;

async function closePane($: EngineInterface) {
  // Asks the engine rather than isPaneOpen, which a reload starts over at false.
  const panes = await $.ui.panes().catch(() => []);
  if (panes.some((one) => one.id === PANE)) {
    await $.ui.close({ id: PANE });
  }
  await update($, isPaneOpen, () => false);
}

// A prompt a slash command asked for. A command.run hook cannot submit one (it would wait on the
// turn the command holds), so it is submitted when that turn completes.
let pendingAsk: NextStep | null = null;

function ask($: EngineInterface, step: NextStep) {
  void update($, next, () => null);
  // Every prompt the plugin submits comes from a button the person pressed, so it goes in as
  // their own words, without the frame Claude Code puts around a plugin's message.
  void $.prompt.submit({ text: step.prompt, asUser: true });
}

export const register: Register = (on) => {
  on("session.start", async ($, e, nextHook) => {
    await $.command.register({
      name: "thunk",
      description:
        "Open a thunk in the browser pane, or with no name the Thunk.AI pane",
      argumentHint: "[thunk name or id]",
    });
    await $.command.register({
      name: "thunk-welcome",
      description: "Show the Thunk.AI welcome again",
    });

    isInApp = false;
    const hasVisited = (await $.store.get("hasVisited")) === true;
    await update($, isNew, () => !hasVisited);
    const chipHidden = (await $.store.get("isChipHidden")) === true;
    await update($, isChipHidden, () => chipHidden);
    const cached = (await $.store.get("thunks")) as
      | { thunks: Thunk[]; listedAt: number }
      | undefined;
    if (cached && Array.isArray(cached.thunks)) {
      await showThunks($, cached.thunks, cached.listedAt);
    }
    const surfaces = await $.session.surfaces().catch(() => []);
    if (e.isInteractive && surfaces.some((one) => one !== "terminal")) {
      await welcomeApp($);
    }

    return nextHook(e);
  });

  on("session.attach", async ($, e, nextHook) => {
    const attached = await nextHook(e);
    if (e.surface !== "terminal") {
      await welcomeApp($).catch(() => undefined);
    }

    return attached;
  });

  on("command.run", { command: "thunk" }, async ($, e) => {
    const target = e.args.trim();
    if (target) {
      pendingAsk = openThunkStep(
        `"${cleanName(target) ?? target}" (a name or an id)`,
      );

      return { text: `Opening thunk ${target}.` };
    }
    await setChipHidden($, false);
    await openPane($, true);

    return { text: "Thunk.AI pane opened." };
  });

  on("command.run", { command: "thunk-welcome" }, async ($) => {
    await update($, isNew, () => true);
    await openPane($, true);

    return { text: "Thunk.AI welcome shown." };
  });

  on("ui.close", { id: PANE }, async ($, e, nextHook) => {
    const closed = await nextHook(e);
    // A hook beneath may have kept the pane open, so ask rather than assume.
    const panes = await $.ui.panes().catch(() => []);
    await update($, isPaneOpen, () => panes.some((one) => one.id === PANE));

    return closed;
  }).catch(($, e, nextHook) => nextHook(e));

  on("prompt.compose", async ($, e, nextHook) => {
    const composed = await nextHook(e);

    return {
      sections: [
        ...composed.sections,
        {
          id: "thunk-skills:next-steps",
          text: NEXT_STEPS_RULE,
          scope: "session" as const,
        },
      ],
    };
  });

  // The person moved on: a suggestion is for the turn that raised it.
  on("prompt.submit", async ($, e, nextHook) => {
    await update($, next, () => null).catch(() => undefined);
    // A prompt of the person's own supersedes one a command left to submit.
    if (e.origin.kind !== "plugin") {
      pendingAsk = null;
    }

    return nextHook(e);
  });

  on("tool.call", async ($, e, nextHook) => {
    const ran = await nextHook(e);
    const match = BUILDER_TOOL.exec(e.tool);
    const followUp =
      match?.[1] && /thunk/i.test(match[1]) && match[2]
        ? FOLLOW_UPS[match[2]]
        : undefined;
    if (
      followUp &&
      !("deny" in ran && ran.deny) &&
      !("isError" in ran && ran.isError)
    ) {
      await update($, next, () => followUp).catch(() => undefined);
    }

    const isOk =
      !("deny" in ran && ran.deny) && !("isError" in ran && ran.isError);
    const thunks =
      isOk && match?.[2] === "list_thunks"
        ? listedThunks(e as unknown as Record<string, unknown>, ran.text)
        : undefined;
    if (thunks) {
      const listedAt = await $.clock.now();
      await $.store.set("thunks", { thunks, listedAt });
      await showThunks($, thunks, listedAt).catch(() => undefined);
    }

    // The main loop's calls only: a subagent's sweep over thunks is not what the person has open.
    const input = e as unknown as Record<string, unknown>;
    const isMainLoop = !input.agentId;
    const builderThunk =
      isOk &&
      isMainLoop &&
      match?.[1] &&
      /thunk/i.test(match[1]) &&
      match[2] &&
      WORKS_ON.has(match[2])
        ? cleanId(input.thunkId)
        : undefined;
    if (builderThunk) {
      await setCurrent(
        $,
        builderThunk,
        match?.[2] === "get_thunk" ? thunkName(ran.text) : undefined,
      ).catch(() => false);
    }
    const pageId =
      isOk && isMainLoop
        ? browserUrls(e.tool, input).map(thunkPageId).find(Boolean)
        : undefined;
    // The pane steps aside once per thunk opened, so after the person brings it back, moving
    // around the same thunk's pages leaves it. Keyed on the page, not on the current thunk:
    // a Builder tool call (get_thunk, say) sets the current thunk before Claude opens its page.
    if (pageId) {
      await setCurrent($, pageId).catch(() => false);
      if (pageId !== steppedAsideFor) {
        steppedAsideFor = pageId;
        await closePane($).catch(() => undefined);
      }
    }

    return ran;
  });

  on("turn.complete", async ($, e, nextHook) => {
    const done = await nextHook(e);
    if (e.agentId) {
      return done;
    }
    if (pendingAsk) {
      const asked = pendingAsk;
      pendingAsk = null;
      // A turn the person stopped also stops what the command asked for.
      if (!e.isAborted) {
        ask($, asked);

        return done;
      }
    }
    const step = await read($, next);
    if (step) {
      void $.prompt.suggest({ text: step.prompt });
    }

    return done;
  });

  // The band above the prompt: a next step after a Builder tool call; otherwise, while the pane
  // is out of sight and no other plugin draws here, a way back to it.
  on("ui.render", { component: "AbovePrompt" }, async ($, e, nextHook) => {
    if (e.props.hasSurvey || e.surface === "terminal") {
      return nextHook(e);
    }

    const { Box, Button, Text } = $.ui.resolve(e);
    // Whatever another plugin (or the engine) draws here stays, under the Thunk.AI row.
    const below = await nextHook(e);
    // While Claude works the thunk row stays (a press queues its prompt for after the turn); the
    // next step and the chip wait, since the turn may change them.
    const isWorking = e.props.isWorking;

    const step = isWorking ? null : await read($, next);
    const thunk = await read($, current);
    const paneVisible = await isPaneVisible($);
    const showChip =
      !isWorking &&
      !paneVisible &&
      !(await read($, isChipHidden)) &&
      below.type === "engine";
    if (!step && !thunk && !showChip) {
      return below;
    }

    return (
      <Box flexDirection="column">
        {thunk && (
          <Box flexDirection="column" gap={1}>
            <Box gap={1}>
              <Text color={AMBER}>●</Text>
              <Text bold>{thunk.name ?? "This thunk"}</Text>
              {!paneVisible && (
                <Button
                  key="thunk-pane"
                  plain
                  dimColor
                  onPress={() => openPane($, true)}
                >
                  Thunk.AI pane
                </Button>
              )}
              <Button
                key="clear-thunk"
                plain
                dimColor
                onPress={() => update($, current, () => null)}
              >
                Close
              </Button>
            </Box>
            <Box gap={1} flexWrap="wrap" paddingLeft={2}>
              {THUNK_ACTIONS.map((action) => (
                <Button
                  key={`do-${action.key}`}
                  onPress={() =>
                    ask($, {
                      label: action.label,
                      prompt: action.prompt(thunk),
                    })
                  }
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          </Box>
        )}
        {step && (
          <Box gap={1}>
            <Text color={AMBER}>●</Text>
            <Text bold>Thunk.AI next step:</Text>
            <Button key="next" variant="primary" onPress={() => ask($, step)}>
              {step.label}
            </Button>
            <Button
              key="dismiss"
              role="dismiss"
              dimColor
              onPress={() => update($, next, () => null)}
            >
              Not now
            </Button>
          </Box>
        )}
        {!thunk && showChip && (
          <Box gap={1}>
            <Text color={AMBER}>●</Text>
            <Button key="open-pane" plain onPress={() => openPane($, true)}>
              Open Thunk.AI pane
            </Button>
            <Button
              key="hide-chip"
              role="dismiss"
              plain
              dimColor
              onPress={() => setChipHidden($, true)}
            >
              Hide
            </Button>
          </Box>
        )}
        {below}
      </Box>
    );
  });

  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e);
    const state = await read($, account);
    const showWelcome = await read($, isNew);
    const step = await read($, next);

    // Closing the welcome marks it seen; "About Thunk.AI" shows it again without changing that.
    const closeWelcome = async () => {
      await $.store.set("hasVisited", true);
      await update($, isNew, () => false);
    };
    const example =
      state.kind === "ready" && state.thunks[0]
        ? `"${state.thunks[0].name}"`
        : '"Invoice intake"';

    // The starters lead for a new user and follow everything else once the welcome is closed.
    const starters = (isLead: boolean) => (
      <Box flexDirection="column" gap={isLead ? 1 : 0}>
        <Text bold>{isLead ? "Get started" : "New to Thunk.AI?"}</Text>
        {STARTERS.map((starter, index) => (
          <Button
            key={`starter-${index}`}
            hotkey={String(index + 1)}
            plain={!isLead || undefined}
            variant={isLead && index === 0 ? "primary" : "secondary"}
            onPress={async () => {
              await closeWelcome();
              ask($, starter);
            }}
          >
            {starter.label}
          </Button>
        ))}
        {!isLead && (
          <Button
            key="about"
            plain
            dimColor
            onPress={() => update($, isNew, () => true)}
          >
            About Thunk.AI
          </Button>
        )}
      </Box>
    );

    return (
      <Box flexDirection="column" gap={1} paddingX={1}>
        <Box gap={1}>
          <Text color={AMBER} bold>
            ●
          </Text>
          <Text bold>Thunk.AI</Text>
        </Box>

        {showWelcome && (
          <Box
            flexDirection="column"
            borderStyle="round"
            borderColor={AMBER}
            paddingX={1}
            gap={1}
          >
            <Text bold>Welcome to Thunk.AI</Text>
            <Text>
              Thunks are AI agents that run your business processes step by
              step, with your tools and human review where you need it. Claude
              can build, test and fix them with you right here.
            </Text>
            <Button key="close-welcome" dimColor onPress={closeWelcome}>
              Got it
            </Button>
          </Box>
        )}

        {step && (
          <Box flexDirection="column" gap={1}>
            <Text bold>Suggested next</Text>
            <Button
              key="pane-next"
              variant="primary"
              onPress={() => ask($, step)}
            >
              {step.label}
            </Button>
          </Box>
        )}

        {showWelcome && starters(true)}

        <Box flexDirection="column">
          <Text bold>Ask Claude to…</Text>
          {[
            `Analyze my thunk ${example}: why are its work items failing?`,
            `Run a test work item on ${example} and walk me through each step`,
            `Explain how ${example} decides when to ask for review`,
          ].map((line, index) => (
            <Text key={`example-${index}`} dimColor>
              “{line}”
            </Text>
          ))}
        </Box>

        <Box flexDirection="column">
          <Text bold>Commands</Text>
          {COMMANDS.map(([name, what]) => (
            <Text key={`command-${name}`}>
              {name} <Text dimColor>{what}</Text>
            </Text>
          ))}
        </Box>

        {!showWelcome && starters(false)}
      </Box>
    );
  });
};
