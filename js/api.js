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
  // Always use local audio downloaded by GitHub Action
  return './audio/today.mp3';
}

function imageUrl() {
  if (S.bird && S.bird.image) {
    const path = S.bird.image.replace(/\\/g,'/');
    console.log('Using local image:', path);
    return path.startsWith('http') ? path : './' + path;
  }
  console.warn('No image available for today!');
  return null;
}