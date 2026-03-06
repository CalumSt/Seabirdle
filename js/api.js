// js/api.js

async function loadBirdsJson() {
  const r = await fetch('./birds.json');
  if (!r.ok) throw new Error(`birds.json ${r.status}`);
  return r.json();
}

function audioUrl() {
  return './audio/today.mp3';
}

function imageUrl() {
  // S.daily.imagePath is the local path written by the GitHub Action
  if (S.daily && S.daily.imagePath) {
    const p = S.daily.imagePath.replace(/\\/g, '/');
    return p.startsWith('http') ? p : './' + p;
  }
  // Fallback: birds_list.json image field (may be a remote URL)
  return S.bird ? S.bird.image : null;
}