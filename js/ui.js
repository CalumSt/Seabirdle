// js/ui.js

// DOM helpers, rendering and UI event wiring
const $ = id => document.getElementById(id);
const setupPanel = $('setup-panel'), loadEl = $('loading-state');
const previewWrap = $('bird-preview-wrap'), imgEl = $('bird-preview');
const blurLbl = $('blur-label'), progFill = $('prog-fill');
const audioSec = $('audio-section'), playBtn = $('play-btn'), dotEl = $('plays-dots');
const guessSec = $('guesses-section'), inputSec = $('input-section');
const gInput = $('guess-input'), subBtn = $('submit-btn'), acEl = $('autocomplete');
const resPanel = $('result-panel');

// show date and save-key button wiring
$('date-badge').textContent = todayStr();
$('save-key-btn').addEventListener('click', () => {
  const k = $('api-key-input').value.trim();
  if (!k) { toast('Enter a key first'); return; }
  saveKey(k); setupPanel.classList.remove('show'); boot();
});

// Blur/progress UI
function setBlur() {
  const n = Math.min(S.guesses.length, BLUR_SEQ.length-1);
  const px = S.over ? 0 : BLUR_SEQ[n];
  imgEl.style.setProperty('--blur', px+'px');
  if (px === 0) {
    imgEl.style.filter='blur(0px) brightness(1)';
    imgEl.style.transform='scale(1)';
  }
  progFill.style.width = (S.guesses.length/MAX_G*100)+'%';
  blurLbl.textContent  = S.over ? '' : `${MAX_G-S.guesses.length} guess${MAX_G-S.guesses.length===1?'':'es'} remaining`;
}

// Audio play handling
playBtn.addEventListener('click', () => {
  if (S.plays<=0||S.over||!audioUrl()) return;
  if (aud && !aud.paused) { aud.pause(); aud.currentTime=0; playBtn.textContent='▶'; playBtn.classList.remove('playing'); return; }
  if (!aud) {
    aud = new Audio(audioUrl());
    aud.crossOrigin='anonymous';
    aud.addEventListener('ended', ()=>{ playBtn.textContent='▶'; playBtn.classList.remove('playing'); });
    aud.addEventListener('error', ()=>toast('Audio load failed — check CORS or key'));
  } else { aud.src=audioUrl(); aud.currentTime=0; }
  S.plays--; renderP();
  playBtn.textContent='⏹'; playBtn.classList.add('playing');
  aud.play().catch(()=>toast('Autoplay blocked — click again'));
  if (S.plays===0) setTimeout(()=>{ playBtn.disabled=true; },200);
});
function renderP() { dotEl.textContent='●'.repeat(S.plays)+'○'.repeat(MAX_P-S.plays); }

// Render guesses grid
function renderG() {
  guessSec.innerHTML='';
  for (let i=0;i<MAX_G;i++) {
    const r=document.createElement('div');
    r.className='guess-row'+(i>=S.guesses.length?' empty':'');
    if(i<S.guesses.length){
      const g=S.guesses[i]; r.classList.add(g.ok?'correct':'wrong');
      r.innerHTML=`<span class="gn">${i+1}</span><span class="gt">${esc(g.name)}</span><span class="gi">${g.ok?'✓':'✗'}</span>`;
    } else {
      r.innerHTML=`<span class="gn">${i+1}</span><span class="gt"></span>`;
    }
    guessSec.appendChild(r);
  }
}

// Autocomplete + input wiring
gInput.addEventListener('input', () => {
  const v=gInput.value.trim().toLowerCase(); S.acIdx=-1;
  if(!v){acEl.style.display='none';return;}
  const hits=ALL_NAMES.filter(n=>n.toLowerCase().includes(v));
  if(!hits.length){acEl.style.display='none';return;}
  acEl.innerHTML='';
  hits.slice(0,8).forEach((name,i)=>{
    const el=document.createElement('div'); el.className='ac-item'; el.dataset.i=i;
    const lo=name.toLowerCase(),mi=lo.indexOf(v);
    el.innerHTML=esc(name.slice(0,mi))+`<span class="ac-m">${esc(name.slice(mi,mi+v.length))}</span>`+esc(name.slice(mi+v.length));
    el.addEventListener('mousedown',e=>{ e.preventDefault(); gInput.value=name; acEl.style.display='none'; });
    acEl.appendChild(el);
  });
  acEl.style.display='block';
});
gInput.addEventListener('keydown', e => {
  const its=[...acEl.querySelectorAll('.ac-item')];
  if(e.key==='ArrowDown'){e.preventDefault();S.acIdx=Math.min(S.acIdx+1,its.length-1);hiAC(its);}
  else if(e.key==='ArrowUp'){e.preventDefault();S.acIdx=Math.max(S.acIdx-1,-1);hiAC(its);}
  else if(e.key==='Enter'){
    if(S.acIdx>=0&&its[S.acIdx]){gInput.value=its[S.acIdx].textContent;acEl.style.display='none';S.acIdx=-1;}
    else submitG();
  } else if(e.key==='Escape') acEl.style.display='none';
});
document.addEventListener('click',e=>{ if(!e.target.closest('#input-section')) acEl.style.display='none'; });
function hiAC(its){ its.forEach((el,i)=>el.classList.toggle('sel',i===S.acIdx)); if(S.acIdx>=0) gInput.value=its[S.acIdx].textContent; }
subBtn.addEventListener('click', submitG);
