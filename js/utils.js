// js/utils.js

// Utilities used across modules
const todayStr = () => new Date().toISOString().slice(0,10);
function hash(s) { let h=0; for(let i=0;i<s.length;i++) h=(Math.imul(31,h)+s.charCodeAt(i))|0; return Math.abs(h); }
function esc(s){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
const toastEl = document.getElementById('toast'); let _tid;
function toast(msg,ms=2400){ if(!toastEl) return; toastEl.textContent=msg; toastEl.classList.add('show'); clearTimeout(_tid); _tid=setTimeout(()=>toastEl.classList.remove('show'),ms); }
function shake(){ const gi=document.getElementById('guess-input'); if(!gi) return; gi.classList.remove('shake'); void gi.offsetWidth; gi.classList.add('shake'); }
