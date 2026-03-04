#!/usr/bin/env python3
"""
scripts/fetch_bird.py
Runs nightly via GitHub Actions. Reads birds_list.json as the single source
of truth, picks today's bird using the same deterministic hash as the JS
client, fetches a quality:A call recording from xeno-canto, and writes
birds.json.

Requires:  env var XC_KEY  (set as GitHub Secret: XC_API_KEY)
"""

import os, json, datetime, urllib.request, urllib.parse, sys, pathlib

REPO_ROOT    = pathlib.Path(__file__).parent.parent
BIRDS_LIST   = REPO_ROOT / "birds_list.json"
BIRDS_OUTPUT = REPO_ROOT / "birds.json"
XC_BASE      = "https://xeno-canto.org/api/3/recordings"


# ── Hash — replicates js/utils.js::hash() exactly ────────────────────────────
def js_hash(s: str) -> int:
    """Mirrors: let h=0; for each char: h=(Math.imul(31,h)+charCode)|0; return Math.abs(h)"""
    h = 0
    for ch in s:
        product = (31 * h) & 0xFFFFFFFF
        if product >= 0x80000000:
            product -= 0x100000000
        h = (product + ord(ch)) & 0xFFFFFFFF
        if h >= 0x80000000:
            h -= 0x100000000
    return abs(h)


def today_str() -> str:
    return datetime.date.today().isoformat()


def daily_bird_idx(n: int) -> int:
    return js_hash(today_str()) % n


def daily_rec_idx(n: int) -> int:
    return js_hash(today_str() + "rec") % n


# ── XC fetch ──────────────────────────────────────────────────────────────────
def fetch_recording(genus: str, species: str, key: str) -> dict | None:
    for extra in ["+type:call", ""]:
        query = f"gen:{genus}+sp:{species}+q:A{extra}"
        url   = f"{XC_BASE}?query={urllib.parse.quote(query)}&key={urllib.parse.quote(key)}&per_page=20"
        try:
            with urllib.request.urlopen(url, timeout=15) as r:
                data = json.load(r)
            recs = data.get("recordings", [])
            if recs:
                return recs[daily_rec_idx(len(recs))]
        except Exception as e:
            print(f"  XC attempt failed ({extra!r}): {e}", file=sys.stderr)
    return None


def main():
    key = os.environ.get("XC_KEY", "").strip()
    if not key:
        sys.exit("ERROR: XC_KEY environment variable not set")

    if not BIRDS_LIST.exists():
        sys.exit(f"ERROR: {BIRDS_LIST} not found")

    birds = json.loads(BIRDS_LIST.read_text(encoding="utf-8"))
    if not birds:
        sys.exit("ERROR: birds_list.json is empty")

    today = today_str()
    idx   = daily_bird_idx(len(birds))
    bird  = birds[idx]
    name, genus, species = bird["name"], bird["genus"], bird["species"]

    print(f"Today ({today}): {name} ({genus} {species}), index {idx}/{len(birds)}")

    rec = fetch_recording(genus, species, key)
    if rec:
        print(f"  Recording: XC{rec.get('id')} by {rec.get('rec')} [{rec.get('lic')}]")
    else:
        print("  WARNING: no recording found — birds.json will have null recording", file=sys.stderr)

    BIRDS_OUTPUT.write_text(
        json.dumps({"date": today, "name": name, "genus": genus,
                    "species": species, "recording": rec}, indent=2),
        encoding="utf-8"
    )
    print(f"  Written {BIRDS_OUTPUT}")


if __name__ == "__main__":
    main()