#!/usr/bin/env python3
"""
scripts/fetch_bird.py
Runs nightly via GitHub Actions. Picks today's bird using the same
deterministic hash as the JS (utils.js::hash + dailyBirdIdx), fetches a
quality:A call recording from xeno-canto, and writes birds.json.

Requires:  env var XC_KEY  (set as a GitHub Secret: XC_API_KEY)
"""

import os, json, hashlib, datetime, urllib.request, urllib.parse, sys

# ── Bird list: must stay in sync with js/data.js ──────────────────────────────
# Schema: (englishName, genus, species)
BIRDS = [
    ("Atlantic Puffin",          "Fratercula",      "arctica"),
    ("Razorbill",                "Alca",            "torda"),
    ("Common Guillemot",         "Uria",            "aalge"),
    ("Black Guillemot",          "Cepphus",         "grylle"),
    ("Little Auk",               "Alle",            "alle"),
    ("Northern Gannet",          "Morus",           "bassanus"),
    ("European Shag",            "Gulosus",         "aristotelis"),
    ("Great Cormorant",          "Phalacrocorax",   "carbo"),
    ("Manx Shearwater",          "Puffinus",        "puffinus"),
    ("Sooty Shearwater",         "Ardenna",         "grisea"),
    ("Balearic Shearwater",      "Puffinus",        "mauretanicus"),
    ("European Storm Petrel",    "Hydrobates",      "pelagicus"),
    ("Leach's Storm Petrel",     "Hydrobates",      "leucorhous"),
    ("Northern Fulmar",          "Fulmarus",        "glacialis"),
    ("Great Skua",               "Stercorarius",    "skua"),
    ("Arctic Skua",              "Stercorarius",    "parasiticus"),
    ("Pomarine Skua",            "Stercorarius",    "pomarinus"),
    ("Black-legged Kittiwake",   "Rissa",           "tridactyla"),
    ("European Herring Gull",    "Larus",           "argentatus"),
    ("Great Black-backed Gull",  "Larus",           "marinus"),
    ("Lesser Black-backed Gull", "Larus",           "fuscus"),
    ("Common Gull",              "Larus",           "canus"),
    ("Black-headed Gull",        "Chroicocephalus", "ridibundus"),
    ("Mediterranean Gull",       "Ichthyaetus",     "melanocephalus"),
    ("Little Gull",              "Hydrocoloeus",    "minutus"),
    ("Arctic Tern",              "Sterna",          "paradisaea"),
    ("Common Tern",              "Sterna",          "hirundo"),
    ("Sandwich Tern",            "Thalasseus",      "sandvicensis"),
    ("Roseate Tern",             "Sterna",          "dougallii"),
    ("Little Tern",              "Sternula",        "albifrons"),
    ("Red-throated Diver",       "Gavia",           "stellata"),
    ("Great Northern Diver",     "Gavia",           "immer"),
]

XC_BASE = "https://xeno-canto.org/api/3/recordings"


# ── Hash matching js/utils.js::hash() ─────────────────────────────────────────
def js_hash(s: str) -> int:
    """Replicates: let h=0; for each char: h=(Math.imul(31,h)+charCode)|0; return Math.abs(h)"""
    h = 0
    for ch in s:
        # Math.imul(31, h) — 32-bit integer multiply
        product = (31 * h) & 0xFFFFFFFF
        # Handle sign: JS |0 is signed 32-bit
        if product >= 0x80000000:
            product -= 0x100000000
        h = (product + ord(ch)) & 0xFFFFFFFF
        if h >= 0x80000000:
            h -= 0x100000000
    return abs(h)


def today_str() -> str:
    return datetime.date.today().isoformat()  # e.g. "2025-03-04"


def daily_bird_idx() -> int:
    return js_hash(today_str()) % len(BIRDS)


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
            print(f"  XC fetch attempt failed ({extra!r}): {e}", file=sys.stderr)
    return None


def main():
    key = os.environ.get("XC_KEY", "").strip()
    if not key:
        sys.exit("ERROR: XC_KEY environment variable not set")

    today   = today_str()
    idx     = daily_bird_idx()
    name, genus, species = BIRDS[idx]
    print(f"Today ({today}): {name} ({genus} {species}), bird index {idx}")

    rec = fetch_recording(genus, species, key)
    if rec:
        print(f"  Recording: XC{rec.get('id')} by {rec.get('rec')} [{rec.get('lic')}]")
    else:
        print("  WARNING: No recording found — birds.json will have null recording", file=sys.stderr)

    output = {
        "date":      today,
        "name":      name,
        "genus":     genus,
        "species":   species,
        "recording": rec,
    }

    out_path = os.path.join(os.path.dirname(__file__), "..", "birds.json")
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"  Written to birds.json")


if __name__ == "__main__":
    main()