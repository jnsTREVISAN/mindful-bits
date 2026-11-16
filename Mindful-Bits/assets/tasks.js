/* Mindful Bits — JavaScript para uso direto no navegador. */
window.MindfulTasks = (() => {
'use strict';
const { readStore, writeStore, notify, escapeHTML, icon, localDate } = window.MindfulShared;
const TASK_KEY = 'mindful.tasks.v1';
const SUBJECT_KEY = 'mindful.subjects.v1';
const COLORS = ['sage', 'peach', 'lavender', 'blue', 'yellow'];
const dateFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day, 12);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

function addDays(date, days) {
  const [year, month, day] = date.split('-').map(Number);
  return localDate(new Date(year, month - 1, day + days, 12));
}

function sortTasks(items) {
  return [...items].sort((a, b) => {
    const dateOrder = (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
    return dateOrder || (a.createdAt || '').localeCompare(b.createdAt || '') || a.id.localeCompare(b.id);
  });
}

function filterTasks(items, filters = {}, today = localDate()) {
  const { status = 'pending', subjectId = '', period = 'all', date = '' } = filters;
  return sortTasks(items.filter(task => {
    if (status === 'pending' && task.completed) return false;
    if (status === 'done' && !task.completed) return false;
    if (subjectId && task.subjectId !== subjectId) return false;
    if (period === 'today') return task.dueDate === today;
    if (period === 'next7') return !!task.dueDate && task.dueDate >= today && task.dueDate <= addDays(today, 6);
    if (period === 'overdue') return !!task.dueDate && task.dueDate < today && !task.completed;
    if (period === 'undated') return !task.dueDate;
    if (period === 'custom') return !!date && task.dueDate === date;
    return true;
  }));
}

function dueLabel(value, today = localDate()) {
  if (!value) return 'Sem prazo';
  if (value === today) return 'Hoje';
  if (value === addDays(today, 1)) return 'Amanhã';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return `${dateFormat.format(date).replace('.', '')}${value.slice(0, 4) !== today.slice(0, 4) ? ` ${year}` : ''}`;
}

function loadTasks() {
  const raw = readStore(TASK_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(task => task && typeof task.id === 'string' && typeof task.title === 'string')
    .map(task => ({
      id: task.id, title: task.title.slice(0, 180),
      subjectId: typeof task.subjectId === 'string' ? task.subjectId : '',
      dueDate: validDate(task.dueDate) ? task.dueDate : '', completed: task.completed === true,
      createdAt: typeof task.createdAt === 'string' ? task.createdAt : '',
    }));
}

function loadSubjects() {
  const raw = readStore(SUBJECT_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(subject => subject && typeof subject.id === 'string' && typeof subject.name === 'string')
    .map(subject => ({ id: subject.id, name: subject.name.slice(0, 60), color: COLORS.includes(subject.color) ? subject.color : 'sage' }));
}

const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function initTasks() {
  const app = document.getElementById('tasks-app');
  if (!app) return;
  let tasks = loadTasks();
  let subjects = loadSubjects();
  const route = new URL(window.location.href);
  const requestedSubject = route.searchParams.get('disciplina');
  const initialSubject = subjects.some(subject => subject.id === requestedSubject) ? requestedSubject : '';
  let filters = { status: 'pending', subjectId: initialSubject, period: 'all', date: '' };
  let editingId = null;
  let returnSubjectToTask = false;
  let lastDate = localDate();

  const subjectOptions = selected => subjects.map(subject => `<option value="${escapeHTML(subject.id)}"${selected === subject.id ? ' selected' : ''}>${escapeHTML(subject.name)}</option>`).join('');

  const dialogs = document.createElement('div');
  dialogs.innerHTML = `
    <dialog id="task-dialog" class="modal task-modal" aria-labelledby="task-dialog-title">
      <form id="task-form" class="modal-form">
        <div class="modal-heading"><div><span class="eyebrow">ORGANIZAÇÃO</span><h2 id="task-dialog-title">Nova tarefa</h2></div><button type="button" class="icon-button" data-close-task aria-label="Fechar">${icon('x')}</button></div>
        <label class="field-label" for="task-title">Título <span class="required-label">obrigatório</span></label>
        <input id="task-title" name="title" type="text" placeholder="Ex.: revisar o capítulo 3" required maxlength="180" autocomplete="off">
        <div class="form-row"><div class="form-field"><div class="label-row"><label class="field-label" for="task-subject">Disciplina</label><button class="text-button" id="inline-add-subject" type="button">${icon('plus', 14)} Criar</button></div><select id="task-subject" name="subjectId"><option value="">Sem disciplina</option></select></div><div class="form-field"><label class="field-label" for="task-date">Prazo</label><input id="task-date" name="dueDate" type="date" min="1900-01-01" max="9999-12-31"></div></div>
        <p class="form-hint">Disciplina e prazo são opcionais.</p>
        <div class="modal-actions"><button type="button" class="button button-secondary" data-close-task>Cancelar</button><button type="submit" class="button button-primary" id="task-save">Adicionar tarefa</button></div>
      </form>
    </dialog>
    <dialog id="subject-dialog" class="modal subject-modal" aria-labelledby="subject-dialog-title">
      <form id="subject-form" class="modal-form">
        <div class="modal-heading"><div><span class="eyebrow">DISCIPLINAS</span><h2 id="subject-dialog-title">Nova disciplina</h2></div><button type="button" class="icon-button" data-close-subject aria-label="Fechar">${icon('x')}</button></div>
        <label class="field-label" for="subject-name">Nome da disciplina</label><input id="subject-name" name="name" type="text" placeholder="Ex.: Matemática" required maxlength="60" autocomplete="off">
        <p id="subject-error" class="form-error" role="alert" hidden></p>
        <div class="modal-actions"><button type="button" class="button button-secondary" data-close-subject>Cancelar</button><button type="submit" class="button button-primary">Criar disciplina</button></div>
      </form>
    </dialog>`;
  document.body.append(dialogs);
  const taskDialog = document.getElementById('task-dialog');
  const subjectDialog = document.getElementById('subject-dialog');
  const taskForm = document.getElementById('task-form');
  const subjectForm = document.getElementById('subject-form');

  function announceData() {
    document.dispatchEvent(new CustomEvent('mindful:data', { detail: { tasks, subjects } }));
  }

  function saveTasks() {
    writeStore(TASK_KEY, tasks);
    render();
    announceData();
  }

  function focusRemaining(selector, index) {
    const controls = [...app.querySelectorAll(selector)];
    const target = controls[Math.min(index, controls.length - 1)] || app.querySelector('.task-tab.active');
    target?.focus();
  }

  function render() {
    const today = localDate();
    const results = filterTasks(tasks, filters, today);
    const pending = tasks.filter(task => !task.completed).length;
    const counts = { 'pending-count': pending, 'today-count': tasks.filter(task => !task.completed && task.dueDate === today).length, 'done-count': tasks.length - pending };
    for (const [id, count] of Object.entries(counts)) {
      const target = document.getElementById(id);
      if (target) target.textContent = String(count).padStart(2, '0');
    }
    const activeFilter = filters.subjectId || filters.period !== 'all';
    app.innerHTML = `
      <div class="task-toolbar">
        <div class="task-tabs" role="group" aria-label="Situação das tarefas">
          ${[['pending', 'Pendentes', pending], ['done', 'Concluídas', tasks.length - pending], ['all', 'Todas', tasks.length]].map(([value, label, count]) => `<button type="button" class="task-tab${filters.status === value ? ' active' : ''}" data-status="${value}" aria-pressed="${filters.status === value}">${label}<span class="tab-count">${count}</span></button>`).join('')}
        </div>
        <span class="task-total">${results.length} ${results.length === 1 ? 'tarefa' : 'tarefas'}</span>
      </div>
      <div class="task-filters">
        <label class="filter-select">${icon('book', 17)}<span class="sr-only">Filtrar por disciplina</span><select id="filter-subject" aria-label="Filtrar por disciplina"><option value="">Todas as disciplinas</option>${subjectOptions(filters.subjectId)}</select>${icon('chevronDown', 15)}</label>
        <label class="filter-select">${icon('calendar', 17)}<span class="sr-only">Filtrar por prazo</span><select id="filter-period" aria-label="Filtrar por prazo">${[['all', 'Todos os prazos'], ['today', 'Hoje'], ['next7', 'Próximos 7 dias'], ['overdue', 'Atrasadas'], ['undated', 'Sem prazo'], ['custom', 'Escolher data']].map(([value, label]) => `<option value="${value}"${filters.period === value ? ' selected' : ''}>${label}</option>`).join('')}</select>${icon('chevronDown', 15)}</label>
        ${filters.period === 'custom' ? `<label class="custom-date-label"><span class="sr-only">Data do prazo</span><input id="filter-date" type="date" aria-label="Data do prazo" value="${escapeHTML(filters.date)}" min="1900-01-01" max="9999-12-31"></label>` : ''}
        ${activeFilter ? '<button type="button" class="text-button clear-filters" data-clear-filters>Limpar filtros</button>' : `<span class="sort-label">${icon('filter', 14)} Por prazo</span>`}
      </div>
      ${results.length ? `<div class="task-list" aria-label="Lista de tarefas">${results.map(task => taskHTML(task, today)).join('')}</div>` : emptyHTML(activeFilter)}
      <div class="task-list-footer"><span>${icon('check', 14)} ${tasks.length - pending} ${tasks.length - pending === 1 ? 'tarefa concluída' : 'tarefas concluídas'}</span><span>Organizadas por prazo</span></div>`;
  }

  function taskHTML(task, today) {
    const subject = subjects.find(item => item.id === task.subjectId);
    const overdue = task.dueDate && task.dueDate < today && !task.completed;
    return `<article class="task-row${task.completed ? ' is-completed' : ''}">
      <label class="task-checkbox"><input type="checkbox" data-complete="${escapeHTML(task.id)}"${task.completed ? ' checked' : ''} aria-label="${task.completed ? 'Reabrir' : 'Concluir'} tarefa: ${escapeHTML(task.title)}"><span aria-hidden="true">${icon('check', 14)}</span></label>
      <div class="task-main"><span class="task-title">${escapeHTML(task.title)}</span><span class="task-subject${subject ? ` color-${subject.color}` : ''}">${subject ? `<span class="subject-dot"></span>${escapeHTML(subject.name)}` : 'Sem disciplina'}</span></div>
      <span class="task-date${overdue ? ' is-overdue' : task.dueDate === today ? ' is-today' : ''}"${overdue ? ' title="Prazo ultrapassado"' : ''}>${icon('calendar', 14)}${dueLabel(task.dueDate, today)}${overdue ? '<span class="sr-only">, prazo ultrapassado</span>' : ''}</span>
      <div class="task-actions"><button type="button" class="icon-button" data-edit="${escapeHTML(task.id)}" aria-label="Editar tarefa: ${escapeHTML(task.title)}" title="Editar">${icon('pencil', 16)}</button><button type="button" class="icon-button" data-delete="${escapeHTML(task.id)}" aria-label="Excluir tarefa: ${escapeHTML(task.title)}" title="Excluir">${icon('trash', 16)}</button></div>
    </article>`;
  }

  function emptyHTML(activeFilter) {
    const initial = tasks.length === 0 && !activeFilter && filters.status !== 'done';
    const title = initial ? 'Suas tarefas aparecem aqui' : filters.status === 'done' && !activeFilter ? 'Nenhuma tarefa concluída' : 'Nenhuma tarefa encontrada';
    const text = initial ? 'Adicione uma tarefa e organize por disciplina e prazo.' : filters.status === 'done' && !activeFilter ? 'As tarefas que você concluir serão exibidas nesta lista.' : 'Não há tarefas para os filtros selecionados.';
    return `<div class="task-empty"><img src="assets/empty-garden.svg" alt="" class="empty-illustration" width="218" height="166"><h3>${title}</h3><p>${text}</p>${initial ? `<button type="button" class="button button-secondary" data-new-task>${icon('plus', 17)} Adicionar tarefa</button>` : `<button type="button" class="text-button" ${activeFilter || filters.status === 'done' ? 'data-reset-filters' : 'data-new-task'}>${activeFilter || filters.status === 'done' ? 'Ver tarefas pendentes' : 'Adicionar tarefa'} ${icon('arrowRight', 15)}</button>`}</div>`;
  }

  function openTask(id = null) {
    const task = tasks.find(item => item.id === id);
    editingId = task ? task.id : null;
    taskForm.reset();
    document.getElementById('task-dialog-title').textContent = task ? 'Editar tarefa' : 'Nova tarefa';
    document.getElementById('task-save').textContent = task ? 'Salvar alterações' : 'Adicionar tarefa';
    document.getElementById('task-title').value = task?.title || '';
    document.getElementById('task-title').setCustomValidity('');
    document.getElementById('task-subject').innerHTML = '<option value="">Sem disciplina</option>' + subjectOptions(task?.subjectId || filters.subjectId);
    document.getElementById('task-date').value = task?.dueDate || '';
    taskDialog.showModal();
    document.getElementById('task-title').focus();
  }

  function openSubject(fromTask = false) {
    returnSubjectToTask = fromTask;
    subjectForm.reset();
    const error = document.getElementById('subject-error');
    error.hidden = true;
    document.getElementById('subject-name').setCustomValidity('');
    subjectDialog.showModal();
    document.getElementById('subject-name').focus();
  }

  document.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('#new-task, [data-new-task]')) openTask();
    if (event.target.closest('#add-subject')) openSubject(false);
  });
  document.getElementById('inline-add-subject').addEventListener('click', () => openSubject(true));
  dialogs.querySelectorAll('[data-close-task]').forEach(button => button.addEventListener('click', () => taskDialog.close()));
  dialogs.querySelectorAll('[data-close-subject]').forEach(button => button.addEventListener('click', () => subjectDialog.close()));
  for (const dialog of [taskDialog, subjectDialog]) {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
  }

  taskForm.addEventListener('submit', event => {
    event.preventDefault();
    const titleInput = document.getElementById('task-title');
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.setCustomValidity('Informe o título da tarefa.');
      titleInput.reportValidity();
      return;
    }
    const dueDate = document.getElementById('task-date').value;
    if (dueDate && !validDate(dueDate)) return;
    const subjectId = document.getElementById('task-subject').value;
    const existing = tasks.find(task => task.id === editingId);
    const savedId = existing?.id || uid();
    if (existing) Object.assign(existing, { title, subjectId, dueDate });
    else tasks.push({ id: savedId, title, subjectId, dueDate, completed: false, createdAt: new Date().toISOString() });
    saveTasks();
    taskDialog.close();
    const savedTaskControl = [...app.querySelectorAll('[data-edit]')].find(button => button.dataset.edit === savedId);
    (savedTaskControl || app.querySelector('.task-tab.active') || document.getElementById('new-task'))?.focus();
    notify(existing ? 'Tarefa atualizada.' : 'Tarefa adicionada.');
  });
  document.getElementById('task-title').addEventListener('input', event => event.target.setCustomValidity(''));

  subjectForm.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('subject-name');
    const name = input.value.trim();
    if (!name) { input.setCustomValidity('Informe o nome da disciplina.'); input.reportValidity(); return; }
    if (subjects.some(subject => subject.name.localeCompare(name, 'pt-BR', { sensitivity: 'base' }) === 0)) {
      const error = document.getElementById('subject-error');
      error.textContent = 'Já existe uma disciplina com esse nome.';
      error.hidden = false;
      input.focus();
      return;
    }
    const subject = { id: uid(), name, color: COLORS[subjects.length % COLORS.length] };
    subjects.push(subject);
    writeStore(SUBJECT_KEY, subjects);
    if (returnSubjectToTask) document.getElementById('task-subject').innerHTML = '<option value="">Sem disciplina</option>' + subjectOptions(subject.id);
    render();
    announceData();
    subjectDialog.close();
    const subjectFocusTarget = returnSubjectToTask && taskDialog.open ? document.getElementById('task-subject') : document.getElementById('add-subject');
    (subjectFocusTarget || app.querySelector('.task-tab.active') || document.getElementById('new-task'))?.focus();
    notify('Disciplina criada.');
  });
  document.getElementById('subject-name').addEventListener('input', event => { event.target.setCustomValidity(''); document.getElementById('subject-error').hidden = true; });

  app.addEventListener('click', event => {
    if (!(event.target instanceof Element)) return;
    const status = event.target.closest('[data-status]');
    if (status) { filters.status = status.dataset.status; render(); app.querySelector(`[data-status="${filters.status}"]`)?.focus(); return; }
    const edit = event.target.closest('[data-edit]');
    if (edit) { openTask(edit.dataset.edit); return; }
    const remove = event.target.closest('[data-delete]');
    if (remove) {
      const controlIndex = [...app.querySelectorAll('[data-delete]')].indexOf(remove);
      const deleted = tasks.find(task => task.id === remove.dataset.delete);
      if (!deleted) return;
      tasks = tasks.filter(task => task.id !== deleted.id);
      saveTasks();
      focusRemaining('[data-delete]', controlIndex);
      notify('Tarefa excluída.', 'Desfazer', () => {
        if (!tasks.some(task => task.id === deleted.id)) { tasks.push(deleted); saveTasks(); notify('Tarefa restaurada.'); }
      });
      return;
    }
    if (event.target.closest('[data-clear-filters], [data-reset-filters]')) {
      filters = { ...filters, subjectId: '', period: 'all', date: '' };
      if (event.target.closest('[data-reset-filters]')) filters.status = 'pending';
      render();
      app.querySelector('#filter-subject')?.focus();
    }
  });

  app.addEventListener('change', event => {
    const input = event.target;
    if (!(input instanceof Element)) return;
    if (input.matches('[data-complete]')) {
      const controlIndex = [...app.querySelectorAll('[data-complete]')].indexOf(input);
      const task = tasks.find(item => item.id === input.dataset.complete);
      if (task) { task.completed = input.checked; saveTasks(); focusRemaining('[data-complete]', controlIndex); notify(task.completed ? 'Tarefa concluída.' : 'Tarefa reaberta.'); }
      return;
    }
    if (input.id === 'filter-subject') filters.subjectId = input.value;
    else if (input.id === 'filter-period') { filters.period = input.value; if (input.value === 'custom' && !filters.date) filters.date = localDate(); }
    else if (input.id === 'filter-date') filters.date = input.value;
    else return;
    const focusId = input.id === 'filter-period' && input.value === 'custom' ? 'filter-date' : input.id;
    render();
    document.getElementById(focusId)?.focus();
  });

  document.addEventListener('mindful:filter-subject', event => {
    filters.subjectId = event.detail?.subjectId || '';
    filters.status = 'pending';
    render();
  });
  window.addEventListener('storage', event => {
    if (event.key === TASK_KEY || event.key === SUBJECT_KEY || event.key === null) {
      tasks = loadTasks(); subjects = loadSubjects();
      if (!subjects.some(subject => subject.id === filters.subjectId)) filters.subjectId = '';
      render(); announceData();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && lastDate !== localDate()) { lastDate = localDate(); render(); }
  });
  // Re-evaluate relative dates across midnight without disturbing a running form.
  window.setInterval(() => { if (lastDate !== localDate()) { lastDate = localDate(); render(); } }, 60000);
  render();
  announceData();
  if (route.searchParams.get('adicionar-disciplina') === '1') {
    route.searchParams.delete('adicionar-disciplina');
    try { window.history.replaceState(window.history.state, '', route.href); } catch { /* O formulário também funciona sem alterar o histórico local. */ }
    openSubject(false);
  }
}

return { validDate, addDays, sortTasks, filterTasks, dueLabel, initTasks };
})();
