#!/usr/bin/env python3
import json
import re
import sys

def respond(decision="allow", reason=None):
    out = {"decision": decision}
    if reason:
        out["reason"] = reason
    sys.stdout.write(json.dumps(out))
    sys.exit(0)

if __name__ == "__main__":
    try:
        data = json.load(sys.stdin)
        event = data.get("hook_event_name", "")

        if event == "BeforeTool":
            inp = data.get("tool_input", {})
            path = str(inp.get("file_path", inp.get("path", "")))
            code = str(inp.get("content", inp.get("new_string", "")))

            if path.endswith(".py"):
                if re.search(r"\.shift\(\s*-\d+\s*\)", code):
                    respond("deny", "Look-ahead bias blocked: negative .shift(-N) leaks future order-book ticks.")
                if re.search(r"float\s*\(\s*.*?(price|rate|amount|book_value|inr|capital|margin)", code, re.IGNORECASE):
                    respond("deny", "Floating-point currency bug: use decimal.Decimal or integer paise instead of float().")

        elif event == "AfterAgent" and not data.get("stop_hook_active", False):
            reply = data.get("prompt_response", "")
            if re.search(r"\b(TODO|TBD|PLACEHOLDER|DUMMY_VALUE)\b", reply):
                respond("deny", "Replace all TODO/TBD placeholders with exact computed metrics before finishing.")

        respond("allow")
    except Exception as exc:
        sys.stderr.write(f"[quant_audit_gate] Warning: {exc}\n")
        respond("allow")
