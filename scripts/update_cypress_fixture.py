#!/usr/bin/env python3
"""
scripts/update_cypress_fixture.py
Rewrites cypress/fixtures/birds.json so its "date" field matches today.
Run this before `npx cypress run` to ensure the date-staleness check passes.

Usage:
    python scripts/update_cypress_fixture.py
"""

import json, datetime, pathlib

FIXTURE = pathlib.Path(__file__).parent.parent / "cypress" / "fixtures" / "birds.json"

if not FIXTURE.exists():
    raise FileNotFoundError(f"Fixture not found: {FIXTURE}")

data = json.loads(FIXTURE.read_text(encoding="utf-8"))
old  = data.get("date")
data["date"] = datetime.date.today().isoformat()

FIXTURE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"Updated {FIXTURE.relative_to(FIXTURE.parent.parent)}: {old!r} → {data['date']!r}")