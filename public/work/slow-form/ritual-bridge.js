/* Small scene-integrated control. No persistence, network, timers or health claims. */
(() => {
  'use strict';
  const minutes = [5, 10, 20];
  const words = ['A short pause between things.', 'A little room for an idea.', 'An unhurried pocket of your day.'];
  const mounted = new Map();
  let serial = 0;

  function mount(container, {onCompose} = {}) {
    if (!(container instanceof Element)) throw new TypeError('SlowFormRitual.mount needs a container element.');
    if (typeof onCompose !== 'function') throw new TypeError('SlowFormRitual.mount needs an onCompose callback.');
    mounted.get(container)?.destroy();
    const id = 'sf-ritual-' + (++serial);
    const node = document.createElement('section');
    node.className = 'sf-ritual-bridge';
    node.setAttribute('aria-labelledby', id + '-title');
    node.innerHTML = `<div class="sfr-choice"><p class="sfr-kicker">YOUR OWN PACE</p>
      <h2 id="${id}-title">How much time<br>is yours?</h2>
      <div class="sfr-dial" data-sf-track>
        <svg class="sfr-arc" viewBox="0 0 360 210" aria-hidden="true"><path class="sfr-rail" d="M44.05 131.61 A150 150 0 0 1 315.95 131.61"/><path class="sfr-selected-arc" pathLength="100" d="M44.05 131.61 A150 150 0 0 1 315.95 131.61"/></svg>
        <span class="sfr-handle" aria-hidden="true"></span>
        <div class="sfr-readout" aria-hidden="true"><span data-sf-number>—</span><span data-sf-unit>your minutes</span></div>
        <div class="sfr-options" role="radiogroup" aria-label="Time for your ritual" aria-required="true" aria-describedby="${id}-hint ${id}-error">
          ${minutes.map((value, index) => `<button type="button" role="radio" aria-checked="false" aria-label="${value} minutes" tabindex="${index === 1 ? '0' : '-1'}" data-sf-minutes="${value}" class="sfr-time sfr-time-${index}"><span>${value}</span><small>min</small></button>`).join('')}
        </div>
      </div>
      <p id="${id}-hint" class="sfr-hint" data-sf-hint>Turn the arc, or choose a time.</p>
      <p class="sfr-setting">Quiet & reflective <span aria-hidden="true">·</span> At the table</p>
      <p id="${id}-error" class="sfr-error" role="alert" hidden></p>
      <button type="button" class="sfr-compose">Review my ritual <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg></button>
      <p class="sfr-footnote">Three creative prompts. Your pace.</p>
      </div><div class="sfr-inline" hidden></div><span class="sfr-sr" role="status" aria-live="polite" data-sf-status></span>`;
    container.append(node);
    const buttons = [...node.querySelectorAll('[data-sf-minutes]')];
    const track = node.querySelector('[data-sf-track]');
    const number = node.querySelector('[data-sf-number]');
    const unit = node.querySelector('[data-sf-unit]');
    const hint = node.querySelector('[data-sf-hint]');
    const error = node.querySelector('.sfr-error');
    const compose = node.querySelector('.sfr-compose');
    const live = node.querySelector('[data-sf-status]');
    const listeners = [];
    const choice = node.querySelector('.sfr-choice'), inline = node.querySelector('.sfr-inline');
    const adapter = window.SlowFormSceneRitual;
    let unsubscribe = null, structuralKey = '';
    const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const time = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    let selected = null, pending = false, destroyed = false, dragging = null, handedOff = false;
    function listen(target, type, handler, options) { target.addEventListener(type, handler, options); listeners.push(() => target.removeEventListener(type, handler, options)); }
    function clearError() { error.hidden = true; error.textContent = ''; node.querySelector('.sfr-options').removeAttribute('aria-invalid'); }
    function setSelection(value, {focus = false, announce = true} = {}) {
      if (destroyed || pending || !minutes.includes(value)) return false;
      const index = minutes.indexOf(value), changed = selected !== value;
      selected = value; handedOff = false; clearError();
      const angle = [-65, 0, 65][index] * Math.PI / 180;
      node.style.setProperty('--sfr-x', (180 + 150 * Math.sin(angle)) / 360 * 100 + '%');
      node.style.setProperty('--sfr-y', (195 - 150 * Math.cos(angle)) / 210 * 100 + '%');
      node.style.setProperty('--sfr-fill', [2, 50, 100][index]);
      node.dataset.selected = String(value);
      number.textContent = value; unit.textContent = 'minutes'; hint.textContent = words[index];
      buttons.forEach(b => { const active = Number(b.dataset.sfMinutes) === value; b.setAttribute('aria-checked', String(active)); b.tabIndex = active ? 0 : -1; });
      if (focus) buttons[index].focus({preventScroll: true});
      if (announce && changed) live.textContent = `${value} minutes selected. Quiet and reflective, at the table.`;
      if (changed) container.dispatchEvent(new CustomEvent('slowform:ritual-preview', {bubbles: true, detail: {minutes: value, atmosphere: 'quiet', setting: 'table'}}));
      return true;
    }
    buttons.forEach(button => listen(button, 'click', () => setSelection(Number(button.dataset.sfMinutes))));
    listen(node.querySelector('.sfr-options'), 'keydown', event => {
      const source = event.target.closest('[data-sf-minutes]');
      if (!source || pending) return;
      let index = minutes.indexOf(Number(source.dataset.sfMinutes));
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') index = Math.min(2, index + 1);
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') index = Math.max(0, index - 1);
      else if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = 2;
      else return; // Enter/Space use the button's native click activation.
      event.preventDefault(); setSelection(minutes[index], {focus: true});
    });
    function point(event) {
      const box = track.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width * 360 - 180;
      const y = 195 - (event.clientY - box.top) / box.height * 210;
      const degrees = Math.atan2(x, y) * 180 / Math.PI;
      setSelection(minutes[degrees < -32.5 ? 0 : degrees > 32.5 ? 2 : 1], {announce: false});
    }
    listen(track, 'pointerdown', event => {
      if (pending || event.button !== 0 || event.target.closest('button')) return;
      dragging = event.pointerId; track.setPointerCapture?.(dragging); node.classList.add('sfr-dragging'); point(event);
    });
    listen(track, 'pointermove', event => { if (dragging === event.pointerId) point(event); });
    function endDrag(event) {
      if (dragging !== event.pointerId) return;
      try { track.releasePointerCapture?.(dragging); } catch {}
      dragging = null; node.classList.remove('sfr-dragging');
      if (selected !== null) live.textContent = `${selected} minutes selected. Quiet and reflective, at the table.`;
    }
    listen(track, 'pointerup', endDrag); listen(track, 'pointercancel', endDrag);
    listen(compose, 'click', async () => {
      if (pending || handedOff || destroyed) return;
      if (!minutes.includes(selected)) {
        error.textContent = 'Choose 5, 10 or 20 minutes to continue.'; error.hidden = false;
        node.querySelector('.sfr-options').setAttribute('aria-invalid', 'true'); buttons[1].focus({preventScroll: true}); return;
      }
      clearError(); pending = true; compose.disabled = true; node.setAttribute('aria-busy', 'true');
      buttons.forEach(b => b.disabled = true);
      try {
        await onCompose(Object.freeze({minutes: selected, atmosphere: 'quiet', setting: 'table', stage: 3}));
        handedOff = true;
        if (!destroyed) { live.textContent = 'Your ritual is ready to review.'; inline.querySelector('h2')?.focus({preventScroll:true}); }
      } catch {
        if (!destroyed) { error.textContent = 'The next step could not open. Your choice is kept. Try again.'; error.hidden = false; compose.focus({preventScroll: true}); }
      } finally {
        pending = false;
        if (!destroyed) { compose.disabled = false; buttons.forEach(b => b.disabled = false); node.removeAttribute('aria-busy'); }
      }
    });
    function renderSession(snapshot) {
      if (destroyed) return;
      const phase = snapshot.phase;
      const newKey = [phase,snapshot.minutes,snapshot.atmosphere,snapshot.setting,snapshot.runIndex,snapshot.completedId,snapshot.storageAvailable].join(':');
      const hadFocus = node.contains(document.activeElement);
      node.dataset.phase = phase; choice.hidden = phase !== 'choose'; inline.hidden = phase === 'choose';
      node.setAttribute('aria-labelledby', phase === 'choose' ? id + '-title' : id + '-session-title');
      if (newKey !== structuralKey) {
        structuralKey = newKey;
        const heading = text => `<h2 id="${id}-session-title" tabindex="-1">${escape(text)}</h2>`;
        const action = (key, label, primary = false) => `<button type="button" class="${primary ? 'sfr-primary' : 'sfr-text-action'}" data-sf-action="${key}">${escape(label)}</button>`;
        if (phase === 'review') inline.innerHTML = `<p class="sfr-kicker">YOUR MOMENT, COMPOSED</p>${heading(snapshot.title)}<p class="sfr-inline-meta">${snapshot.minutes} minutes · ${escape(snapshot.settingName)}</p><ol class="sfr-chapters">${snapshot.chapters.map(c=>`<li><span>${escape(c.title)}</span><span>${c.minutes} min</span></li>`).join('')}</ol><p class="sfr-inline-copy">A quiet sequence beside the cup. The timer starts only when you choose.</p>${action('begin','Begin this ritual',true)}<div class="sfr-secondary-actions">${action('change','Change the time')}${action('details','Adjust details')}</div>`;
        else if (phase === 'run') inline.innerHTML = `<p class="sfr-kicker">MOMENT ${snapshot.runIndex+1} OF 3 · ${snapshot.minutes} MINUTES</p>${heading(snapshot.prompt.title)}<p class="sfr-inline-copy">${escape(snapshot.prompt.text)}</p><div class="sfr-timer-row"><output class="sfr-timer" data-sf-timer aria-label="Time remaining for this moment">${time(snapshot.remaining)}</output><span>remaining<br>in this moment</span></div><div class="sfr-timer-actions">${action('toggle-timer',snapshot.timerLabel)}${action('reset-timer','Reset timer')}</div><p class="sfr-timer-status" data-sf-timer-status>${escape(snapshot.timerStatus)}</p>${action('next',snapshot.runIndex===2?'Finish & keep this moment':'Next moment',true)}<div class="sfr-secondary-actions">${action('change','Change time')}${action('details','Open detailed ritual')}</div>`;
        else if (phase === 'complete') inline.innerHTML = `<p class="sfr-kicker">A LITTLE TO KEEP</p>${heading('A moment, kept.')}<p class="sfr-inline-copy">Your ${snapshot.minutes}-minute sequence is in your journal${snapshot.storageAvailable?' on this browser':', for this visit only'}. No account, no submission.</p><a class="sfr-primary" href="#/journal">Open my journal</a>${action('change','Make another moment')}`;
        else { inline.innerHTML = ''; if (selected !== null && !snapshot.minutes) api.reset(); }
        if (hadFocus && phase !== 'choose') inline.querySelector('h2')?.focus({preventScroll:true});
      }
      if (phase === 'run') {
        inline.querySelector('[data-sf-timer]').textContent = time(snapshot.remaining);
        const toggle = inline.querySelector('[data-sf-action="toggle-timer"]');
        toggle.textContent = snapshot.timerLabel; toggle.disabled = snapshot.remaining === 0; toggle.setAttribute('aria-pressed',String(snapshot.playing));
        const status = inline.querySelector('[data-sf-timer-status]');
        if (status.textContent !== snapshot.timerStatus) status.textContent = snapshot.timerStatus;
      }
    }
    listen(inline, 'click', event => {
      const action = event.target.closest('[data-sf-action]')?.dataset.sfAction;
      if (!action || !adapter) return;
      if (action === 'begin') { adapter.begin(); inline.querySelector('h2')?.focus({preventScroll:true}); }
      else if (action === 'toggle-timer') adapter.toggleTimer();
      else if (action === 'reset-timer') adapter.resetTimer();
      else if (action === 'next') { adapter.advance(); inline.querySelector('h2')?.focus({preventScroll:true}); }
      else if (action === 'details') adapter.openDetails();
      else if (action === 'change') { adapter.reset(); api.reset(); buttons[1].focus({preventScroll:true}); }
    });
    const api = {
      getSelection: () => selected === null ? null : {minutes: selected, atmosphere: 'quiet', setting: 'table', stage: 3},
      reset() {
        if (destroyed || pending) return false;
        selected = null; handedOff = false; clearError(); delete node.dataset.selected;
        number.textContent = '—'; unit.textContent = 'your minutes'; hint.textContent = 'Turn the arc, or choose a time.'; live.textContent = '';
        buttons.forEach((b, i) => { b.setAttribute('aria-checked', 'false'); b.tabIndex = i === 1 ? 0 : -1; }); return true;
      },
      destroy() {
        if (destroyed) return;
        destroyed = true; unsubscribe?.(); listeners.forEach(remove => remove());
        if (dragging !== null) { try { track.releasePointerCapture?.(dragging); } catch {} }
        node.remove(); if (mounted.get(container) === api) mounted.delete(container);
      }
    };
    mounted.set(container, api);
    if (adapter?.subscribe) unsubscribe = adapter.subscribe(renderSession);
    return api;
  }
  window.SlowFormRitual = Object.freeze({mount, destroy(container) { if (container) mounted.get(container)?.destroy(); else [...mounted.values()].forEach(api => api.destroy()); }});
})();
