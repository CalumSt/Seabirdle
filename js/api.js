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
  if (S.daily && S.daily.audioPath) {
    const path = './' + S.daily.audioPath.replace(/\\/g,'/');
    console.log('Using local audio:', path);
    return path;
  }
  console.warn('No local audio available for today!');
  return null;
}

function imageUrl() {
  if (S.daily && S.daily.imagePath) {
    const path = S.daily.imagePath.replace(/\\/g,'/');
    console.log('Using local image:', path);
    return path.startsWith('http') ? path : './' + path;
  }
  console.warn('No local image available for today!');
  return null;
}