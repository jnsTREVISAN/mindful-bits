/* Mindful Bits — JavaScript para uso direto no navegador. */
window.MindfulBreathing = (() => {
'use strict';
const { icon } = window.MindfulShared;
const BREATHING_DURATION = 60_000;

function breathingPhase(elapsedMs) {
  const elapsed = Math.max(0, elapsedMs);
  if (elapsed >= BREATHING_DURATION) return { phase: 'complete', cycle: 6, remainingMs: 0, scale: 0.8, phaseRemaining: 0 };
  const inCycle = elapsed % 10_000;
  const inhaling = inCycle < 4000;
  const progress = inhaling ? inCycle / 4000 : (inCycle - 4000) / 6000;
  return {
    phase: inhaling ? 'inhale' : 'exhale',
    cycle: Math.floor(elapsed / 10_000) + 1,
    remainingMs: BREATHING_DURATION - elapsed,
    scale: inhaling ? 0.8 + progress * 0.2 : 1 - progress * 0.2,
    phaseRemaining: Math.ceil((inhaling ? 4000 - inCycle : 10_000 - inCycle) / 1000),
  };
}

function initBreathing() {
  if (typeof document === 'undefined') return;
  const host = document.getElementById('breathing-app');
  if (!host) return;
  let startedAt = null;
  let interval = null;
  let lastPhase = '';
  host.innerHTML = `
    <section class="breathing-panel" aria-label="Exercício de respiração">
      <div class="breathing-duration">${icon('clock', 16)}<span>1 minuto · 6 ciclos</span></div>
      <div class="breathing-orbit">
        <span class="breathing-orbit-line" aria-hidden="true"></span>
        <div class="breathing-orb" style="--breath-scale: .8" aria-hidden="true"></div>
        <div class="breathing-orb-content"><span class="breathing-orb-label">Respiração<br>guiada</span><span class="breathing-orb-time">Inspire e expire</span></div>
      </div>
      <p class="breathing-cycle">Inspire por 4 segundos. Expire por 6.</p>
      <div class="breathing-actions"><button class="button button-primary breathing-start" type="button">${icon('play', 18)}<span>Iniciar exercício</span></button></div>
      <p class="breathing-announcement sr-only" role="status" aria-live="polite"></p>
    </section>
    <div class="breathing-rhythm" aria-label="Ritmo da respiração">
      <div class="breathing-rhythm-step" data-phase="inhale"><span class="breathing-rhythm-icon" aria-hidden="true">↗</span><div><span class="breathing-rhythm-label">Inspire</span><span class="breathing-rhythm-number">4 segundos</span></div><span class="breathing-rhythm-detail">Pelo nariz</span></div>
      <div class="breathing-rhythm-step" data-phase="exhale"><span class="breathing-rhythm-icon" aria-hidden="true">↙</span><div><span class="breathing-rhythm-label">Expire</span><span class="breathing-rhythm-number">6 segundos</span></div><span class="breathing-rhythm-detail">Devagar</span></div>
    </div>`;
  const button = host.querySelector('.breathing-start');
  const orb = host.querySelector('.breathing-orb');
  const label = host.querySelector('.breathing-orb-label');
  const counter = host.querySelector('.breathing-orb-time');
  const cycle = host.querySelector('.breathing-cycle');
  const announcement = host.querySelector('.breathing-announcement');

  function buttonLabel(text, name) {
    button.innerHTML = `${icon(name, 18)}<span>${text}</span>`;
  }

  function stop(completed = false) {
    startedAt = null;
    window.clearInterval(interval);
    interval = null;
    lastPhase = '';
    orb.style.setProperty('--breath-scale', '.8');
    label.textContent = completed ? 'Exercício concluído' : 'Respiração guiada';
    counter.textContent = completed ? '1 minuto' : 'Inspire e expire';
    cycle.textContent = completed ? '6 de 6 ciclos' : 'Inspire por 4 segundos. Expire por 6.';
    host.querySelectorAll('[data-phase]').forEach(step => step.classList.remove('is-active'));
    host.querySelector('.breathing-panel').dataset.status = completed ? 'complete' : 'idle';
    buttonLabel(completed ? 'Repetir exercício' : 'Iniciar exercício', 'play');
    announcement.textContent = completed ? 'Exercício concluído.' : 'Exercício interrompido.';
  }

  function render() {
    if (startedAt === null) return;
    const current = breathingPhase(Date.now() - startedAt);
    if (current.phase === 'complete') return stop(true);
    const phaseLabel = current.phase === 'inhale' ? 'Inspire' : 'Expire';
    label.textContent = phaseLabel;
    counter.textContent = `${current.phaseRemaining} s`;
    cycle.textContent = `Ciclo ${current.cycle} de 6 · ${Math.ceil(current.remainingMs / 1000)} s restantes`;
    orb.style.setProperty('--breath-scale', current.scale.toFixed(4));
    host.querySelectorAll('[data-phase]').forEach(step => step.classList.toggle('is-active', step.dataset.phase === current.phase));
    if (lastPhase !== current.phase) {
      announcement.textContent = `${phaseLabel}. ${current.phase === 'inhale' ? '4' : '6'} segundos.`;
      lastPhase = current.phase;
    }
  }

  button.addEventListener('click', () => {
    if (startedAt !== null) return stop(false);
    startedAt = Date.now();
    host.querySelector('.breathing-panel').dataset.status = 'running';
    buttonLabel('Parar exercício', 'stop');
    render();
    interval = window.setInterval(render, 50);
  });
  document.addEventListener('visibilitychange', render);
  window.addEventListener('pagehide', () => { if (startedAt !== null) stop(false); });
}

return { BREATHING_DURATION, breathingPhase, initBreathing };
})();
