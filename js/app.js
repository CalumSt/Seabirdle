/**
 * SEABIRDLE
 */

// --- 1. THEME ---
(function () {
    const KEY = 'seabirdle-theme';
    const btn = document.getElementById('theme-toggle');
    const apply = (dark) => {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        if (btn) btn.textContent = dark ? '☀️' : '🌙';
    };
    const saved = localStorage.getItem(KEY);
    const prefersDark = saved !== null ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    apply(prefersDark);
    if (btn) btn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        apply(!isDark);
        localStorage.setItem(KEY, isDark ? 'light' : 'dark');
    });
})();

// --- 2. CONSTANTS ---
const todayStr = () => new Date().toISOString().slice(0, 10);
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0; return Math.abs(h); };
const esc = (s) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

const MAX_G = 6;
const MAX_P = 6;
const BLUR_SEQ = [20, 16, 12, 8, 4, 1, 0];

let BIRDS = [], ALL_NAMES = [], aud = null;

// --- 3. STATE ---
let S = { bird: null, rec: null, daily: null, guesses: [], plays: MAX_P, over: false, acIdx: -1 };
// greenAt[i] = true if answer position i has been revealed green by any guess
let greenAt = [];

// --- 4. DOM ---
const $ = id => document.getElementById(id);
const loadEl    = $('loading-state'),  previewWrap = $('bird-preview-wrap'), imgEl    = $('bird-preview');
const blurLbl   = $('blur-label'),     progFill    = $('prog-fill');
const audioSec  = $('audio-section'),  playBtn     = $('play-btn'),          dotEl    = $('plays-dots');
const guessSec  = $('guesses-section'),inputSec    = $('input-section');
const gInput    = $('guess-input'),    subBtn      = $('submit-btn'),         acEl     = $('autocomplete');
const resPanel  = $('result-panel'),   toastEl     = $('toast'),              dateBadge= $('date-badge');
const hintPanel = $('hint-panel');

if (dateBadge) dateBadge.textContent = todayStr();

let _tid;
function toast(msg, ms = 2400) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(_tid);
    _tid = setTimeout(() => toastEl.classList.remove('show'), ms);
}
function shake() {
    if (!gInput) return;
    gInput.classList.remove('shake');
    void gInput.offsetWidth;
    gInput.classList.add('shake');
}

// --- 5. API ---
async function loadBirdsJson() {
    const r = await fetch('./birds.json');
    if (!r.ok) throw new Error(`birds.json ${r.status}`);
    return r.json();
}
function audioUrl() { return './audio/today.mp3'; }
function imageUrl() {
    if (S.daily && S.daily.imagePath) {
        const p = S.daily.imagePath.replace(/\\/g, '/');
        return p.startsWith('http') ? p : './' + p;
    }
    return S.bird ? S.bird.image : null;
}
const dailyBirdIdx = () => hash(todayStr()) % BIRDS.length;

// --- 6. LETTER SCORING ---
// Treats the full bird name as one letter sequence (spaces are spacers, not scored).
// Returns [{char, status}] where status = 'green'|'yellow'|'grey'|'space'
function scoreGuess(guess, answer) {
    const g = guess.toUpperCase();
    const a = answer.toUpperCase();
    const gLetters = [...g].filter(c => c !== ' ');
    const aLetters = [...a].filter(c => c !== ' ');
    const n = gLetters.length;
    const result = new Array(n).fill(null);
    const aRemaining = [...aLetters];

    // Pass 1 — greens
    for (let i = 0; i < n; i++) {
        if (i < aLetters.length && gLetters[i] === aLetters[i]) {
            result[i] = 'green';
            aRemaining[i] = null;
        }
    }
    // Pass 2 — yellows
    for (let i = 0; i < n; i++) {
        if (result[i] !== null) continue;
        const idx = aRemaining.indexOf(gLetters[i]);
        if (idx !== -1) { result[i] = 'yellow'; aRemaining[idx] = null; }
        else result[i] = 'grey';
    }

    // Re-attach spaces
    const out = [];
    let li = 0;
    for (const c of g) {
        if (c === ' ') out.push({ char: ' ', status: 'space' });
        else out.push({ char: c, status: result[li++] });
    }
    return out;
}

// Build HTML for a scored tile row
function tilesHTML(scored) {
    return scored.map(({ char, status }) =>
        status === 'space'
            ? '<span class="tile-gap"></span>'
            : `<span class="tile tile-${status}">${esc(char)}</span>`
    ).join('');
}

// --- 7. HINT PANEL ---
// Always visible. Letter blanks fill in green positions cumulatively.
// Permanent hints (country, genus) appear once triggered and stay.
function renderHintPanel() {
    if (!hintPanel || !S.bird) return;

    const answer = S.bird.name.toUpperCase();
    const aLetters = [...answer].filter(c => c !== ' ');

    // Build letter display: revealed greens shown, rest as blanks
    // Mirror the spacing of the answer
    let li = 0;
    const letterDisplay = [...answer].map(c => {
        if (c === ' ') return '<span class="hint-gap"></span>';
        const revealed = greenAt[li] ? `<span class="hint-letter green">${esc(c)}</span>`
                                     : `<span class="hint-letter blank">_</span>`;
        li++;
        return revealed;
    }).join('');

    const country  = S.rec && S.rec.cnt ? S.rec.cnt : null;
    const showGenus = S.guesses.length >= 3 || S.over;

    hintPanel.innerHTML = `
        <div class="hint-row hint-letters">${letterDisplay}</div>
        ${country ? `<div class="hint-row"><span class="hint-label">Recorded in</span><span class="hint-val">${esc(country)}</span></div>` : ''}
        ${showGenus ? `<div class="hint-row hint-reveal"><span class="hint-label">Genus</span><span class="hint-val">${esc(S.bird.genus)}</span></div>` : ''}
    `;
    hintPanel.style.display = 'flex';
}

// --- 8. GAME ---
async function boot() {
    loadEl.style.display = 'block';
    try {
        const [list, daily] = await Promise.all([
            fetch('./birds_list.json').then(r => { if (!r.ok) throw new Error('birds_list.json ' + r.status); return r.json(); }),
            loadBirdsJson(),
        ]);
        BIRDS = list; ALL_NAMES = list.map(b => b.name);
        if (daily.date !== todayStr() || !daily.name) throw new Error('birds.json is stale');
        S.bird = BIRDS.find(b => b.name === daily.name) || BIRDS[dailyBirdIdx()];
        S.rec = daily.recording || null;
        S.daily = daily;
        greenAt = new Array([...S.bird.name].filter(c => c !== ' ').length).fill(false);
        loadEl.style.display = 'none';
        if (localStorage.getItem('lastPlayDate') === todayStr()) {
            S.over = true;
            // Reveal all greens for already-played view
            greenAt.fill(true);
            setBlur(); previewWrap.style.display = 'block'; imgEl.src = imageUrl();
            renderHintPanel(); showResult(false); return;
        }
        startGame();
    } catch (err) {
        loadEl.style.display = 'none';
        toast('Could not load today\'s bird — try refreshing.', 6000);
        console.error('boot failed:', err);
    }
}

function startGame() {
    imgEl.src = imageUrl(); imgEl.style.filter = ''; imgEl.style.transform = '';
    setBlur();
    previewWrap.style.display = 'block';
    audioSec.style.display = 'flex';
    guessSec.style.display = 'flex';
    inputSec.style.display = 'block';
    playBtn.disabled = false; playBtn.textContent = '▶';
    gInput.disabled = false; subBtn.disabled = false; gInput.value = '';
    renderHintPanel(); renderG(); renderP();
}

function setBlur() {
    const n = Math.min(S.guesses.length, BLUR_SEQ.length - 1);
    const px = S.over ? 0 : BLUR_SEQ[n];
    imgEl.style.setProperty('--blur', px + 'px');
    if (px === 0) { imgEl.style.filter = 'blur(0px) brightness(1)'; imgEl.style.transform = 'scale(1)'; }
    progFill.style.width = (S.guesses.length / MAX_G * 100) + '%';
    blurLbl.textContent = S.over ? '' : `${MAX_G - S.guesses.length} guess${MAX_G - S.guesses.length === 1 ? '' : 'es'} remaining`;
}

function submitG() {
    if (S.over) return;
    const val = gInput.value.trim();
    if (!val) return;
    const match = BIRDS.find(b => b.name.toLowerCase() === val.toLowerCase());
    if (!match) { shake(); toast('Not in the seabird list'); return; }
    if (S.guesses.find(g => g.name.toLowerCase() === match.name.toLowerCase())) { shake(); toast('Already guessed!'); return; }

    const scored = scoreGuess(match.name, S.bird.name);
    const ok = match.name.toLowerCase() === S.bird.name.toLowerCase();

    // Update greenAt for hint panel
    let li = 0;
    for (const { char, status } of scored) {
        if (char === ' ') continue;
        if (status === 'green') greenAt[li] = true;
        li++;
    }

    S.guesses.push({ name: match.name, ok, scored });
    gInput.value = ''; acEl.style.display = 'none';
    renderG(); setBlur(); renderHintPanel();

    if (ok) { endGame(true); return; }
    if (S.guesses.length >= MAX_G) { endGame(false); return; }
}

function endGame(won) {
    S.over = true;
    gInput.disabled = true; subBtn.disabled = true;
    greenAt.fill(true); // reveal all on game end
    setBlur(); renderHintPanel();
    localStorage.setItem('lastPlayDate', todayStr());
    showResult(won);
}

function showResult(won) {
    const b = S.bird, r = S.rec;
    const alreadyPlayed = !S.guesses.length;
    resPanel.innerHTML = `
        <div id="res-title">${alreadyPlayed ? 'Already played today' : won ? 'Correct!' : 'Better luck next time'}</div>
        <div id="res-sub">${alreadyPlayed ? 'Come back tomorrow for a new bird.' : won ? `Found in ${S.guesses.length} guess${S.guesses.length === 1 ? '' : 'es'}` : 'The answer was…'}</div>
        <div id="res-name">🐦 ${esc(b.name)}</div>
        <div id="res-latin"><em>${esc(b.genus)} ${esc(b.species)}</em></div>
        <img id="res-img" src="${imageUrl()}" alt="${esc(b.name)}" onerror="this.style.display='none'" />
        <p id="res-fact">${esc(b.fact)}</p>
        ${r ? `<p id="res-credit">Recording: ${esc(r.rec)} · XC${esc(r.id)}</p>` : ''}
        ${S.daily && S.daily.imageAttribution ? `<p id="res-credit">Photo: ${esc(S.daily.imageAttribution)}</p>` : ''}
    `;
    resPanel.classList.add('show');
}

// --- 9. RENDER ---
function renderG() {
    guessSec.innerHTML = '';
    for (let i = 0; i < MAX_G; i++) {
        const row = document.createElement('div');
        if (i < S.guesses.length) {
            const g = S.guesses[i];
            row.className = 'guess-row ' + (g.ok ? 'correct' : 'wrong');
            row.innerHTML = `
                <span class="gn">${i + 1}</span>
                <span class="gt tiles">${tilesHTML(g.scored)}</span>
                <span class="gi">${g.ok ? '✓' : '✗'}</span>`;
        } else {
            row.className = 'guess-row empty';
            row.innerHTML = `<span class="gn">${i + 1}</span><span class="gt"></span>`;
        }
        guessSec.appendChild(row);
    }
}

function renderP() { dotEl.textContent = '●'.repeat(S.plays) + '○'.repeat(MAX_P - S.plays); }

// --- 10. AUDIO ---
playBtn.addEventListener('click', () => {
    if (S.plays <= 0 || S.over) return;
    if (aud && !aud.paused) { aud.pause(); aud.currentTime = 0; playBtn.textContent = '▶'; playBtn.classList.remove('playing'); return; }
    if (!aud) {
        aud = new Audio(audioUrl());
        aud.crossOrigin = 'anonymous';
        aud.addEventListener('ended', () => { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); });
        aud.addEventListener('error', e => { console.error('[audio] error:', e.target.error); toast('Audio failed to load'); });
    } else { aud.src = audioUrl(); aud.currentTime = 0; }
    playBtn.textContent = '⏹'; playBtn.classList.add('playing');
    aud.play().then(() => { S.plays--; renderP(); if (S.plays === 0) playBtn.disabled = true; })
              .catch(err => { playBtn.textContent = '▶'; playBtn.classList.remove('playing'); toast(err.name === 'NotAllowedError' ? 'Click again to play' : 'Playback error'); });
});

// --- 11. AUTOCOMPLETE ---
function hiAC(its) { its.forEach((el, i) => el.classList.toggle('sel', i === S.acIdx)); if (S.acIdx >= 0) gInput.value = its[S.acIdx].textContent; }

gInput.addEventListener('input', () => {
    const v = gInput.value.trim().toLowerCase(); S.acIdx = -1;
    if (!v) { acEl.style.display = 'none'; return; }
    const hits = ALL_NAMES.filter(n => n.toLowerCase().includes(v));
    if (!hits.length) { acEl.style.display = 'none'; return; }
    acEl.innerHTML = '';
    hits.slice(0, 8).forEach((name) => {
        const el = document.createElement('div'); el.className = 'ac-item';
        const lo = name.toLowerCase(), mi = lo.indexOf(v);
        el.innerHTML = esc(name.slice(0, mi)) + `<span class="ac-m">${esc(name.slice(mi, mi + v.length))}</span>` + esc(name.slice(mi + v.length));
        el.addEventListener('mousedown', e => { e.preventDefault(); gInput.value = name; acEl.style.display = 'none'; });
        acEl.appendChild(el);
    });
    acEl.style.display = 'block';
});

gInput.addEventListener('keydown', e => {
    const its = [...acEl.querySelectorAll('.ac-item')];
    if      (e.key === 'ArrowDown')  { e.preventDefault(); S.acIdx = Math.min(S.acIdx + 1, its.length - 1); hiAC(its); }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); S.acIdx = Math.max(S.acIdx - 1, -1); hiAC(its); }
    else if (e.key === 'Escape')     acEl.style.display = 'none';
    else if (e.key === 'Enter') {
        if (S.acIdx >= 0 && its[S.acIdx]) { gInput.value = its[S.acIdx].textContent; acEl.style.display = 'none'; S.acIdx = -1; }
        else submitG();
    }
});

subBtn.addEventListener('click', submitG);
document.addEventListener('click', e => { if (!e.target.closest('#input-section')) acEl.style.display = 'none'; });

boot();