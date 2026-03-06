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
    for extra in ["+type:song", ""]:
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


# ── Download helpers ──────────────────────────────────────────────────────────
def download(url: str, dest: pathlib.Path, ua: str | None = None) -> bool:
    headers = {"User-Agent": ua or "Seabirdle/1.0"}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as r:
            dest.write_bytes(r.read())
        return True
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} downloading {url}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"  Failed downloading {url}: {e}", file=sys.stderr)
        return False


def download_audio(rec: dict) -> str | None:
    """Download XC recording. Returns relative path string or None."""
    xc_id    = rec.get("id", "unknown")
    audio_url = rec.get("file") or f"https://xeno-canto.org/{xc_id}/download"
    dest     = AUDIO_DIR / "today.mp3"
    print(f"  Downloading audio XC{xc_id}…")
    if download(audio_url, dest):
        print(f"  Audio saved → {dest.relative_to(REPO_ROOT)}")
        return "audio/today.mp3"
    return None


def get_inaturalist_photo_url(genus: str, species: str) -> str | None:
    """Fetch a photo URL from iNaturalist observations.
    Uses /v1/observations (not /v1/taxa) so we can filter by:
      - quality_grade=research  (community-verified ID)
      - order_by=votes          (most popular/faved first)
      - iconic_taxa=Aves        (birds only)
    Falls back to /v1/taxa default_photo if no observations found.
    """
    scientific = f"{genus} {species}"

    # ── Primary: research-grade observations ordered by votes ────────────────
    params = urllib.parse.urlencode({
        "taxon_name":   scientific,
        "quality_grade": "research",
        "iconic_taxa":  "Aves",
        "photos":       "true",
        "order_by":     "votes",
        "per_page":     "10",
    })
    obs_url = f"https://api.inaturalist.org/v1/observations?{params}"
    try:
        req = urllib.request.Request(obs_url, headers={"User-Agent": WM_USER_AGENT})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.load(r)
        results = data.get("results", [])
        for obs in results:
            photos = obs.get("photos", [])
            if not photos:
                continue
            raw = photos[0].get("url", "")
            if not raw:
                continue
            # iNaturalist photo URLs end in /square.jpg — swap to medium
            url  = raw.replace("/square.", "/medium.")
            attr = photos[0].get("attribution", "")
            print(f"  iNaturalist obs: {url}  [{attr}]")
            return url
    except Exception as e:
        print(f"  iNaturalist observations error: {e}", file=sys.stderr)

    # ── Fallback: taxa default_photo (no quality filter) ─────────────────────
    print(f"  Falling back to taxa API for {scientific!r}")
    taxa_params = urllib.parse.urlencode({
        "q":            scientific,
        "rank":         "species",
        "iconic_taxa":  "Aves",
        "per_page":     "3",
    })
    try:
        req = urllib.request.Request(
            f"https://api.inaturalist.org/v1/taxa?{taxa_params}",
            headers={"User-Agent": WM_USER_AGENT}
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            data = json.load(r)
        results = data.get("results", [])
        if not results:
            print(f"  iNaturalist: no taxa results for {scientific!r}", file=sys.stderr)
            return None
        bird  = next((r for r in results if "Aves" in (r.get("ancestry") or "")), results[0])
        photo = bird.get("default_photo", {})
        url   = photo.get("medium_url")
        print(f"  iNaturalist taxa fallback: {url}  [{photo.get('attribution', '')}]")
        return url
    except Exception as e:
        print(f"  iNaturalist taxa error: {e}", file=sys.stderr)
        return None



def download_image(genus: str, species: str) -> str | None:
    """Fetch image from iNaturalist and save locally. Returns relative path or None."""
    direct_url = get_inaturalist_photo_url(genus, species)
    if not direct_url:
        return None
    ext  = pathlib.Path(urllib.parse.urlparse(direct_url).path).suffix or ".jpg"
    dest = IMG_DIR / f"today{ext}"
    print(f"  Downloading image…")
    if download(direct_url, dest):
        rel = str(dest.relative_to(REPO_ROOT)).replace("\\", "/")
        print(f"  Image saved → {rel}")
        return rel
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

    # Download image
    image_path = download_image(genus, species)
    if not image_path:
        print("  WARNING: image not saved — will fall back to birds_list.json URL", file=sys.stderr)
        image_path = bird.get("image")  # keep remote URL as fallback

    output = {
        "date":      today,
        "name":      name,
        "genus":     genus,
        "species":   species,
        "recording": rec,
        "audioPath": audio_path,   # "audio/today.mp3" or null
        "imagePath": image_path,   # "img/daily/today.jpg" or fallback URL
    }

    BIRDS_OUTPUT.write_text(
        json.dumps(output, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    print(f"\n  Written {BIRDS_OUTPUT.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()