// js/game.js
// Game flow: boot → startGame → submitG → endGame

async function boot() {
  loadEl.style.display = 'block';

  try {
    const data = await loadBirdsJson();
    if (data.date === todayStr() && data.name) {
      S.bird = BIRDS.find(b => b[0] === data.name) || BIRDS[dailyBirdIdx()];
      S.rec  = data.recording || null;
      loadEl.style.display = 'none';
      startGame();
      return;
    }
    throw new Error('birds.json is stale');
  } catch(err) {
    loadEl.style.display = 'none';
    toast('Could not load today\'s bird — try refreshing.', 6000);
    console.error('boot failed:', err);
  }
}

function startGame() {
  imgEl.src = S.bird[3];
  imgEl.style.filter = ''; imgEl.style.transform = '';
  setBlur();
  previewWrap.style.display = 'block';
  audioSec.style.display    = 'flex';
  guessSec.style.display    = 'flex';
  inputSec.style.display    = 'block';
  playBtn.disabled = !audioUrl(); playBtn.textContent = '▶'; playBtn.classList.remove('playing');
  gInput.disabled  = false; subBtn.disabled = false; gInput.value = '';
  resPanel.classList.remove('show'); resPanel.style.display = '';
  acEl.style.display = 'none';
  renderG(); renderP();
}

function submitG() {
  if (S.over) return;
  const val = gInput.value.trim();
  if (!val) return;

  const match = BIRDS.find(b => b[0].toLowerCase() === val.toLowerCase());
  if (!match) { shake(); toast('Not in the seabird list'); return; }
  if (S.guesses.find(g => g.name.toLowerCase() === match[0].toLowerCase())) {
    shake(); toast('Already guessed!'); return;
  }

  const ok = match[0].toLowerCase() === S.bird[0].toLowerCase();
  S.guesses.push({ name: match[0], ok });
  gInput.value = ''; acEl.style.display = 'none';
  renderG(); setBlur();

  if (ok) { endGame(true); return; }
  if (S.guesses.length >= MAX_G) { endGame(false); return; }

  if (S.guesses.length === 2) toast(`Hint: genus is ${S.bird[1]}`, 3500);
  if (S.guesses.length === 4 && S.rec) toast(`Hint: recorded in ${S.rec.cnt || 'unknown'}`, 3500);
}

function endGame(won) {
  S.over = true;
  gInput.disabled = true; subBtn.disabled = true; setBlur();
  const b = S.bird, r = S.rec;

  resPanel.innerHTML = `
    <div id="res-title">${won ? 'Correct!' : 'Better luck next time'}</div>
    <div id="res-sub">${won
      ? `Found in ${S.guesses.length} guess${S.guesses.length === 1 ? '' : 'es'}`
      : 'The answer was…'}</div>
    <div id="res-name">${won ? '🐦' : '💀'} ${esc(b[0])}</div>
    <div id="res-latin"><em>${esc(b[1])} ${esc(b[2])}</em></div>
    <img id="res-img" src="${b[3]}" alt="${esc(b[0])}" onerror="this.style.display='none'" />
    <p id="res-fact">${esc(b[4])}</p>
    ${r ? `<p id="res-credit">Recording by ${esc(r.rec)} · xeno-canto XC${esc(r.id)} · ${esc(r.lic || 'CC')}</p>` : ''}
  `;
  resPanel.classList.add('show');
}

boot();