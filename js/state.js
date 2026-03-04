// js/state.js
// App state and determinism helpers.

// ── Key storage ───────────────────────────────────────────────────────────────
// Falls back to in-memory if localStorage is unavailable (e.g. Claude artifact preview).
const getKey  = () => { try { return localStorage.getItem('xc_key') || ''; } catch(_) { return _memKey; } };
const saveKey = k  => { k = k.trim(); try { localStorage.setItem('xc_key', k); } catch(_) { _memKey = k; } };
let _memKey = '';

// ── Daily determinism ─────────────────────────────────────────────────────────
const dailyBirdIdx = () => hash(todayStr()) % BIRDS.length;
const dailyRecIdx  = (n) => hash(todayStr() + 'rec') % n;

// ── Mutable game state ────────────────────────────────────────────────────────
let S = {
  bird:    null,   // BIRDS entry
  rec:     null,   // xeno-canto recording object (or null if using birds.json)
  guesses: [],     // [{name, ok}]
  plays:   MAX_P,
  over:    false,
  acIdx:   -1,
};
let aud = null;    // HTMLAudioElement, created on first play