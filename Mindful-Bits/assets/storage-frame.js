(function () {
  'use strict';
  const CHANNEL = 'mindful-bits-storage-v1';
  const KEYS = ['mindful.tasks.v1', 'mindful.subjects.v1', 'mindful.timer.v1'];
  if (window.parent === window) return;

  function reply(message) {
    window.parent.postMessage({ channel: CHANNEL, ...message }, '*');
  }

  function snapshot() {
    const values = {};
    try {
      KEYS.forEach(key => { values[key] = window.localStorage.getItem(key); });
      return { ok: true, values };
    } catch (error) {
      return { ok: false, values: {} };
    }
  }

  window.addEventListener('message', event => {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.channel !== CHANNEL) return;
    if (message.type === 'read') {
      reply({ type: 'snapshot', id: message.id, ...snapshot() });
    } else if (message.type === 'write' && KEYS.includes(message.key) && typeof message.value === 'string') {
      let ok = false;
      try {
        JSON.parse(message.value);
        window.localStorage.setItem(message.key, message.value);
        ok = true;
      } catch (error) { /* The parent displays a storage warning. */ }
      reply({ type: 'write-result', id: message.id, key: message.key, ok });
    }
  });

  window.addEventListener('storage', event => {
    if (event.key === null || KEYS.includes(event.key)) reply({ type: 'changed', ...snapshot() });
  });
  reply({ type: 'ready' });
}());
