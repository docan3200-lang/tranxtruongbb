(() => {
  'use strict';
  const root = document.documentElement;
  const intro = document.getElementById('invitationIntro');
  const shell = document.getElementById('siteShell');
  const envelope = document.getElementById('envelopeOpen');
  const openButton = document.getElementById('introOpenButton');
  const skipButton = document.getElementById('introSkip');
  const replay = document.getElementById('replayInvite');
  const message = document.getElementById('introMessage');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const HOLD_MS = 1000;
  intro.style.setProperty('--invitation-hold', `${HOLD_MS}ms`);
  let timers = [];
  let state = 'sealed';
  let returnFocus;
  function schedule(fn, delay) { timers.push(setTimeout(fn, delay)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function setState(next) {
    state = next;
    intro.dataset.state = next;
    intro.dataset.stateAt = String(performance.now());
  }
  function enterWebsite() {
    if (state === 'leaving' || state === 'complete') return;
    clearTimers();
    intro.dataset.holdEndedAt = String(performance.now());
    setState('leaving');
    intro.classList.add('is-leaving');
    root.classList.remove('intro-active');
    // Both surfaces overlap for a soft dissolve; audio continues without restarting.
    window.scrollTo({top:0, behavior:'instant'});
    schedule(() => {
      intro.hidden = true;
      intro.classList.remove('is-leaving');
      shell.inert = false;
      shell.removeAttribute('aria-hidden');
      setState('complete');
      const target = returnFocus || document.querySelector('h1');
      if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({preventScroll:true});
      }
      returnFocus = null;
    }, reducedMotion.matches ? 150 : 1100);
  }
  function holdInvitation() {
    setState('holding');
    intro.classList.add('is-holding');
    intro.dataset.holdStartedAt = String(performance.now());
    message.textContent = 'Hạnh phúc khi có bạn chung vui.';
    // Count one full second only after the card is lifted and the envelope fades.
    schedule(enterWebsite, HOLD_MS);
  }
  function openInvitation() {
    if (state !== 'sealed') return;
    setState('opening');
    intro.classList.add('is-opening');
    envelope.setAttribute('aria-disabled', 'true');
    openButton.setAttribute('aria-disabled', 'true');
    skipButton.hidden = false;
    message.textContent = 'Một ngày vui, một đời thương.';
    document.dispatchEvent(new CustomEvent('invitation:open'));
    if (reducedMotion.matches) {
      intro.classList.add('is-revealed');
      schedule(holdInvitation, 150);
    } else {
      schedule(() => {
        setState('revealing');
        intro.classList.add('is-revealed');
      }, 2100);
      schedule(holdInvitation, 2800);
    }
  }
  function resetIntro(isReplay = false) {
    clearTimers();
    if (isReplay) returnFocus = replay;
    intro.hidden = false;
    intro.classList.remove('is-opening', 'is-revealed', 'is-holding', 'is-leaving');
    delete intro.dataset.holdStartedAt;
    delete intro.dataset.holdEndedAt;
    shell.inert = true;
    shell.setAttribute('aria-hidden', 'true');
    root.classList.add('intro-active');
    setState('sealed');
    envelope.removeAttribute('aria-disabled');
    openButton.removeAttribute('aria-disabled');
    skipButton.hidden = true;
    message.textContent = 'Hạnh phúc khi có bạn chung vui.';
    intro.setAttribute('tabindex', '-1');
    intro.focus({preventScroll:true});
  }
  envelope.addEventListener('click', openInvitation);
  openButton.addEventListener('click', openInvitation);
  skipButton.addEventListener('click', enterWebsite);
  replay.addEventListener('click', () => resetIntro(true));
  intro.addEventListener('keydown', event => {
    if (event.key === 'Escape' && state !== 'sealed') {
      event.preventDefault();
      enterWebsite();
    }
    if (event.key === 'Tab') {
      const controls = [...intro.querySelectorAll('button')].filter(el => !el.hidden && !el.disabled && getComputedStyle(el).visibility !== 'hidden');
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  resetIntro();
})();
