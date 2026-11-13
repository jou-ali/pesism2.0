'use client';

import { useEffect } from 'react';

const $ = <T extends Element = Element>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = Element>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Attaches the site's interactive chrome — Lenis smooth scroll, spring reveals, the intro
 * loader, the fullscreen menu, the registration modal, and the players carousel — to the
 * server-rendered markup. Ported close to 1:1 from design/landing.html's vanilla script so the
 * motion and timing stay exactly as designed; React only owns the markup, not these effects.
 */
export function SiteInteractions() {
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lenis: { raf: (t: number) => void; stop: () => void; start: () => void; scrollTo: (target: number | Element, opts?: Record<string, unknown>) => void } | null = null;

    const ticks = new Set<(dt: number, now: number) => void>();
    let lastT = performance.now();
    let rafId = 0;
    function loop(now: number) {
      const dt = Math.min((now - lastT) / 1000, 1 / 20);
      lastT = now;
      if (lenis) lenis.raf(now);
      for (const fn of [...ticks]) fn(dt, now);
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    class Spring {
      value: number;
      target: number;
      velocity = 0;
      stiffness: number;
      damping: number;
      mass: number;
      precision: number;
      onUpdate: ((v: number) => void) | null = null;
      onRest: ((v: number) => void) | null = null;
      private tick = (dt: number) => {
        const h = 1 / 240;
        let t = dt;
        while (t > 0) {
          const step = Math.min(h, t);
          const force = -this.stiffness * (this.value - this.target) - this.damping * this.velocity;
          this.velocity += (force / this.mass) * step;
          this.value += this.velocity * step;
          t -= step;
        }
        const resting = Math.abs(this.velocity) < this.precision * 10 && Math.abs(this.value - this.target) < this.precision;
        if (resting) { this.value = this.target; this.velocity = 0; }
        this.onUpdate?.(this.value);
        if (resting) { ticks.delete(this.tick); this.onRest?.(this.value); }
      };
      constructor(value = 0, opts: { stiffness?: number; damping?: number; mass?: number; precision?: number } = {}) {
        this.value = value; this.target = value;
        this.stiffness = opts.stiffness ?? 170;
        this.damping = opts.damping ?? 22;
        this.mass = opts.mass ?? 1;
        this.precision = opts.precision ?? 0.001;
      }
      to(target: number) {
        this.target = target;
        if (reduced) {
          this.value = target; this.velocity = 0;
          this.onUpdate?.(target); this.onRest?.(target);
          return this;
        }
        ticks.add(this.tick);
        return this;
      }
    }

    let locks = 0;
    function lockScroll() {
      if (locks++ === 0) { document.body.classList.add('is-locked'); lenis?.stop(); }
    }
    function unlockScroll() {
      locks = Math.max(0, locks - 1);
      if (locks === 0) { document.body.classList.remove('is-locked'); lenis?.start(); }
    }

    function scrollToHash(hash: string) {
      const el = hash === '#top' ? document.body : $(hash);
      if (!el) return;
      const offset = hash === '#top' ? 0 : -72;
      if (lenis) lenis.scrollTo(hash === '#top' ? 0 : el, { offset, duration: 1.4 });
      else {
        const y = hash === '#top' ? 0 : el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
      }
    }

    let cancelled = false;
    (async () => {
      if (reduced) return;
      try {
        const mod = await import('lenis');
        const LenisCtor = mod.default;
        if (cancelled) return;
        const instance = new LenisCtor({ duration: 1.15, easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
        lenis = instance;
        if (locks > 0) instance.stop();
      } catch (err) {
        console.warn('Lenis could not load, using native scrolling.', err);
      }
    })();

    // ---------- Reveals ----------
    function springReveal(el: HTMLElement, delay = 0) {
      if (el.dataset.revealed) return;
      el.dataset.revealed = '1';
      const dist = parseFloat(el.dataset.reveal || '') || 48;
      const s = new Spring(0, { stiffness: 140, damping: 17, precision: 0.001 });
      s.onUpdate = v => {
        el.style.opacity = String(clamp(v, 0, 1));
        el.style.transform = `translate3d(0,${(1 - v) * dist}px,0) scale(${0.97 + 0.03 * v})`;
      };
      s.onRest = () => { el.classList.add('is-revealed'); el.style.transform = ''; el.style.opacity = ''; };
      setTimeout(() => s.to(1), reduced ? 0 : delay);
    }

    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        io.unobserve(el);
        if (el.hasAttribute('data-split')) el.classList.add('is-in');
        if (el.hasAttribute('data-reveal')) {
          let delay = Number(el.dataset.delay) || 0;
          const group = el.parentElement?.closest('[data-stagger]');
          if (group) delay += $$('[data-reveal]', group).indexOf(el) * 110;
          springReveal(el, Math.max(0, delay));
        }
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    function observeReveals() {
      $$('[data-split], [data-reveal]')
        .filter(el => !el.closest('.hero') && !(el as HTMLElement).dataset.revealed && !el.classList.contains('is-in'))
        .forEach(el => io.observe(el));
    }

    function revealHero() {
      $('.hero')?.classList.add('is-in');
      $$<HTMLElement>('[data-hero-card]').forEach((el, i) => springReveal(el, 1050 + i * 120));
    }

    // ---------- Loader ----------
    function runLoader(): Promise<void> {
      return new Promise(resolve => {
        const loader = $('.loader');
        const fill = $<HTMLElement>('.loader__fill');
        const num = $('.loader__num');
        const status = $<HTMLElement>('.loader__status');
        if (!loader || !fill || !num) { resolve(); return; }
        const MIN = 1400, MAX = 2300, EXIT = 850;
        let loaded = document.readyState === 'complete';
        window.addEventListener('load', () => { loaded = true; }, { once: true });

        const STATUS_MESSAGES = ['Loading egos…', 'Checking excuses…', 'Warming up the banter…'];
        let statusTimer: ReturnType<typeof setInterval> | null = null;
        if (status && !reduced) {
          let i = 0;
          statusTimer = setInterval(() => {
            i = (i + 1) % STATUS_MESSAGES.length;
            status.textContent = STATUS_MESSAGES[i];
          }, 700);
        }

        const finish = () => {
          if (statusTimer) clearInterval(statusTimer);
          loader.classList.add('is-exiting');
          setTimeout(() => loader.remove(), reduced ? 0 : EXIT);
          resolve();
        };

        if (reduced) {
          fill.style.transform = 'scaleX(1)';
          num.textContent = '100';
          setTimeout(finish, 300);
          return;
        }

        const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const start = performance.now();
        let shown = 0;
        const frame = (now: number) => {
          const t = now - start;
          const canFinish = (loaded && t >= MIN) || t >= MAX;
          const target = canFinish ? 1 : 0.9 * easeInOutCubic(Math.min(t / MIN, 1));
          shown += (target - shown) * (canFinish ? 0.18 : 0.25);
          if (canFinish && 1 - shown < 0.004) shown = 1;
          fill.style.transform = `scaleX(${shown})`;
          num.textContent = String(Math.round(shown * 100));
          if (shown < 1) requestAnimationFrame(frame);
          else setTimeout(finish, 120);
        };
        requestAnimationFrame(frame);
      });
    }

    // ---------- Scroll fx: header ----------
    function initScrollFx() {
      const header = $('.header');
      let lastY = -1;
      const tick = () => {
        const y = window.scrollY;
        if (y === lastY) return;
        lastY = y;
        header?.classList.toggle('is-scrolled', y > 40);
      };
      ticks.add(tick);
      tick();
      return () => ticks.delete(tick);
    }

    // ---------- Carousel ----------
    function initCarousel(root: HTMLElement) {
      const track = $<HTMLElement>('.carousel__track', root);
      if (!track) return;
      const slides = $$<HTMLElement>('.player', track);
      const dotsWrap = $('.dots', root);
      const prev = $('.arrow-btn--prev', root);
      const next = $('.arrow-btn--next', root);
      if (!dotsWrap || !prev || !next || !slides.length) return;
      let index = 0;
      let timer: ReturnType<typeof setInterval> | null = null;
      let paused = false;

      const perView = () => parseInt(getComputedStyle(root).getPropertyValue('--per-view'), 10) || 1;
      const maxIndex = () => Math.max(0, slides.length - perView());

      const buildDots = () => {
        const count = maxIndex() + 1;
        dotsWrap.innerHTML = Array.from({ length: count }, (_, i) => `<button class="dot" type="button" aria-label="Go to slide ${i + 1}"></button>`).join('');
        $$('.dot', dotsWrap).forEach((dot, i) => dot.addEventListener('click', () => { go(i); restart(); }));
      };

      const go = (i: number) => {
        const max = maxIndex();
        index = i > max ? 0 : i < 0 ? max : i;
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        const step = slides[0].getBoundingClientRect().width + gap;
        track.style.transform = `translate3d(${-index * step}px,0,0)`;
        $$('.dot', dotsWrap).forEach((d, k) => d.setAttribute('aria-current', k === index ? 'true' : 'false'));
        slides.forEach((s, k) => {
          const visible = k >= index && k < index + perView();
          s.setAttribute('aria-hidden', visible ? 'false' : 'true');
          s.inert = !visible;
        });
      };

      const restart = () => {
        if (timer) clearInterval(timer);
        if (reduced) return;
        timer = setInterval(() => { if (!paused && !document.hidden) go(index + 1); }, 4500);
      };

      prev.addEventListener('click', () => { go(index - 1); restart(); });
      next.addEventListener('click', () => { go(index + 1); restart(); });
      root.addEventListener('mouseenter', () => { paused = true; });
      root.addEventListener('mouseleave', () => { paused = false; });
      root.addEventListener('focusin', () => { paused = true; });
      root.addEventListener('focusout', () => { paused = false; });
      root.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { go(index + 1); restart(); }
        if (e.key === 'ArrowLeft') { go(index - 1); restart(); }
      });

      let startX: number | null = null;
      const vp = $<HTMLElement>('.carousel__viewport', root);
      vp?.addEventListener('pointerdown', e => { startX = e.clientX; });
      vp?.addEventListener('pointerup', e => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 50) { go(index + (dx < 0 ? 1 : -1)); restart(); }
        startX = null;
      });
      vp?.addEventListener('pointercancel', () => { startX = null; });

      let lastPV = perView();
      const onResize = () => {
        if (perView() !== lastPV) { lastPV = perView(); buildDots(); }
        go(Math.min(index, maxIndex()));
      };
      window.addEventListener('resize', onResize);

      buildDots(); go(0); restart();
    }

    // ---------- Focus trap ----------
    function trapFocus(container: HTMLElement, e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const items = $$<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        container,
      ).filter(el => el.offsetParent !== null || el.getClientRects().length);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    // ---------- Menu ----------
    const menu = $<HTMLElement>('#menu');
    const menuBtn = $<HTMLButtonElement>('.menu-toggle');
    let menuOpen = false;
    let menuReturnFocus: HTMLElement | null = null;

    function openMenu() {
      if (!menu || !menuBtn || menuOpen) return;
      menuOpen = true;
      menuReturnFocus = document.activeElement as HTMLElement;
      menu.hidden = false;
      lockScroll();
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      menuBtn.setAttribute('aria-expanded', 'true');
      setTimeout(() => $<HTMLElement>('.menu__close', menu)?.focus({ preventScroll: true }), 60);
    }
    function closeMenu(after?: () => void) {
      if (!menu || !menuBtn || !menuOpen) { after?.(); return; }
      menuOpen = false;
      menu.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      setTimeout(() => {
        menu.hidden = true;
        unlockScroll();
        if (after) after();
        else menuReturnFocus?.focus({ preventScroll: true });
      }, reduced ? 0 : 650);
    }
    menuBtn?.addEventListener('click', openMenu);
    if (menu) $<HTMLElement>('.menu__close', menu)?.addEventListener('click', () => closeMenu());
    if (menu) $$<HTMLAnchorElement>('[data-menu-link]', menu).forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const href = a.getAttribute('href') || '';
      const hash = href.includes('#') ? `#${href.split('#')[1]}` : '#top';
      closeMenu(() => scrollToHash(hash));
    }));

    // ---------- Registration modal ----------
    const modal = $<HTMLElement>('#register');
    const dialog = modal ? $<HTMLElement>('.modal__dialog', modal) : null;
    const formView = modal ? $<HTMLElement>('[data-view="form"]', modal) : null;
    const verifyView = modal ? $<HTMLElement>('[data-view="verify"]', modal) : null;
    const successView = modal ? $<HTMLElement>('[data-view="success"]', modal) : null;
    const form = formView ? $<HTMLFormElement>('form', formView) : null;
    const verifyForm = verifyView ? $<HTMLFormElement>('.verify-form', verifyView) : null;
    const submitBtn = form ? $<HTMLButtonElement>('button[type="submit"]', form) : null;

    function registrationAllowed(): boolean {
      return modal?.getAttribute('data-registration-open') === 'true';
    }

    function syncSubmitEnabled() {
      if (!submitBtn) return;
      if (!registrationAllowed()) {
        submitBtn.disabled = true;
        const label = $<HTMLElement>('.btn__label', submitBtn);
        if (label && !registrationAllowed()) label.textContent = 'Registration not open yet';
      }
    }
    syncSubmitEnabled();

    let modalOpen = false;
    let modalReturnFocus: HTMLElement | null = null;
    let submitTimer: ReturnType<typeof setTimeout> | null = null;

    const mSpring = new Spring(0, { stiffness: 260, damping: 21, precision: 0.001 });
    mSpring.onUpdate = v => {
      if (!dialog) return;
      dialog.style.opacity = String(clamp(v, 0, 1));
      dialog.style.transform = `translate3d(0,${(1 - v) * 40}px,0) scale(${0.92 + 0.08 * v})`;
    };

    function openModal() {
      if (!modal || modalOpen) return;
      const doOpen = () => {
        modalOpen = true;
        modalReturnFocus = document.activeElement as HTMLElement;
        modal.hidden = false;
        lockScroll();
        requestAnimationFrame(() => { modal.classList.add('is-open'); mSpring.to(1); });
        setTimeout(() => $<HTMLElement>('input', form ?? undefined)?.focus({ preventScroll: true }), 150);
      };
      if (menuOpen) closeMenu(doOpen); else doOpen();
    }
    function closeModal() {
      if (!modal || !modalOpen) return;
      modalOpen = false;
      modal.classList.remove('is-open');
      mSpring.to(0);
      setTimeout(() => {
        modal.hidden = true;
        unlockScroll();
        resetForm();
        modalReturnFocus?.focus({ preventScroll: true });
      }, reduced ? 0 : 450);
    }

    const messages: Record<string, string> = {
      name: 'Enter your full name.',
      gamer: 'Enter your gaming username.',
      email: 'Enter a valid email address, like you@example.com.',
      phone: 'Enter a valid WhatsApp number with at least 10 digits.',
      city: 'Enter your city.',
      efootball: 'Enter your eFootball username.',
      team: 'Enter your team name.',
      photo: 'Add a profile photo.',
    };
    function setError(field: HTMLElement, msg: string) {
      field.classList.toggle('has-error', !!msg);
      const err = $<HTMLElement>('.field__error', field);
      if (err) err.textContent = msg || '';
      $$<HTMLInputElement>('input', field).forEach(i => i.setAttribute('aria-invalid', msg ? 'true' : 'false'));
    }
    function fieldControlIsValid(field: HTMLElement): { ok: boolean; control: HTMLElement | null; msgKey: string } {
      const inputs = $$<HTMLInputElement>('input', field);
      const select = $<HTMLSelectElement>('select', field);
      if (select) {
        const ok = select.checkValidity() && select.value.trim() !== '';
        return { ok, control: select, msgKey: select.name };
      }
      if (!inputs.length) return { ok: true, control: null, msgKey: '' };
      const fileInput = inputs.find(i => i.type === 'file');
      const input = fileInput ?? inputs[0];
      const ok =
        input.type === 'radio'
          ? inputs.some(i => i.checked)
          : input.type === 'file'
            ? input.files != null && input.files.length > 0
            : input.checkValidity() && input.value.trim() !== '';
      const msgKey = input.name === 'photo' ? 'photo' : input.name;
      return { ok, control: input, msgKey };
    }

    function validate(): boolean {
      if (!form) return false;
      let firstBad: HTMLElement | null = null;
      $$<HTMLElement>('.field', form).forEach(field => {
        const { ok, control, msgKey } = fieldControlIsValid(field);
        if (!control && ok) return;
        setError(field, ok ? '' : messages[msgKey] ?? 'This field is required.');
        if (!ok && !firstBad && control) firstBad = control;
      });
      if (firstBad) (firstBad as HTMLElement).focus();
      return !firstBad;
    }
    function resetForm() {
      if (!form || !submitBtn || !formView || !successView) return;
      if (submitTimer) clearTimeout(submitTimer);
      form.reset();
      verifyForm?.reset();
      $$<HTMLElement>('.field', form).forEach(f => setError(f, ''));
      if (verifyForm) $$<HTMLElement>('.field', verifyForm).forEach(f => setError(f, ''));
      modal?.removeAttribute('data-pending-player-id');
      syncSubmitEnabled();
      if (registrationAllowed()) {
        const label = $<HTMLElement>('.btn__label', submitBtn);
        if (label) label.textContent = 'Send verification code';
      }
      formView.hidden = false;
      if (verifyView) verifyView.hidden = true;
      successView.hidden = true;
    }

    const onFormInput = (e: Event) => {
      const target = e.target as HTMLElement;
      const field = target.closest<HTMLElement>('.field');
      if (field && field.classList.contains('has-error')) {
        const { ok } = fieldControlIsValid(field);
        if (ok) setError(field, '');
      }
    };
    const apiErrors: Record<string, string> = {
      already_registered: 'You are already registered for this season.',
      identity_conflict: 'These details match another account. Use the same email and WhatsApp as before, or contact an admin.',
      registration_closed: 'Registration is closed or has not opened yet.',
      tournament_full: 'All slots are full.',
      validation_error: 'Check the form and try again.',
      upload_error: 'Could not upload your photo. Check the file or try again.',
      verification_failed: 'That code did not work. Try again or resend.',
      email_send_failed: 'We could not send the verification email. Try again in a moment.',
    };

    let registerSubmitting = false;
    const onFormSubmit = async (e: Event) => {
      e.preventDefault();
      if (registerSubmitting) return;
      if (!validate() || !submitBtn || !formView || !successView || !form || !verifyView) return;
      if (!registrationAllowed()) {
        const hint = modal?.getAttribute('data-registration-hint') ?? 'Registration is not open yet.';
        const firstField = $<HTMLElement>('.field', form);
        if (firstField) setError(firstField, hint);
        return;
      }
      registerSubmitting = true;
      submitBtn.disabled = true;
      const label = $<HTMLElement>('.btn__label', submitBtn);
      if (label) label.textContent = 'Sending code…';

      const data = new FormData(form);
      const photo = data.get('photo');
      if (!(photo instanceof File) || photo.size === 0) {
        const photoField = $<HTMLElement>('#f-photo')?.closest<HTMLElement>('.field');
        if (photoField) setError(photoField, 'Add a profile photo.');
        submitBtn.disabled = false;
        if (label) label.textContent = 'Send verification code';
        registerSubmitting = false;
        return;
      }
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          body: data,
        });
        const body = (await res.json().catch(() => ({}))) as {
          code?: string;
          message?: string;
          playerId?: string;
          emailVerificationRequired?: boolean;
        };
        if (!res.ok) {
          const msg =
            body.message ??
            (body.code ? apiErrors[body.code] : undefined) ??
            'Registration failed. Try again.';
          const targetField =
            body.code === 'upload_error'
              ? ($<HTMLElement>('#f-photo')?.closest<HTMLElement>('.field') ?? $<HTMLElement>('.field', form))
              : body.code === 'email_send_failed'
                ? ($<HTMLElement>('#f-email')?.closest<HTMLElement>('.field') ?? $<HTMLElement>('.field', form))
                : $<HTMLElement>('.field', form);
          if (targetField) setError(targetField, msg);
          submitBtn.disabled = false;
          if (label) label.textContent = 'Send verification code';
          registerSubmitting = false;
          return;
        }
        formView.hidden = true;
        if (body.emailVerificationRequired && body.playerId) {
          const email = String(data.get('email') ?? '').trim();
          const emailEl = $<HTMLElement>('[data-verify-email]', verifyView);
          if (emailEl && email) emailEl.textContent = email;
          modal?.setAttribute('data-pending-player-id', body.playerId);
          verifyView.hidden = false;
          successView.hidden = true;
          setTimeout(() => $<HTMLInputElement>('#f-verify-code')?.focus({ preventScroll: true }), 80);
        } else {
          successView.hidden = false;
          $<HTMLElement>('h2', successView)?.focus({ preventScroll: true });
        }
      } catch {
        submitBtn.disabled = false;
        if (label) label.textContent = 'Send verification code';
      } finally {
        registerSubmitting = false;
      }
    };

    const onVerifySubmit = async (e: Event) => {
      e.preventDefault();
      if (!verifyForm || !verifyView || !successView || !modal) return;
      const playerId = modal.getAttribute('data-pending-player-id');
      if (!playerId) return;
      const codeInput = $<HTMLInputElement>('#f-verify-code', verifyForm);
      const code = codeInput?.value.trim() ?? '';
      const field = $<HTMLElement>('.field', verifyForm);
      if (!/^\d{4}$/.test(code)) {
        if (field) setError(field, 'Enter the 4-digit code from your email.');
        return;
      }
      const submitLabel = $<HTMLElement>('.verify__submit .btn__label');
      if (submitLabel) submitLabel.textContent = 'Checking…';
      try {
        const res = await fetch('/api/register/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, code }),
        });
        const body = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
        if (!res.ok) {
          const msg = body.message ?? (body.code ? apiErrors[body.code] : undefined) ?? 'Verification failed.';
          if (field) setError(field, msg);
          if (submitLabel) submitLabel.textContent = 'Verify & finish registration';
          return;
        }
        verifyView.hidden = true;
        successView.hidden = false;
        modal.removeAttribute('data-pending-player-id');
        $<HTMLElement>('h2', successView)?.focus({ preventScroll: true });
      } catch {
        if (field) setError(field, 'Could not reach the server. Try again.');
        if (submitLabel) submitLabel.textContent = 'Verify & finish registration';
      }
    };

    const onVerifyResend = async () => {
      if (!modal || !verifyForm) return;
      const playerId = modal.getAttribute('data-pending-player-id');
      if (!playerId) return;
      const field = $<HTMLElement>('.field', verifyForm);
      const resendBtn = $<HTMLButtonElement>('.verify__resend', verifyForm);
      if (resendBtn) resendBtn.disabled = true;
      try {
        const res = await fetch('/api/register/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, resend: true }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          if (field) setError(field, body.message ?? 'Could not resend. Wait a minute and try again.');
        } else if (field) {
          setError(field, '');
          const err = $<HTMLElement>('.field__error', field);
          if (err) err.textContent = 'New code sent. Check your inbox.';
        }
      } finally {
        if (resendBtn) resendBtn.disabled = false;
      }
    };

    form?.addEventListener('input', onFormInput);
    form?.addEventListener('submit', onFormSubmit);
    verifyForm?.addEventListener('submit', onVerifySubmit);
    const resendBtn = verifyForm ? $<HTMLButtonElement>('.verify__resend', verifyForm) : null;
    resendBtn?.addEventListener('click', onVerifyResend);
    const modalCloseBtn = modal ? $<HTMLButtonElement>('.modal__close', modal) : null;
    const successDoneBtn = modal ? $<HTMLButtonElement>('.success__done', modal) : null;
    modalCloseBtn?.addEventListener('click', closeModal);
    successDoneBtn?.addEventListener('click', closeModal);
    const onModalBackdrop = (e: MouseEvent) => { if (e.target === modal) closeModal(); };
    modal?.addEventListener('click', onModalBackdrop);

    // ---------- Global click / keydown ----------
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const opener = target.closest('[data-open-register]');
      if (opener) { e.preventDefault(); openModal(); return; }
      const a = target.closest<HTMLAnchorElement>('a[href*="#"]');
      if (!a || a.hasAttribute('data-menu-link')) return;
      const url = new URL(a.href, window.location.href);
      if (url.pathname !== window.location.pathname) return; // cross-page link: let it navigate normally
      const hash = url.hash || '#top';
      if (hash.length < 2 || (hash !== '#top' && !$(hash))) return;
      e.preventDefault();
      scrollToHash(hash);
    };
    document.addEventListener('click', onDocClick);

    const onDocKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalOpen) closeModal();
        else if (menuOpen) closeMenu();
      }
      if (modalOpen && dialog) trapFocus(dialog, e);
      else if (menuOpen && menu) trapFocus(menu, e);
    };
    document.addEventListener('keydown', onDocKeydown);

    // ---------- Nav spy ----------
    function initNavSpy() {
      const links = $$<HTMLAnchorElement>('.nav a');
      if (!links.length) return () => {};
      const map = links
        .map((a): [HTMLAnchorElement, Element | null] => {
          const hash = a.getAttribute('href')?.split('#')[1];
          const section = hash === 'top' || !hash ? $('.hero') : document.getElementById(hash);
          return [a, section];
        })
        .filter((pair): pair is [HTMLAnchorElement, Element] => !!pair[1]);
      if (!map.length) return () => {};
      const spy = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          links.forEach(l => { l.classList.remove('is-current'); l.removeAttribute('aria-current'); });
          const hit = map.find(([, s]) => s === en.target);
          if (hit) { hit[0].classList.add('is-current'); hit[0].setAttribute('aria-current', 'true'); }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      map.forEach(([, s]) => spy.observe(s));
      return () => spy.disconnect();
    }

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    let stopScrollFx: (() => void) | undefined;
    let stopNavSpy: (() => void) | undefined;

    (async () => {
      lockScroll();
      await runLoader();
      if (cancelled) { unlockScroll(); return; } // this pass was torn down (React StrictMode dev double-invoke) — don't claim reveals
      setTimeout(() => {
        if (cancelled) return;
        revealHero();
        observeReveals();
        unlockScroll();
      }, reduced ? 0 : 220);
    })();

    const carouselRoot = $<HTMLElement>('.carousel');
    if (carouselRoot) initCarousel(carouselRoot);
    stopScrollFx = initScrollFx();
    stopNavSpy = initNavSpy();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      form?.removeEventListener('input', onFormInput);
      form?.removeEventListener('submit', onFormSubmit);
      verifyForm?.removeEventListener('submit', onVerifySubmit);
      resendBtn?.removeEventListener('click', onVerifyResend);
      modalCloseBtn?.removeEventListener('click', closeModal);
      successDoneBtn?.removeEventListener('click', closeModal);
      modal?.removeEventListener('click', onModalBackdrop);
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onDocKeydown);
      stopScrollFx?.();
      stopNavSpy?.();
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
