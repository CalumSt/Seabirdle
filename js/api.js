// js/api.js
// Data fetching.

// ── birds.json loader ─────────────────────────────────────────────────────────
async function loadBirdsJson() {
  const r = await fetch('./birds.json');
  if (!r.ok) throw new Error(`birds.json ${r.status}`);
  return r.json();
}

// ── URL helpers — prefer local paths written by the GitHub Action ─────────────
// S.daily is set in boot() to the full birds.json payload.
function audioUrl() {
  if (S.daily && S.daily.audioPath) return './' + S.daily.audioPath;
  if (S.rec) return S.rec.file || `https://xeno-canto.org/${S.rec.id}/download`;
  return null;
}

function imageUrl() {
  if (S.daily && S.daily.imagePath) {
    let path = S.daily.imagePath.replace(/\\/g, '/');
    return path.startsWith('http') ? path : './' + path;
  }
  return S.bird ? S.bird.image : null;
}