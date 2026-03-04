// js/api.js
// Data fetching. Priority:
//   1. birds.json (generated nightly by GitHub Action — no key needed at runtime)
//   2. Live xeno-canto API (requires key — used if birds.json is absent/stale)

// ── birds.json loader ─────────────────────────────────────────────────────────
async function loadBirdsJson() {
  const r = await fetch('./birds.json');
  if (!r.ok) throw new Error(`birds.json ${r.status}`);
  return r.json();
}

// ── Live XC fetch (fallback / "new random bird" mode) ─────────────────────────
async function fetchXC(bird, key) {
  for (const extra of ['+type:call', '']) {
    const q = `gen:${bird[1]}+sp:${bird[2]}+q:A${extra}`;
    try {
      const r = await fetch(
        `${XC_BASE}?query=${encodeURIComponent(q)}&key=${encodeURIComponent(key)}&per_page=20`
      );
      const d = await r.json();
      if (d.recordings && d.recordings.length > 0)
        return d.recordings[dailyRecIdx(d.recordings.length)];
    } catch(_) { /* try next variant */ }
  }
  return null;
}

// ── Audio URL ─────────────────────────────────────────────────────────────────
function audioUrl() {
  if (!S.rec) return null;
  return S.rec.file || `https://xeno-canto.org/${S.rec.id}/download`;
}