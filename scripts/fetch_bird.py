#!/usr/bin/env python3
"""
scripts/fetch_bird.py
Runs nightly via GitHub Actions. Reads birds_list.json, picks today's bird,
fetches a xeno-canto recording, downloads the audio and image locally, and
writes birds.json with local paths so the browser never makes cross-origin
requests at runtime.

Requires:  env var XC_KEY  (set as GitHub Secret: XC_API_KEY)
"""

import os, json, datetime, urllib.request, urllib.parse, urllib.error, sys, pathlib, re

REPO_ROOT    = pathlib.Path(__file__).resolve().parent.parent
BIRDS_LIST   = REPO_ROOT / "birds_list.json"
BIRDS_OUTPUT = REPO_ROOT / "birds.json"
AUDIO_DIR    = REPO_ROOT / "audio"
IMG_DIR      = REPO_ROOT / "img" / "daily"
XC_BASE      = "https://xeno-canto.org/api/3/recordings"
WM_USER_AGENT = "Seabirdle/1.0 (https://github.com/your-username/seabirdle; your@email.com) Python/3"

AUDIO_DIR.mkdir(exist_ok=True)
IMG_DIR.mkdir(parents=True, exist_ok=True)


# ── Hash — mirrors js/utils.js::hash() exactly ───────────────────────────────
def js_hash(s: str) -> int:
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


# ── xeno-canto ────────────────────────────────────────────────────────────────
def fetch_recording(genus: str, species: str, key: str) -> dict | None:
    for extra in ["+type:call", ""]:
        query = f"gen:{genus}+sp:{species}+q:A{extra}"
        url   = f"{XC_BASE}?query={query}&key={key}&per_page=20"
        try:
            print(f"  XC query: {query!r}")
            with urllib.request.urlopen(url, timeout=15) as r:
                data = json.load(r)
            recs = data.get("recordings", [])
            print(f"  Found {len(recs)} recordings")
            if recs:
                return recs[daily_rec_idx(len(recs))]
        except Exception as e:
            print(f"  XC attempt failed ({extra!r}): {e}", file=sys.stderr)
    return None


# ── Main ──────────────────────────────────────────────────────────────────────
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
    print(f"Today ({today}): {name} ({genus} {species}), index {idx}/{len(birds)}\n")

    # Recording
    rec = fetch_recording(genus, species, key)
    if rec:
        print(f"  Recording: XC{rec.get('id')} by {rec.get('rec')} [{rec.get('lic')}]")
    else:
        print("  WARNING: no recording found", file=sys.stderr)

    # Download audio
    audio_path = download_audio(rec) if rec else None
    if not audio_path:
        print("  WARNING: audio not saved", file=sys.stderr)

    output = {
        "date":      today,
        "name":      name,
        "genus":     genus,
        "species":   species,
        "recording": rec,
        "audioPath": audio_path,   # "audio/today.mp3" or null

    }

    BIRDS_OUTPUT.write_text(
        json.dumps(output, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    print(f"\n  Written {BIRDS_OUTPUT.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()