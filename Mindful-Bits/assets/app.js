/* Inicialização compartilhada das três páginas. */
(async () => {
'use strict';
await window.MindfulStore.ready;
const {readStore, escapeHTML, icon, showStorageWarning, navigate}=window.MindfulShared;
const {initTimer}=window.MindfulTimer;
const current = document.body.dataset.page;
const navItems=[['tasks','index.html','tasks','Tarefas'],['pomodoro','pomodoro.html','timer','Pomodoro'],['breathing','respiracao.html','flower','Respiração']];
document.querySelector('#sidebar').innerHTML=`
  <a class="brand" href="index.html" aria-label="Mindful Bits, página de tarefas"><img src="assets/favicon.svg" alt="" width="38" height="38"><span>Mindful Bits<span class="brand-caption">ORGANIZAÇÃO & FOCO</span></span></a>
  <span class="nav-caption">MEU ESPAÇO</span>
  <nav class="main-nav">${navItems.map(([page,url,name,title])=>`<a href="${url}" class="nav-item ${current===page?'active':''}" ${current===page?'aria-current="page"':''}>${icon(name)}<span>${title}</span>${current===page?'<span class="active-dot"></span>':''}</a>`).join('')}</nav>
  <div class="sidebar-subjects-section"><div class="subjects-heading"><span>DISCIPLINAS</span><button type="button" class="icon-button" id="add-subject" aria-label="Adicionar disciplina">${icon('plus',17)}</button></div><div id="sidebar-subjects"></div></div>
  <div class="sidebar-bottom"><img src="assets/empty-garden.svg" width="200" height="133" alt=""><span class="sidebar-bottom-line"></span><p>${icon('lock',14)} Dados neste navegador</p></div>`;
document.querySelector('#topbar').innerHTML=`<div class="breadcrumb"><span>Meu espaço</span><span class="breadcrumb-slash">/</span><span>${navItems.find(item=>item[0]===current)?.[3] || 'Tarefas'}</span></div><div class="topbar-right"><div id="mini-timer"></div><span class="today-label">${icon('calendar',16)}<span id="today-label"></span></span><span class="profile-mark" aria-hidden="true">${icon('leaf',20)}</span></div>`;
const format = new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'long'});
document.querySelector('#today-label').textContent=format.format(new Date());
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon,el.classList.contains('heading-doodle')?50:20));
function renderSubjects(){
 const raw=readStore('mindful.subjects.v1',[]);
 const subjects=Array.isArray(raw)?raw.filter(s=>s&&typeof s.id==='string'&&typeof s.name==='string'):[];
 const colors=['sage','peach','lavender','blue','yellow'];
 document.querySelector('#sidebar-subjects').innerHTML=Array.isArray(subjects)&&subjects.length ? subjects.map(s=>`<a class="sidebar-subject" href="index.html?disciplina=${encodeURIComponent(s.id)}" data-subject="${escapeHTML(s.id)}"><span class="subject-dot ${colors.includes(s.color)?s.color:'sage'}"></span><span>${escapeHTML(s.name)}</span></a>`).join('') : '<p class="no-subjects">Adicione suas disciplinas<br>para organizar as tarefas.</p>';
 document.querySelectorAll('.sidebar-subject').forEach(el=>el.addEventListener('click',e=>{if(current==='tasks'){e.preventDefault();document.dispatchEvent(new CustomEvent('mindful:filter-subject',{detail:{subjectId:el.dataset.subject}}));document.querySelector('#tasks-app')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}}));
}
renderSubjects(); document.addEventListener('mindful:data',renderSubjects); window.addEventListener('storage',renderSubjects);
initTimer();
if(current==='tasks') { const {initTasks}=window.MindfulTasks; initTasks(); }
else { document.querySelector('#add-subject').addEventListener('click',()=>{navigate('index.html?adicionar-disciplina=1');}); }
if(current==='breathing') { const {initBreathing}=window.MindfulBreathing; initBreathing(); }
showStorageWarning();

// Aguarda a gravação antes de mudar de página, inclusive ao abrir arquivos locais.
document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest('a[href]');
  if (!link || link.target || link.hasAttribute('download') || link.getAttribute('href').startsWith('#')) return;
  const destination = new URL(link.href, window.location.href);
  const base = new URL('.', window.location.href);
  const file = destination.pathname.slice(base.pathname.length);
  if (destination.protocol !== base.protocol || destination.host !== base.host || !destination.pathname.startsWith(base.pathname) || !['index.html','pomodoro.html','respiracao.html'].includes(file)) return;
  event.preventDefault();
  navigate(destination.href);
});
document.dispatchEvent(new CustomEvent('mindful:ready'));
})().catch(() => {
  const warning = document.getElementById('storage-warning');
  if (warning) { warning.hidden = false; warning.textContent = 'Não foi possível iniciar o site. Extraia todos os arquivos do ZIP e abra index.html novamente.'; }
});
