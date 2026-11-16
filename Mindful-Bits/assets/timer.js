/* Mindful Bits — JavaScript para uso direto no navegador. */
window.MindfulTimer = (() => {
'use strict';
const { readStore, writeStore, notify, icon } = window.MindfulShared;
const TIMER_KEY = 'mindful.timer.v1';
const MINUTE = 60_000;
const MODES = ['study', 'pause'];
const STATUSES = ['idle', 'running', 'paused', 'complete'];

function createTimerState(studyMinutes = 25, pauseMinutes = 5) {
  return {
    studyMinutes, pauseMinutes, mode: 'study', status: 'idle',
    remainingMs: studyMinutes * MINUTE, durationMs: studyMinutes * MINUTE, endsAt: null,
  };
}

function validMinutes(value, max) {
  return Number.isInteger(value) && value >= 1 && value <= max;
}

function normalizeTimerState(value, now = Date.now()) {
  if (!value || typeof value !== 'object') return createTimerState();
  const studyMinutes = validMinutes(value.studyMinutes, 180) ? value.studyMinutes : 25;
  const pauseMinutes = validMinutes(value.pauseMinutes, 60) ? value.pauseMinutes : 5;
  const mode = MODES.includes(value.mode) ? value.mode : 'study';
  const status = STATUSES.includes(value.status) ? value.status : 'idle';
  const configuredMs = (mode === 'study' ? studyMinutes : pauseMinutes) * MINUTE;
  const durationMs = Number.isFinite(value.durationMs) && value.durationMs > 0 && value.durationMs <= 180 * MINUTE
    ? value.durationMs : configuredMs;
  const remainingMs = Number.isFinite(value.remainingMs)
    ? Math.max(0, Math.min(value.remainingMs, durationMs)) : durationMs;
  const state = { studyMinutes, pauseMinutes, mode, status, durationMs, remainingMs, endsAt: null };
  if (status === 'running') {
    if (!Number.isFinite(value.endsAt)) return resetTimer(state);
    state.endsAt = value.endsAt;
    return advanceTimer(state, now);
  }
  if (status === 'complete') state.remainingMs = 0;
  if (status === 'idle') return resetTimer(state);
  if (status === 'paused' && remainingMs === 0) return { ...state, status: 'complete' };
  return state;
}

function remainingTime(state, now = Date.now()) {
  return state.status === 'running'
    ? Math.max(0, Math.min(state.durationMs, state.endsAt - now))
    : state.remainingMs;
}

function advanceTimer(state, now = Date.now()) {
  if (state.status !== 'running' || state.endsAt > now) return state;
  return { ...state, status: 'complete', remainingMs: 0, endsAt: null };
}

function resetTimer(state, mode = state.mode) {
  const durationMs = (mode === 'study' ? state.studyMinutes : state.pauseMinutes) * MINUTE;
  return { ...state, mode, status: 'idle', durationMs, remainingMs: durationMs, endsAt: null };
}

function toggleTimer(state, now = Date.now()) {
  state = advanceTimer(state, now);
  if (state.status === 'running') {
    return { ...state, status: 'paused', remainingMs: remainingTime(state, now), endsAt: null };
  }
  if (state.status === 'complete') state = resetTimer(state, state.mode === 'study' ? 'pause' : 'study');
  return { ...state, status: 'running', endsAt: now + state.remainingMs };
}

function setTimerDurations(state, studyMinutes, pauseMinutes) {
  if (!validMinutes(studyMinutes, 180) || !validMinutes(pauseMinutes, 60)) {
    throw new RangeError('Informe minutos inteiros: estudo de 1 a 180 e pausa de 1 a 60.');
  }
  const next = { ...state, studyMinutes, pauseMinutes };
  return state.status === 'idle' ? resetTimer(next) : next;
}

function formatTime(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function initTimer() {
  if (typeof document === 'undefined') return;
  const host = document.getElementById('timer-app');
  const mini = document.getElementById('mini-timer');
  if (!host && !mini) return;
  let state = normalizeTimerState(readStore(TIMER_KEY, null));
  let lastCompletion = '';

  if (host) {
    host.innerHTML = `
      <section class="timer-page-panel" aria-label="Timer de estudos">
        <div class="timer-mode-tabs" role="tablist" aria-label="Etapa do pomodoro">
          <button class="timer-mode-tab" id="timer-study" type="button" role="tab" data-mode="study">Estudo</button>
          <button class="timer-mode-tab" id="timer-pause" type="button" role="tab" data-mode="pause">Pausa</button>
        </div>
        <div class="timer-ring-wrap">
          <svg class="timer-ring" viewBox="0 0 280 280" aria-hidden="true">
            <circle class="timer-ring-track" cx="140" cy="140" r="124" fill="none" />
            <circle class="timer-ring-progress" cx="140" cy="140" r="124" fill="none" pathLength="100" stroke-dasharray="100" transform="rotate(-90 140 140)" />
          </svg>
          <div class="timer-face">
            <span class="timer-phase-label">TEMPO DE ESTUDO</span>
            <span class="timer-digits" role="timer" aria-label="Tempo restante">25:00</span>
            <span class="timer-status">Pronto para iniciar</span>
          </div>
        </div>
        <div class="timer-actions">
          <button class="button button-primary timer-primary" type="button">Iniciar</button>
          <button class="icon-button timer-reset" type="button" aria-label="Reiniciar timer" title="Reiniciar timer">${icon('reset')}</button>
        </div>
        <p class="timer-announcement sr-only" role="status" aria-live="polite"></p>
      </section>
      <form class="timer-settings" aria-labelledby="timer-settings-heading">
        <div class="timer-settings-heading"><h2 id="timer-settings-heading">Seu tempo de estudo</h2><span>Em minutos</span></div>
        <div class="timer-settings-grid">
          <label class="field" for="study-minutes"><span>Estudo</span><span class="duration-input"><input id="study-minutes" name="studyMinutes" type="number" min="1" max="180" step="1" required inputmode="numeric" value="${state.studyMinutes}"><span class="field-suffix">min</span></span></label>
          <label class="field" for="pause-minutes"><span>Pausa</span><span class="duration-input"><input id="pause-minutes" name="pauseMinutes" type="number" min="1" max="60" step="1" required inputmode="numeric" value="${state.pauseMinutes}"><span class="field-suffix">min</span></span></label>
        </div>
        <div class="timer-settings-footer"><p class="timer-settings-note">Alterações valem para a próxima etapa ou ao reiniciar.</p><button class="button button-secondary timer-save" type="submit">Salvar tempos</button></div>
      </form>`;
    host.querySelector('.timer-primary').addEventListener('click', () => commit(toggleTimer(state)));
    host.querySelector('.timer-reset').addEventListener('click', () => commit(resetTimer(state)));
    host.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
      if (state.status !== 'running') commit(resetTimer(state, button.dataset.mode));
    }));
    host.querySelector('.timer-mode-tabs').addEventListener('keydown', event => {
      if (state.status === 'running' || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const mode = event.key === 'Home' ? 'study' : event.key === 'End' ? 'pause' : state.mode === 'study' ? 'pause' : 'study';
      commit(resetTimer(state, mode));
      host.querySelector(`[data-mode="${mode}"]`).focus();
    });
    host.querySelector('.timer-settings').addEventListener('submit', event => {
      event.preventDefault();
      const study = Number(host.querySelector('#study-minutes').value);
      const pause = Number(host.querySelector('#pause-minutes').value);
      try {
        commit(setTimerDurations(state, study, pause));
        notify('Tempos atualizados.');
      } catch (error) {
        notify(error.message);
      }
    });
  }
  if (mini) {
    mini.innerHTML = `<a class="mini-timer-link" href="pomodoro.html" aria-label="Abrir pomodoro"><span class="mini-timer-dot" aria-hidden="true"></span><span class="mini-timer-name">Estudo</span><span class="mini-timer-time">25:00</span>${icon('arrowRight', 16)}</a>`;
  }

  function commit(next) {
    state = next;
    writeStore(TIMER_KEY, state);
    render();
  }

  function render() {
    const before = state;
    state = advanceTimer(state);
    if (state !== before) writeStore(TIMER_KEY, state);
    const time = formatTime(remainingTime(state));
    const isStudy = state.mode === 'study';
    const label = isStudy ? 'Estudo' : 'Pausa';
    const status = {
      idle: 'Pronto para iniciar', running: isStudy ? 'Sessão em andamento' : 'Pausa em andamento',
      paused: 'Timer pausado', complete: isStudy ? 'Tempo de estudo concluído' : 'Pausa concluída',
    }[state.status];
    if (host) {
      host.querySelector('.timer-digits').textContent = time;
      host.querySelector('.timer-phase-label').textContent = isStudy ? 'TEMPO DE ESTUDO' : 'TEMPO DE PAUSA';
      host.querySelector('.timer-status').textContent = status;
      host.querySelector('.timer-ring-progress').style.strokeDashoffset = String(100 - remainingTime(state) / state.durationMs * 100);
      host.querySelector('.timer-page-panel').dataset.mode = state.mode;
      host.querySelector('.timer-page-panel').dataset.status = state.status;
      const primary = host.querySelector('.timer-primary');
      const primaryLabel = state.status === 'running' ? 'Pausar' : state.status === 'paused' ? 'Retomar' : state.status === 'complete' ? (isStudy ? 'Iniciar pausa' : 'Iniciar estudo') : 'Iniciar';
      if (primary.dataset.label !== primaryLabel) {
        primary.innerHTML = `${icon(state.status === 'running' ? 'pause' : 'play', 18)}<span>${primaryLabel}</span>`;
        primary.dataset.label = primaryLabel;
      }
      host.querySelectorAll('[data-mode]').forEach(button => {
        button.setAttribute('aria-selected', String(button.dataset.mode === state.mode));
        button.tabIndex = button.dataset.mode === state.mode ? 0 : -1;
        button.disabled = state.status === 'running';
      });
    }
    if (mini) {
      mini.hidden = state.status === 'idle' || Boolean(host);
      mini.dataset.status = state.status;
      mini.querySelector('.mini-timer-name').textContent = state.status === 'complete' ? (isStudy ? 'Estudo concluído' : 'Pausa concluída') : label;
      mini.querySelector('.mini-timer-time').textContent = state.status === 'paused' ? `${time} · pausado` : time;
    }
    if (state.status === 'complete' && lastCompletion !== `${state.mode}:${state.durationMs}`) {
      lastCompletion = `${state.mode}:${state.durationMs}`;
      notify(`${status}.`);
      if (host) host.querySelector('.timer-announcement').textContent = `${status}. ${isStudy ? 'A pausa' : 'O estudo'} pode ser iniciad${isStudy ? 'a' : 'o'}.`;
    } else if (state.status !== 'complete') lastCompletion = '';
    if (host && state.status !== 'idle') document.title = `${time} · ${label} — Mindful Bits`;
    else if (host) document.title = 'Pomodoro — Mindful Bits';
  }

  render();
  const interval = window.setInterval(render, 250);
  document.addEventListener('visibilitychange', render);
  window.addEventListener('storage', event => {
    if (event.key !== TIMER_KEY && event.key !== null) return;
    state = normalizeTimerState(readStore(TIMER_KEY, null));
    if (host && !host.querySelector('.timer-settings').contains(document.activeElement)) {
      host.querySelector('#study-minutes').value = state.studyMinutes;
      host.querySelector('#pause-minutes').value = state.pauseMinutes;
    }
    render();
  });
  window.addEventListener('pagehide', () => window.clearInterval(interval), { once: true });
  window.addEventListener('pageshow', event => { if (event.persisted) window.location.reload(); });
}

return { TIMER_KEY, createTimerState, normalizeTimerState, remainingTime, advanceTimer, resetTimer, toggleTimer, setTimerDurations, formatTime, initTimer };
})();
