/* Mindful Bits — JavaScript para uso direto no navegador. */
window.MindfulShared = (() => {
'use strict';
const memory = new Map();
let storageFailure = false;
function readStore(key, fallback) {
  try { return window.MindfulStore.read(key, fallback); }
  catch { storageFailure = true; showStorageWarning(); return memory.get(key) ?? fallback; }
}
function writeStore(key, value) {
  memory.set(key, value);
  const saved = window.MindfulStore.write(key, value);
  if (!saved) { storageFailure = true; showStorageWarning(); }
  return saved;
}
function showStorageWarning() {
  if (!storageFailure && !window.MindfulStore.hasFailure()) return;
  const warning = document.getElementById('storage-warning');
  if (warning) { warning.hidden = false; warning.textContent = 'Este navegador não permitiu salvar ou compartilhar os dados entre páginas. As alterações podem ser perdidas ao sair.'; }
}
async function navigate(url) {
  await window.MindfulStore.flush();
  window.location.href = url;
}
document.addEventListener('mindful:storage-error', () => { storageFailure = true; showStorageWarning(); });
function escapeHTML(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function localDate(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
let toastTimeout;
function notify(message, actionLabel, callback) {
  if (typeof document === 'undefined') return;
  let toast = document.querySelector('#toast');
  if (!toast) { toast = document.createElement('div'); toast.id='toast'; toast.className='toast'; toast.setAttribute('role','status'); document.body.append(toast); }
  clearTimeout(toastTimeout);
  toast.replaceChildren(); const label=document.createElement('span'); label.textContent=message; toast.append(label);
  if (actionLabel && callback) { const button=document.createElement('button'); button.textContent=actionLabel; button.type='button'; button.addEventListener('click',()=>{callback();toast.hidden=true;}); toast.append(button); }
  toast.hidden=false; toastTimeout=setTimeout(()=>{toast.hidden=true;},actionLabel?10000:5000);
}
const paths = {
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  x:'<path d="m6 6 12 12M6 18 18 6"/>',
  pencil:'<path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5"/>',
  trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  chevronDown:'<path d="m6 9 6 6 6-6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  filter:'<path d="M4 7h16M7 12h10M10 17h4"/>',
  book:'<path d="M12 6c-3-3-7-2-9-1v15c3-2 6-2 9 0 3-2 6-2 9 0V5c-2-1-6-2-9 1v14Z"/>',
  arrowRight:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  leaf:'<path d="M20 4C10 1 2 8 6 16s16 1 14-12ZM4 21 16 9M9 16v-5m0 5h5"/>',
  tasks:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 9 1 1 2-2M14 9h3m-9 6 1 1 2-2m3 1h3"/>',
  timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6M12 2v3m6 1 2-2"/>',
  flower:'<path d="M12 7c-7-11-14 2-5 5-11 7 2 14 5 5 7 11 14-2 5-5 11-7-2-14-5-5Z"/><circle cx="12" cy="12" r="2"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  play:'<path d="m9 5 11 7-11 7V5Z"/>',
  pause:'<path d="M8 5v14M16 5v14"/>',
  stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',
  reset:'<path d="M3 10a9 9 0 1 1 1 7M3 3v7h7"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
  circle:'<circle cx="12" cy="12" r="9"/>',
};
function icon(name, size = 20) { return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.leaf}</svg>`; }

return { readStore, writeStore, showStorageWarning, escapeHTML, localDate, notify, icon, navigate };
})();
