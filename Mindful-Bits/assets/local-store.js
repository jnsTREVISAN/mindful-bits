(function () {
  'use strict';

  const CHANNEL = 'mindful-bits-storage-v1';
  const KEYS = ['mindful.tasks.v1', 'mindful.subjects.v1', 'mindful.timer.v1'];
  const allowed = key => KEYS.includes(key);
  const cache = new Map();
  const unsaved = new Set();
  const pending = new Map();
  const latest = new Map();
  const fileMode = window.location.protocol === 'file:';
  const scriptURL = document.currentScript && document.currentScript.src;
  let mode = fileMode ? 'initializing' : 'direct';
  let failed = false;
  let sequence = 0;
  let frame = null;
  let initTimeout;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  function reportFailure() {
    failed = true;
    document.dispatchEvent(new CustomEvent('mindful:storage-error'));
  }

  function directRead(key) {
    if (unsaved.has(key)) return cache.get(key) ?? null;
    try {
      const value = window.localStorage.getItem(key);
      cache.set(key, value);
      return value;
    } catch (error) {
      reportFailure();
      return cache.get(key) ?? null;
    }
  }

  function directWrite(key, raw) {
    try {
      window.localStorage.setItem(key, raw);
      unsaved.delete(key);
      return true;
    } catch (error) {
      unsaved.add(key);
      reportFailure();
      return false;
    }
  }

  function post(message) {
    if (frame && frame.contentWindow) {
      // Local file documents have an opaque origin. The receiver is checked by source.
      frame.contentWindow.postMessage({ channel: CHANNEL, ...message }, '*');
    }
  }

  function storageEvent(key, oldValue, newValue) {
    window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue }));
  }

  function applySnapshot(values, notify) {
    if (!values || typeof values !== 'object') return;
    KEYS.forEach(key => {
      if (latest.has(key) || unsaved.has(key)) return;
      const value = values[key];
      if (value !== null && typeof value !== 'string') return;
      const oldValue = cache.get(key) ?? null;
      cache.set(key, value);
      if (notify && oldValue !== value) storageEvent(key, oldValue, value);
    });
  }

  function finishInit(ok, values) {
    if (mode !== 'initializing') return;
    clearTimeout(initTimeout);
    if (ok) {
      applySnapshot(values, false);
      mode = 'frame';
    } else {
      mode = 'direct';
      KEYS.forEach(key => { if (!latest.has(key)) directRead(key); });
      reportFailure();
    }
    resolveReady(ok);
  }

  function finishWrite(id, ok) {
    const request = pending.get(id);
    if (!request) return;
    clearTimeout(request.timeout);
    pending.delete(id);
    if (latest.get(request.key) === id) {
      latest.delete(request.key);
      if (ok) unsaved.delete(request.key);
      else unsaved.add(request.key);
    }
    if (!ok) reportFailure();
    request.resolve(ok);
    if (ok && mode === 'frame') post({ type: 'read', id: 'sync-' + (++sequence) });
  }

  function read(key, fallback) {
    if (!allowed(key)) return fallback;
    const raw = mode === 'direct' ? directRead(key) : cache.get(key);
    if (raw === null || raw === undefined) return fallback;
    try { return JSON.parse(raw); } catch (error) { return fallback; }
  }

  function write(key, value) {
    if (!allowed(key)) return false;
    let raw;
    try { raw = JSON.stringify(value); } catch (error) { reportFailure(); return false; }
    if (typeof raw !== 'string') return false;
    cache.set(key, raw);
    if (mode === 'direct') return directWrite(key, raw);
    const id = 'write-' + (++sequence);
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    latest.set(key, id);
    pending.set(id, { key, raw, promise, resolve, timeout: null });
    ready.then(() => {
      const request = pending.get(id);
      if (!request) return;
      if (mode === 'direct') return finishWrite(id, directWrite(key, raw));
      request.timeout = setTimeout(() => finishWrite(id, false), 2200);
      post({ type: 'write', id, key, value: raw });
    });
    return true;
  }

  async function flush() {
    await ready;
    let success = true;
    while (pending.size) {
      const results = await Promise.all(Array.from(pending.values(), request => request.promise));
      if (results.some(result => !result)) success = false;
    }
    return success && unsaved.size === 0;
  }

  window.MindfulStore = Object.freeze({ ready, read, write, flush, hasFailure: () => failed });

  if (!fileMode) {
    resolveReady(true);
    return;
  }

  window.addEventListener('message', event => {
    if (!frame || event.source !== frame.contentWindow) return;
    const message = event.data;
    if (!message || message.channel !== CHANNEL) return;
    if (message.type === 'ready' && mode === 'initializing') post({ type: 'read', id: 'initial' });
    if (message.type === 'snapshot') {
      if (message.id === 'initial') finishInit(message.ok === true, message.values);
      else if (mode === 'frame' && message.ok === true) applySnapshot(message.values, true);
      else if (mode === 'frame' && message.ok === false) reportFailure();
    }
    if (message.type === 'write-result') finishWrite(message.id, message.ok === true);
    if (message.type === 'changed' && mode === 'frame') {
      if (message.ok === false) reportFailure();
      else applySnapshot(message.values, true);
    }
  });

  function mountFrame() {
    frame = document.createElement('iframe');
    frame.hidden = true;
    frame.title = 'Armazenamento local do Mindful Bits';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.addEventListener('load', () => { if (mode === 'initializing') post({ type: 'read', id: 'initial' }); });
    frame.addEventListener('error', () => finishInit(false));
    frame.src = scriptURL ? new URL('storage.html', scriptURL).href : 'assets/storage.html';
    initTimeout = setTimeout(() => finishInit(false), 2200);
    document.body.appendChild(frame);
  }
  if (document.body) mountFrame();
  else document.addEventListener('DOMContentLoaded', mountFrame, { once: true });
}());
