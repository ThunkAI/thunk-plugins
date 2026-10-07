#!/usr/bin/env python3
"""Tests for build.py: python3 <this skill's folder>/thunk-card/test_build.py"""
import json
import shutil
import subprocess
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

from build import build, capabilities, trim_definition


class _Scripts(HTMLParser):
    """Collects each <script> element as (attributes, text), case-insensitively."""

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.scripts = []
        self._in_script = False

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            self._in_script = True
            self.scripts.append((dict(attrs), ""))

    def handle_endtag(self, tag):
        if tag == "script":
            self._in_script = False

    def handle_data(self, data):
        if self._in_script:
            attrs, text = self.scripts[-1]
            self.scripts[-1] = (attrs, text + data)


def page_scripts(page):
    parser = _Scripts()
    parser.feed(page)
    parser.close()
    return parser.scripts

THUNK = {"thunkId": "T1=", "name": "Intake <b>&</b>", "kind": "workflow", "goal": "g",
         "status": "ready", "url": "https://app.thunk.ai/thunk/T1=", "paused": False,
         "description": "not shown"}
DEFN = {
    "mcpUrl": "https://x/mcp",
    "steps": [{
        "id": "s1", "title": "Classify", "initialStatus": "New", "finalStatus": "Done",
        "inputProperties": ["A"], "outputProperties": ["B"],
        "directions": "Stop </script><script>alert(1)</script>",
        "toolConfig": [
            {"id": "lib1", "name": "L1", "enabled": True,
             "tools": [{"name": "on", "enabled": True}, {"name": "off", "enabled": False}]},
            {"id": "lib2", "name": "L2", "enabled": False, "tools": [{"name": "x", "enabled": True}]},
        ],
    }],
    "properties": [{"name": "A", "type": "TEXT", "isSystem": False, "description": "d",
                    "constraints": {"isInput": True, "isSensitive": True, "connectionTarget": {"big": 1}}},
                   {"name": "C", "type": "TEXT", "isSystem": False, "constraints": None}],
    "connections": [{"name": "On", "enabledOnThunk": True, "tools": ["a"]},
                    {"name": "Off", "enabledOnThunk": False}],
    "plugIns": [{"alias": "P", "interface": {"name": "ai.thunk/p", "tools": [{"name": "t", "inputSchema": {}}]},
                 "bindingCases": [{"match": "M", "boundConnectionId": "T2="}]}],
    "export": {"enabled": False},
}


def snapshot_of(page):
    text = next(t for attrs, t in page_scripts(page) if attrs.get("id") == "snapshot")
    return json.loads(text)


class TrimTest(unittest.TestCase):
    def test_keeps_only_enabled_libraries_and_tools(self):
        step = trim_definition(DEFN)["steps"][0]
        self.assertEqual(step["toolConfig"], [{"id": "lib1", "enabled": True,
                                               "tools": [{"name": "on", "enabled": True}]}])

    def test_drops_disabled_connections_and_unshown_sections(self):
        d = trim_definition(DEFN)
        self.assertEqual(d["connections"], [{"name": "On", "enabledOnThunk": True}])
        self.assertEqual(set(d["export"]), {"enabled", "name", "description", "version", "mcpUrl", "tools", "interface"})
        # isSensitive is kept: the page hides those values until the viewer asks.
        self.assertEqual(d["properties"][0]["constraints"], {"isInput": True, "isSensitive": True})
        self.assertEqual(d["properties"][1]["constraints"], {})
        self.assertEqual(d["plugIns"][0]["interface"]["tools"], [{"name": "t"}])

    def test_tolerates_missing_sections(self):
        d = trim_definition({})
        self.assertEqual(d["steps"], [])
        self.assertEqual(d["planBindings"], {})


class BuildTest(unittest.TestCase):
    def test_snapshot_round_trips_and_cannot_close_the_script(self):
        page = build(THUNK, DEFN, "Thunk.AI", captured_at_ms=5)
        # Only the template's own script tags close; the directions text cannot.
        self.assertEqual(page.count("</script>"), 2)
        snap = snapshot_of(page)
        self.assertEqual(snap["capturedAt"], 5)
        self.assertEqual(snap["def"]["steps"][0]["directions"], DEFN["steps"][0]["directions"])
        self.assertNotIn("description", snap["thunk"])

    def test_title_is_escaped(self):
        page = build(THUNK, DEFN, "Thunk.AI")
        self.assertIn("<title>Intake &lt;b&gt;&amp;&lt;/b&gt; · Thunk.AI</title>", page)

    def test_page_says_it_is_a_thunk_on_thunk_ai(self):
        page = build(THUNK, DEFN, "Thunk.AI")
        self.assertIn('<a class="brand-name" href="https://thunk.ai"', page)
        self.assertIn("<span>Thunk.AI</span>", page)
        self.assertIn("A view of a thunk that is built and hosted on Thunk.AI", page)
        # The brand comes before the thunk's own header.
        self.assertLess(page.index('class="brand"'), page.index('id="head"'))

    def test_hidden_attribute_beats_display_rules(self):
        # .btn sets display, which would otherwise show the hidden Open chat button on non-chat cards.
        page = build(THUNK, DEFN, "Thunk.AI")
        self.assertIn('id="open-chat" href="#" target="_blank" rel="noopener" hidden', page)
        self.assertIn("[hidden] { display: none !important; }", page)

    def test_placeholder_in_a_name_is_not_substituted(self):
        page = build(dict(THUNK, name="__SNAPSHOT__"), DEFN, "Thunk.AI")
        self.assertIn("<title>__SNAPSHOT__ · Thunk.AI</title>", page)

    def test_server_is_a_js_string(self):
        self.assertIn('var SERVER = "Thunk.AI";', build(THUNK, DEFN, "Thunk.AI"))
        self.assertIn('var SERVER = "";', build(THUNK, DEFN, ""))
        self.assertNotIn("__", build(THUNK, DEFN, "x").split("<style>")[0])

    def test_work_items_are_read_live_and_never_embedded(self):
        page = build(THUNK, dict(DEFN, items=[{"name": "Jane Doe"}]), "Thunk.AI")
        snap = snapshot_of(page)
        self.assertEqual(set(snap), {"capturedAt", "thunk", "def"})
        self.assertNotIn("items", snap["def"])
        self.assertNotIn("Jane Doe", page)
        self.assertIn('"query_work_items"', page)
        self.assertIn('"get_work_item_state"', page)

    def test_mcp_card_keeps_interface_and_schemas(self):
        mcp_thunk = dict(THUNK, kind="mcpServer", productionMode="Prototype")
        defn = {"mcpUrl": "https://x/api/thunk/T1=/mcp",
                "tools": [{"name": "find", "description": "d", "type": "code", "enabled": True,
                           "intent": "internal note", "inputSchema": {"type": "object", "properties": {"q": {"type": "string"}}},
                           "lastModifiedOn": "2026-01-01"}],
                "export": {"enabled": True, "name": "S", "version": "1.0.0", "mcpUrl": "https://x/mcp", "createdOn": "c",
                           "tools": [{"name": "find", "title": "find", "description": "d", "enabled": True}],
                           "interface": {"name": "ai.thunk/x", "version": "1.0.0", "tools": [{"name": "find", "inputSchema": {}}]}}}
        snap = snapshot_of(build(mcp_thunk, defn, "Thunk.AI"))
        self.assertEqual(snap["thunk"]["productionMode"], "Prototype")
        self.assertEqual(snap["def"]["tools"], [{"name": "find", "description": "d", "type": "code", "enabled": True,
                                                 "inputSchema": {"type": "object", "properties": {"q": {"type": "string"}}}}])
        self.assertEqual(snap["def"]["export"]["tools"], [{"name": "find", "enabled": True}])
        self.assertEqual(snap["def"]["export"]["interface"], {"name": "ai.thunk/x", "version": "1.0.0"})
        self.assertEqual(snap["def"]["mcpUrl"], "https://x/api/thunk/T1=/mcp")

    def test_capabilities_follow_kind_and_run_switch(self):
        self.assertEqual(capabilities("workflow", "Thunk.AI")["mcp"]["servers"][0]["tools"],
                         ["get_thunk", "get_definition", "query_work_items", "get_work_item_state"])
        self.assertEqual(capabilities("chatApp", "Thunk.AI"), capabilities("workflow", "Thunk.AI"))
        mcp_tools = capabilities("mcpServer", "Thunk.AI")["mcp"]["servers"][0]["tools"]
        self.assertIn("run_tool", mcp_tools)
        self.assertIn("get_tool_call_history", mcp_tools)
        self.assertNotIn("run_tool", capabilities("mcpServer", "Thunk.AI", allow_run=False)["mcp"]["servers"][0]["tools"])
        self.assertEqual(capabilities("mcpServer", ""), {})

    def test_no_run_turns_the_page_switch_off(self):
        self.assertIn("var ALLOW_RUN = true;", build(THUNK, DEFN, "Thunk.AI"))
        self.assertIn("var ALLOW_RUN = false;", build(THUNK, DEFN, "Thunk.AI", allow_run=False))

    @unittest.skipUnless(shutil.which("node"), "node not installed")
    def test_page_script_parses(self):
        page = build(THUNK, DEFN, "Thunk.AI")
        script = page_scripts(page)[-1][1]
        with tempfile.TemporaryDirectory() as d:
            f = Path(d) / "page.js"
            f.write_text(script, encoding="utf-8")
            subprocess.run(["node", "--check", str(f)], check=True)


if __name__ == "__main__":
    unittest.main()
