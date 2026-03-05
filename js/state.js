// js/state.js
// App state and determinism helpers.

// ── Daily determinism ─────────────────────────────────────────────────────────
const dailyBirdIdx = () => hash(todayStr()) % BIRDS.length;
const dailyRecIdx  = (n) => hash(todayStr() + 'rec') % n;

// ── Mutable game state ────────────────────────────────────────────────────────
let S = {
  bird:    null,   // BIRDS entry from birds_list.json
  rec:     null,   // xeno-canto recording object
  daily:   null,   // full birds.json payload — holds audioPath / imagePath
  guesses: [],     // [{name, ok}]
  plays:   MAX_P,
  over:    false,
  acIdx:   -1,
};
let aud = null;    // HTMLAudioElement, created on first play