/* =========================================================================
   Sayantan Sikdar — motion engine
   A small attribute-driven engine in the spirit of StringTune: JS measures
   the page and writes CSS variables; styles.css decides what they look like.

   data-split="chars|words"   split text into .w / .c spans with --i and --n
   data-progress[="id"]       write --p (0→1) between data-start / data-end
                              ("top 0.8" = element top at 80% of viewport)
   data-reveal                add .is-in once the element enters view
   data-roll                  hover char-roll on links and buttons
   data-magnetic[="0.35"]     element leans toward the pointer
   data-spotlight             --sx / --sy follow the pointer
   data-cursor="Label"        cursor ring grows and shows a label
   data-count="6"             count up when revealed
   ========================================================================= */
(() => {
  'use strict';

  const doc = document.documentElement;
  const motion = !doc.classList.contains('reduced');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let vw = innerWidth;
  let vh = innerHeight;
  let sy = scrollY;
  let lastSy = sy;
  let velocity = 0;

  /* ---------------------------------------------------------------------
     Split text
     --------------------------------------------------------------------- */
  function splitText(el, mode) {
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    const named = el.closest('[aria-label], [aria-hidden="true"]');
    const out = document.createElement('span');
    out.setAttribute('aria-hidden', 'true');
    let ci = 0;
    let wi = 0;

    const build = (node, target) => {
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              target.appendChild(document.createTextNode(' '));
              return;
            }
            const w = document.createElement('span');
            w.className = 'w';
            if (mode === 'chars') {
              for (const ch of part) {
                const c = document.createElement('span');
                c.className = 'c';
                c.textContent = ch;
                c.style.setProperty('--i', ci++);
                w.appendChild(c);
              }
            } else {
              w.textContent = part;
              w.style.setProperty('--i', wi);
            }
            wi++;
            target.appendChild(w);
          });
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const clone = child.cloneNode(false);
          build(child, clone);
          target.appendChild(clone);
        }
      });
    };

    build(el, out);
    el.style.setProperty('--n', mode === 'chars' ? ci : wi);
    el.textContent = '';
    if (!named) {
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = label;
      el.appendChild(sr);
    }
    el.appendChild(out);
  }

  function rollify(el) {
    const text = el.textContent.trim();
    el.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    const roll = document.createElement('span');
    roll.className = 'roll';
    roll.setAttribute('aria-hidden', 'true');
    [...text].forEach((ch, i) => {
      const c = document.createElement('span');
      c.className = 'c';
      c.textContent = ch === ' ' ? ' ' : ch;
      c.style.setProperty('--i', i);
      roll.appendChild(c);
    });
    el.append(sr, roll);
  }

  $$('[data-split]').forEach(el => splitText(el, el.dataset.split || 'chars'));
  if (finePointer) $$('[data-roll]').forEach(rollify);

  /* ---------------------------------------------------------------------
     Smooth scroll
     --------------------------------------------------------------------- */
  let lenis = null;
  if (motion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
  }

  function scrollToTarget(target) {
    const el = typeof target === 'string' ? (target === '#top' ? 0 : $(target)) : target;
    if (el === null) return;
    if (lenis) {
      lenis.scrollTo(el, { duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) });
    } else if (el === 0) {
      scrollTo({ top: 0, behavior: motion ? 'smooth' : 'auto' });
    } else {
      el.scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
    }
    if (el && el !== 0) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (hash === '#' || (hash !== '#top' && !$(hash))) return;
    e.preventDefault();
    closeMenu(false);
    scrollToTarget(hash);
  });

  /* ---------------------------------------------------------------------
     Progress tracks
     --------------------------------------------------------------------- */
  const parseEdge = (s, fallback) => {
    const [edge, f] = (s || fallback).trim().split(/\s+/);
    return { edge, f: parseFloat(f) };
  };

  const tracks = $$('[data-progress]').map(el => ({
    el,
    id: el.dataset.progress || null,
    start: parseEdge(el.dataset.start, 'top 1'),
    end: parseEdge(el.dataset.end, 'bottom 0'),
    a: 0,
    b: 1,
    p: -1,
  }));

  function measureTracks() {
    tracks.forEach(t => {
      const r = t.el.getBoundingClientRect();
      const top = r.top + sy;
      const at = edge => (edge.edge === 'bottom' ? top + r.height : top) - vh * edge.f;
      t.a = at(t.start);
      t.b = at(t.end);
      if (t.b <= t.a) t.b = t.a + 1;
      t.p = -1;
    });
  }

  const hooks = {};

  function updateTracks() {
    for (const t of tracks) {
      const p = clamp((sy - t.a) / (t.b - t.a));
      if (Math.abs(p - t.p) < 0.0001) continue;
      t.p = p;
      t.el.style.setProperty('--p', p.toFixed(4));
      if (t.id && hooks[t.id]) hooks[t.id](p);
    }
  }

  /* ---------------------------------------------------------------------
     Hero — the headline tile grows into the full portrait
     --------------------------------------------------------------------- */
  const stage = $('#heroStage');
  const slot = $('#heroSlot');
  const portrait = $('#portrait');
  const hero = { x0: 0, y0: 0, s0: 1, X: 0, Y: 0, S: 1, e: 0 };

  function measureHero() {
    if (!motion || !stage) return;
    const st = stage.getBoundingClientRect();
    const sr = slot.getBoundingClientRect();
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    const mobile = W < 760;
    const S = Math.round(mobile ? Math.min(W - 32, H * 0.56) : Math.min(H * 0.66, W * 0.46));
    Object.assign(hero, {
      x0: sr.left - st.left,
      y0: sr.top - st.top,
      s0: Math.max(sr.width, 1),
      X: Math.round((W - S) / 2),
      Y: Math.round((H - S) / 2 + (mobile ? 24 : 14)),
      S,
    });
    stage.style.setProperty('--px', hero.X + 'px');
    stage.style.setProperty('--py', hero.Y + 'px');
    stage.style.setProperty('--ps', hero.S + 'px');
  }

  hooks.hero = p => {
    const e = easeInOut(clamp(p / 0.6));
    const d = easeOut(clamp((p - 0.5) / 0.3));
    hero.e = e;
    const sc = lerp(hero.s0 / hero.S, 1, e);
    const tx = lerp(hero.x0 + hero.s0 / 2 - (hero.X + hero.S / 2), 0, e);
    const ty = lerp(hero.y0 + hero.s0 / 2 - (hero.Y + hero.S / 2), 0, e);
    const s = stage.style;
    s.setProperty('--e', e.toFixed(4));
    s.setProperty('--d', d.toFixed(4));
    s.setProperty('--sc', sc.toFixed(5));
    s.setProperty('--tx', tx.toFixed(2) + 'px');
    s.setProperty('--ty', ty.toFixed(2) + 'px');
    s.setProperty('--rad', lerp(8, 3, e).toFixed(2) + 'px');
  };

  /* Portrait lens: grayscale ink, colour shows through a lens.
     Idle, the lens rests on the hollow's gold eye. */
  const EYE = { x: 62.4, y: 33.6 };
  const lens = { x: EYE.x, y: EYE.y, r: 150, tx: EYE.x, ty: EYE.y, hover: false, open: false };

  if (portrait) {
    portrait.addEventListener('pointermove', e => {
      const r = portrait.getBoundingClientRect();
      lens.tx = ((e.clientX - r.left) / r.width) * 100;
      lens.ty = ((e.clientY - r.top) / r.height) * 100;
      lens.hover = e.pointerType === 'mouse';
    });
    portrait.addEventListener('pointerleave', () => {
      lens.hover = false;
      lens.tx = EYE.x;
      lens.ty = EYE.y;
    });
    portrait.addEventListener('click', () => { lens.open = !lens.open; });
  }

  function updatePortrait(now) {
    if (!motion || !portrait || sy > vh * 3) return;
    const expanded = hero.e > 0.98;
    const base = lerp(150, 0, clamp(hero.e * 1.1));
    let active = 9 + Math.sin(now / 900) * 1.5;
    if (lens.hover && expanded) active = 22;
    if (lens.open) active = 150;
    const target = Math.max(base, active);
    if (!lens.hover) {
      lens.tx = EYE.x;
      lens.ty = EYE.y;
    }
    lens.x = lerp(lens.x, lens.tx, 0.14);
    lens.y = lerp(lens.y, lens.ty, 0.14);
    lens.r = lerp(lens.r, target, base > active ? 1 : 0.1);
    if (finePointer) cursor.classList.toggle('is-lens', lens.hover && expanded);
    const ps = portrait.style;
    ps.setProperty('--mx', lens.x.toFixed(2) + '%');
    ps.setProperty('--my', lens.y.toFixed(2) + '%');
    ps.setProperty('--lens', lens.r.toFixed(2));
  }

  /* Ember shards — pushed by the pointer, sprung back home */
  const shards = $$('.shard').map((el, i) => ({ el, x: 0, y: 0, vx: 0, vy: 0, r: 0, vr: 0, cx: 0, cy: 0, ph: i * 1.7 }));
  const pointer = { x: -999, y: -999, vx: 0, vy: 0 };

  function measureShards() {
    shards.forEach(s => {
      s.el.style.translate = '0px 0px';
      const r = s.el.getBoundingClientRect();
      s.cx = r.left + r.width / 2;
      s.cy = r.top + r.height / 2;
    });
  }

  function updateShards(now, dt) {
    if (!motion || !shards.length || sy > vh * 3) return;
    const pinned = sy < stage.parentElement.offsetHeight - vh;
    for (const s of shards) {
      if (pinned) {
        const dx = s.cx + s.x - pointer.x;
        const dy = s.cy + s.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 150) {
          const f = (1 - dist / 150) * 0.9;
          s.vx += (pointer.vx * 0.35 + (dx / (dist || 1)) * 3) * f;
          s.vy += (pointer.vy * 0.35 + (dy / (dist || 1)) * 3) * f;
          s.vr += (pointer.vx - pointer.vy) * 0.25 * f;
        }
      }
      s.vx += -s.x * 0.035 * dt;
      s.vy += -s.y * 0.035 * dt;
      s.vr += -s.r * 0.03 * dt;
      s.vx *= 0.9;
      s.vy *= 0.9;
      s.vr *= 0.9;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.r += s.vr * dt;
      const float = Math.sin(now / 1400 + s.ph) * 7;
      s.el.style.translate = `${s.x.toFixed(1)}px ${(s.y + float).toFixed(1)}px`;
      s.el.style.rotate = `${s.r.toFixed(1)}deg`;
    }
  }

  /* ---------------------------------------------------------------------
     Focus — three phrases scrubbed by scroll
     --------------------------------------------------------------------- */
  const focusLines = $$('.focus__line[data-range]').map(el => {
    const [a, b] = el.dataset.range.split(',').map(Number);
    return { el, a, b, hold: el.hasAttribute('data-hold'), q: -1 };
  });

  hooks.focus = p => {
    focusLines.forEach(l => {
      let q = clamp((p - l.a) / (l.b - l.a));
      if (l.hold) q = Math.min(q, 0.5);
      if (q !== l.q) {
        l.q = q;
        l.el.style.setProperty('--q', q.toFixed(4));
      }
    });
  };

  /* ---------------------------------------------------------------------
     Reveal + counters
     --------------------------------------------------------------------- */
  function countUp(el) {
    const to = parseFloat(el.dataset.count);
    if (!motion) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = now => {
      const t = clamp((now - t0) / 1400);
      el.textContent = Math.round(easeOut(t) * to);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const revealIO = new IntersectionObserver(entries => {
    let batch = 0;
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      if (!el.hasAttribute('data-split') && !el.style.getPropertyValue('--d')) el.style.setProperty('--d', batch++);
      el.classList.add('is-in');
      $$('[data-count]', el).forEach(countUp);
      revealIO.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  $$('[data-reveal]').forEach(el => {
    if (motion) revealIO.observe(el);
    else {
      el.classList.add('is-in');
      $$('[data-count]', el).forEach(countUp);
    }
  });

  /* ---------------------------------------------------------------------
     Velocity marquee
     --------------------------------------------------------------------- */
  const marquee = $('#marquee');
  const mq = { x: 0, half: 0, skew: 0, dir: -1, visible: false };
  if (marquee && motion) {
    marquee.innerHTML += marquee.innerHTML;
    new IntersectionObserver(([en]) => { mq.visible = en.isIntersecting; }).observe(marquee);
  }
  const measureMarquee = () => { if (marquee) mq.half = marquee.scrollWidth / 2; };

  function updateMarquee(dt) {
    if (!motion || !mq.visible || !mq.half) return;
    if (Math.abs(velocity) > 0.5) mq.dir = velocity > 0 ? -1 : 1;
    mq.x += mq.dir * (1.1 + Math.abs(velocity) * 0.6) * dt;
    if (mq.x <= -mq.half) mq.x += mq.half;
    if (mq.x > 0) mq.x -= mq.half;
    mq.skew = lerp(mq.skew, clamp(-velocity * 0.35, -10, 10), 0.12);
    marquee.style.transform = `translate3d(${mq.x.toFixed(2)}px,0,0) skewX(${mq.skew.toFixed(2)}deg)`;
  }

  /* ---------------------------------------------------------------------
     Cursor, magnetic, spotlight, metric card
     --------------------------------------------------------------------- */
  const cursor = $('#cursor');
  const ring = $('.cursor__ring', cursor);
  const dot = $('.cursor__dot', cursor);
  const cursorLabel = $('#cursorLabel');
  const ringPos = { x: -100, y: -100 };
  const metric = $('#metricFloat');
  const metricPos = { x: 0, y: 0 };
  let metricOn = false;

  if (finePointer) {
    doc.classList.add('has-cursor');
    let lastX = 0;
    let lastY = 0;

    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      pointer.vx = e.clientX - lastX;
      pointer.vy = e.clientY - lastY;
      lastX = pointer.x = e.clientX;
      lastY = pointer.y = e.clientY;
      if (ringPos.x < -50) { ringPos.x = pointer.x; ringPos.y = pointer.y; }
      cursor.classList.remove('is-hidden');
    }, { passive: true });

    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));

    document.addEventListener('pointerover', e => {
      const t = e.target;
      const labelled = t.closest('[data-cursor]');
      const lensEl = t.closest('[data-cursor-lens]');
      const link = t.closest('a, button, label, [data-magnetic]');
      cursor.classList.toggle('is-label', !!labelled);
      cursor.classList.toggle('is-link', !labelled && !lensEl && !!link);
      if (labelled) cursorLabel.textContent = labelled.dataset.cursor;
    });

    $$('.work__item').forEach(item => {
      item.addEventListener('pointerenter', () => {
        $('#metricValue').textContent = item.dataset.metric;
        $('#metricLabel').textContent = item.dataset.metricLabel;
        if (!metricOn) { metricPos.x = pointer.x + 64; metricPos.y = pointer.y - 60; }
        metricOn = true;
        metric.classList.add('is-on');
      });
      item.addEventListener('pointerleave', () => {
        metricOn = false;
        metric.classList.remove('is-on');
      });
    });

    $$('[data-spotlight]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--sx', e.clientX - r.left + 'px');
        el.style.setProperty('--sy', e.clientY - r.top + 'px');
      });
    });
  }

  const magnets = finePointer && motion
    ? $$('[data-magnetic]').map(el => ({ el, k: parseFloat(el.dataset.magnetic) || 0.35, x: 0, y: 0, tx: 0, ty: 0, on: false }))
    : [];
  magnets.forEach(m => {
    m.el.addEventListener('pointermove', e => {
      const r = m.el.getBoundingClientRect();
      m.tx = (e.clientX - (r.left + r.width / 2 - m.x)) * m.k;
      m.ty = (e.clientY - (r.top + r.height / 2 - m.y)) * m.k;
      m.on = true;
    });
    m.el.addEventListener('pointerleave', () => { m.tx = 0; m.ty = 0; });
  });

  function updatePointerUI() {
    if (!finePointer) return;
    const k = motion ? 0.2 : 1;
    ringPos.x = lerp(ringPos.x, pointer.x, k);
    ringPos.y = lerp(ringPos.y, pointer.y, k);
    dot.style.transform = `translate3d(${pointer.x}px,${pointer.y}px,0)`;
    ring.style.transform = `translate3d(${ringPos.x.toFixed(1)}px,${ringPos.y.toFixed(1)}px,0)`;

    if (metricOn || metric.classList.contains('is-on')) {
      const flip = pointer.x > vw - 300;
      const tx = flip ? pointer.x - 300 : pointer.x + 64;
      const ty = pointer.y - 60;
      metricPos.x = lerp(metricPos.x, tx, motion ? 0.14 : 1);
      metricPos.y = lerp(metricPos.y, ty, motion ? 0.14 : 1);
      metric.style.transform = `translate3d(${metricPos.x.toFixed(1)}px,${metricPos.y.toFixed(1)}px,0)`;
    }

    for (const m of magnets) {
      if (!m.on) continue;
      m.x = lerp(m.x, m.tx, 0.15);
      m.y = lerp(m.y, m.ty, 0.15);
      m.el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
      if (Math.abs(m.x) < 0.05 && Math.abs(m.y) < 0.05 && !m.tx && !m.ty) {
        m.on = false;
        m.el.style.translate = '';
      }
    }
  }

  /* ---------------------------------------------------------------------
     Navigation: theme, hide on scroll, active link, clock, mobile menu
     --------------------------------------------------------------------- */
  const nav = $('#nav');
  doc.dataset.nav = 'dark';

  const themeIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) doc.dataset.nav = en.target.dataset.theme;
    });
  }, { rootMargin: '-30px 0px -96% 0px' });
  $$('[data-theme]').forEach(el => themeIO.observe(el));

  const navLinks = $$('.nav__links a');
  const activeIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['arsenal', 'work', 'path', 'research', 'contact'].forEach(id => { const el = $('#' + id); if (el) activeIO.observe(el); });

  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => { if (clock) clock.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 15000);

  const menu = $('#menu');
  const toggle = $('#menuToggle');
  let menuOpen = false;

  function openMenu() {
    menuOpen = true;
    menu.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    doc.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    nav.classList.remove('is-hidden');
    lenis ? lenis.stop() : (document.body.style.overflow = 'hidden');
    setTimeout(() => $('a', menu)?.focus(), 300);
  }

  function closeMenu(returnFocus = true) {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    doc.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    lenis ? lenis.start() : (document.body.style.overflow = '');
    setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 800);
    if (returnFocus) toggle.focus();
  }

  toggle?.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  function updateNav() {
    if (menuOpen) return;
    const delta = sy - lastSy;
    if (sy > vh * 0.9 && delta > 3) nav.classList.add('is-hidden');
    else if (delta < -3 || sy < vh * 0.5) nav.classList.remove('is-hidden');
  }

  /* ---------------------------------------------------------------------
     Contact form — composes an email rather than pretending to send one
     --------------------------------------------------------------------- */
  const form = $('#contactForm');
  const note = $('#formNote');
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const fields = ['name', 'email', 'message'].map(id => form.elements[id]);
    let firstBad = null;
    fields.forEach(f => {
      const bad = !f.value.trim() || (f.type === 'email' && !f.checkValidity());
      f.parentElement.classList.toggle('is-invalid', bad);
      f.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if (bad && !firstBad) firstBad = f;
    });
    if (firstBad) {
      note.textContent = 'Please fill in all three fields with a valid email.';
      note.classList.add('is-error');
      firstBad.focus();
      return;
    }
    const [name, email, message] = fields.map(f => f.value.trim());
    const subject = encodeURIComponent(`Portfolio enquiry — ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    note.classList.remove('is-error');
    note.textContent = 'Opening your mail app…';
    location.href = `mailto:sayantansikdar@outlook.com?subject=${subject}&body=${body}`;
  });

  /* ---------------------------------------------------------------------
     Measure + main loop
     --------------------------------------------------------------------- */
  const scrollBar = $('.scroll-line span');
  const badge = $('#badge');
  let docMax = 1;

  function measure() {
    vw = innerWidth;
    vh = innerHeight;
    sy = scrollY;
    docMax = Math.max(1, document.documentElement.scrollHeight - vh);
    if (motion) {
      measureTracks();
      measureHero();
      measureShards();
      measureMarquee();
      updateTracks();
    }
  }

  let resizeTimer;
  let lastW = vw;
  let lastH = vh;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Ignore the small height jitter of mobile URL bars
      if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 120) return;
      lastW = innerWidth;
      lastH = innerHeight;
      measure();
    }, 150);
  });

  let lastFrame = performance.now();
  function frame(now) {
    const dt = Math.min(64, now - lastFrame) / 16.667;
    lastFrame = now;
    if (lenis) lenis.raf(now);
    sy = scrollY;
    const v = lenis ? lenis.velocity : sy - lastSy;
    velocity = lerp(velocity, v, 0.2);

    if (motion) {
      updateTracks();
      updatePortrait(now);
      updateShards(now, dt);
      updateMarquee(dt);
    }
    updatePointerUI();
    updateNav();
    scrollBar.style.setProperty('--doc', (sy / docMax).toFixed(4));
    if (badge && motion) badge.style.setProperty('--rot', ((sy * 0.06 + now * 0.004) % 360).toFixed(2) + 'deg');
    pointer.vx *= 0.8;
    pointer.vy *= 0.8;
    lastSy = sy;
    requestAnimationFrame(frame);
  }

  /* ---------------------------------------------------------------------
     Intro — counter, one cut, the page opens
     --------------------------------------------------------------------- */
  function finishIntro() {
    doc.classList.add('is-loaded');
    if (lenis) lenis.start();
    setTimeout(() => doc.classList.add('intro-done'), 2000);
  }

  function runIntro() {
    const loader = $('#loader');
    const showLoader = motion && !doc.classList.contains('intro-seen') && loader;
    if (!showLoader) {
      requestAnimationFrame(finishIntro);
      return;
    }
    if (lenis) lenis.stop();
    try { sessionStorage.setItem('ss-intro', '1'); } catch (e) { /* private mode */ }

    const count = $('#loaderCount');
    const img = $('.portrait__base', portrait);
    const decode = img && img.decode ? img.decode().catch(() => {}) : Promise.resolve();
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    let ready = false;
    Promise.race([Promise.all([decode, fonts]), new Promise(r => setTimeout(r, 4000))]).then(() => { ready = true; });

    const t0 = performance.now();
    let shown = 0;
    const step = now => {
      const t = clamp((now - t0) / 1300);
      const target = ready && t >= 1 ? 100 : easeOut(t) * 88;
      shown = Math.min(100, lerp(shown, target, 0.14) + 0.2);
      count.textContent = String(Math.floor(shown)).padStart(3, '0');
      if (shown < 99.6) {
        requestAnimationFrame(step);
        return;
      }
      count.textContent = '100';
      const dy = 0.082 * innerHeight;
      loader.style.setProperty('--slash-angle', `${-Math.atan2(dy, innerWidth)}rad`);
      loader.style.setProperty('--slash-w', `${Math.hypot(innerWidth, dy)}px`);
      setTimeout(() => loader.classList.add('is-cut'), 120);
      setTimeout(() => loader.classList.add('is-open'), 480);
      setTimeout(finishIntro, 640);
      setTimeout(() => loader.classList.add('is-done'), 1700);
    };
    requestAnimationFrame(step);
  }

  measure();
  requestAnimationFrame(frame);
  runIntro();
  if (document.fonts) document.fonts.ready.then(measure);
  addEventListener('load', measure);
})();
