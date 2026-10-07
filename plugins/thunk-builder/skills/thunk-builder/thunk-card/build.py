#!/usr/bin/env python3
"""Build a thunk card page from get_thunk and get_definition output.

    build.py THUNK_JSON DEFINITION_JSON OUT_HTML [--server "Thunk.AI"] [--no-run]

THUNK_JSON is the get_thunk result; DEFINITION_JSON is the get_definition result.
Read these sections (a full definition also works):

    workflow and chatApp thunks:  properties, steps, planBindings, connections, plugIns, tools
    mcpServer thunks:             tools, export

The card type follows the thunk's kind: workflow and chat-app thunks get the
Workflow Plan and work items (chat apps add an Open chat button); MCP-server
thunks get the exported interface, call history and a Try it panel.

The card embeds a trimmed snapshot of the design and reads the live design
through the claude.ai connector named by --server when the page is opened.
Pass --server "" for a snapshot-only card. --no-run leaves run_tool out of an
MCP-server card entirely, so the page can only read.

The script prints the `capabilities` value to publish the page with.

The snapshot keeps the tools' own field names, so the page renders the snapshot
and the live tool payload with the same code. Work items, call history and run
results are never embedded: the page reads them live.
"""
import argparse
import html
import json
import re
import time
from pathlib import Path

TEMPLATE = Path(__file__).with_name("template.html")
PLACEHOLDER = re.compile(r"__(?:TITLE|SERVER|SNAPSHOT|ALLOW_RUN)__")

KEEP_THUNK = ("thunkId", "name", "kind", "goal", "status", "url", "paused", "productionMode")
KEEP_STEP = ("id", "title", "kind", "initialStatus", "finalStatus", "inputProperties",
             "outputProperties", "runCondition", "finishCondition", "forceHumanApproval",
             "schedule", "url", "directions")
KEEP_CONSTRAINTS = ("isInput", "isResult", "isListType", "enum", "isSensitive")
KEEP_TOOL = ("name", "description", "type", "enabled", "inputSchema")

# The connector tools each card type calls. All read-only except run_tool.
WORKFLOW_TOOLS = ["get_thunk", "get_definition", "query_work_items", "get_work_item_state"]
MCP_READ_TOOLS = ["get_thunk", "get_definition", "get_tool_call_history", "get_tool_run"]
MCP_RUN_TOOLS = ["run_tool"]


def trim_definition(defn):
    steps = []
    for s in defn.get("steps") or []:
        step = {k: s[k] for k in KEEP_STEP if k in s}
        # Only what the card shows: enabled libraries and their enabled tools.
        step["toolConfig"] = [
            {"id": lib.get("id"), "enabled": True,
             "tools": [{"name": t.get("name"), "enabled": True}
                       for t in lib.get("tools") or [] if t.get("enabled")]}
            for lib in s.get("toolConfig") or [] if lib.get("enabled")
        ]
        steps.append(step)

    properties = []
    for p in defn.get("properties") or []:
        c = p.get("constraints") or {}
        properties.append({
            "name": p.get("name"),
            "type": p.get("type"),
            "isSystem": p.get("isSystem"),
            "description": p.get("description"),
            "constraints": {k: c[k] for k in KEEP_CONSTRAINTS if k in c},
        })

    plug_ins = []
    for p in defn.get("plugIns") or []:
        iface = p.get("interface") or {}
        plug_ins.append({
            "alias": p.get("alias"),
            "interface": {"name": iface.get("name"),
                          "tools": [{"name": t.get("name")} for t in iface.get("tools") or []]},
            "bindingCases": p.get("bindingCases") or [],
        })

    trimmed = {
        "steps": steps,
        "properties": properties,
        "planBindings": defn.get("planBindings") or {},
        "connections": [{"name": c.get("name"), "enabledOnThunk": True}
                        for c in defn.get("connections") or [] if c.get("enabledOnThunk")],
        "plugIns": plug_ins,
        "tools": [{k: t[k] for k in KEEP_TOOL if k in t} for t in defn.get("tools") or []],
    }
    ex = defn.get("export")
    if ex:
        iface = ex.get("interface") or {}
        trimmed["export"] = {
            "enabled": ex.get("enabled"),
            "name": ex.get("name"),
            "description": ex.get("description"),
            "version": ex.get("version"),
            "mcpUrl": ex.get("mcpUrl"),
            "tools": [{"name": t.get("name"), "enabled": t.get("enabled")} for t in ex.get("tools") or []],
            "interface": {"name": iface.get("name"), "version": iface.get("version")},
        }
    if defn.get("mcpUrl"):
        trimmed["mcpUrl"] = defn["mcpUrl"]
    return trimmed


def capabilities(kind, server, allow_run=True):
    """The `capabilities` value to publish a card with ({} when it has no connector)."""
    if not server:
        return {}
    tools = WORKFLOW_TOOLS if kind != "mcpServer" else MCP_READ_TOOLS + (MCP_RUN_TOOLS if allow_run else [])
    return {"mcp": {"servers": [{"server": server, "tools": tools}]}}


def script_json(value):
    """JSON that is safe inside a <script> element."""
    return (json.dumps(value, ensure_ascii=False)
            .replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
            .replace("\u2028", "\\u2028").replace("\u2029", "\\u2029"))


def build(thunk, defn, server, captured_at_ms=None, allow_run=True):
    snapshot = {
        "capturedAt": captured_at_ms if captured_at_ms is not None else int(time.time() * 1000),
        "thunk": {k: thunk.get(k) for k in KEEP_THUNK},
        "def": trim_definition(defn),
    }
    values = {
        "__TITLE__": html.escape(thunk.get("name") or "Thunk") + " · Thunk.AI",
        "__SERVER__": script_json(server or ""),
        "__SNAPSHOT__": script_json(snapshot),
        "__ALLOW_RUN__": "true" if allow_run else "false",
    }
    # One pass, so a value that contains a placeholder is never substituted again.
    return PLACEHOLDER.sub(lambda m: values[m.group(0)], TEMPLATE.read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("thunk_json")
    ap.add_argument("definition_json")
    ap.add_argument("out_html")
    ap.add_argument("--server", default="Thunk.AI",
                    help='claude.ai connector display name for live data ("" = snapshot only)')
    ap.add_argument("--no-run", action="store_true",
                    help="MCP-server cards: leave out run_tool, so the page can only read")
    args = ap.parse_args()

    thunk = json.loads(Path(args.thunk_json).read_text(encoding="utf-8"))
    defn = json.loads(Path(args.definition_json).read_text(encoding="utf-8"))
    out = build(thunk, defn, args.server, allow_run=not args.no_run)
    Path(args.out_html).write_text(out, encoding="utf-8")
    kind = thunk.get("kind") or "workflow"
    print(f"wrote {args.out_html} ({len(out)} bytes, {kind} card)")
    print("capabilities: " + json.dumps(capabilities(kind, args.server, allow_run=not args.no_run)))


if __name__ == "__main__":
    main()
