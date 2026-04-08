 // ========== BLEACH PORTFOLIO — SPIRITUAL PRESSURE ENGINE v2 ==========

// ===== Loading Screen — Soul Society Gate =====
window.addEventListener('load', () => {
  setTimeout(() => {
    const ls = document.getElementById('loadingScreen');
    ls.classList.add('open');
    setTimeout(() => { ls.style.display = 'none'; }, 1400);
  }, 1200);
});

// ===== Custom Cursor + Spirit Particle Trail =====
const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursorTrail');
let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

if (window.innerWidth > 768) {
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
    if (Math.random() < 0.25) createSpiritParticle(mouseX, mouseY);
  });

  function animateTrail() {
    trailX += (mouseX - trailX) * 0.15;
    trailY += (mouseY - trailY) * 0.15;
    trail.style.left = trailX + 'px';
    trail.style.top = trailY + 'px';
    requestAnimationFrame(animateTrail);
  }
  animateTrail();

  const clickables = document.querySelectorAll('a, button, .btn, .skill-tag, .project-card, input, textarea');
  clickables.forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });

  function createSpiritParticle(x, y) {
    const p = document.createElement('div');
    p.style.cssText = `position:fixed;left:${x}px;top:${y}px;z-index:9999;width:3px;height:3px;background:rgba(255,255,255,0.5);border-radius:50%;pointer-events:none;transition:all 1s ease-out;`;
    document.body.appendChild(p);
    requestAnimationFrame(() => {
      p.style.transform = `translate(${(Math.random()-0.5)*60}px, ${(Math.random()-0.5)*60}px)`;
      p.style.opacity = '0';
    });
    setTimeout(() => p.remove(), 1000);
  }
}

// ===== Typing Animation =====
const typingPhrases = [
  "build scalable ML solutions.",
  "love time-series forecasting.",
  "engineer LLM pipelines.",
  "optimize with Bayesian methods.",
  "publish research at IEEE.",
  "craft intelligent AI systems.",
  "wield Zangetsu on data."
];
let phraseIdx = 0, charIdx = 0, isDeleting = false;
const typingEl = document.getElementById('typingText');

function typeEffect() {
  const current = typingPhrases[phraseIdx];
  if (isDeleting) {
    typingEl.textContent = current.substring(0, charIdx--);
    if (charIdx < 0) { isDeleting = false; phraseIdx = (phraseIdx + 1) % typingPhrases.length; }
    setTimeout(typeEffect, 25);
  } else {
    typingEl.textContent = current.substring(0, charIdx++);
    if (charIdx > current.length) { isDeleting = true; setTimeout(typeEffect, 2000); }
    else setTimeout(typeEffect, 55);
  }
}
typeEffect();

// ===== Navbar =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('active'));
});

// ===== Scroll Animations =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('[data-aos]').forEach(el => observer.observe(el));

const slashObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('visible'); slashObserver.unobserve(entry.target); }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.sword-slash-divider').forEach(el => slashObserver.observe(el));

// ===== Stats Counter =====
let statsCounted = false;
const statCards = document.querySelectorAll('.stat-card');
function animateCounters() {
  statCards.forEach(card => {
    const target = parseInt(card.dataset.count);
    const numEl = card.querySelector('.stat-number');
    const duration = 1500, start = performance.now();
    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const current = Math.floor((1 - Math.pow(1 - progress, 3)) * target);
      numEl.textContent = current;
      if (progress < 1) requestAnimationFrame(update);
      else numEl.textContent = target;
    }
    requestAnimationFrame(update);
  });
}
const statsGrid = document.querySelector('.stats-grid');
if (statsGrid) {
  new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting && !statsCounted) { statsCounted = true; animateCounters(); } });
  }, { threshold: 0.3 }).observe(statsGrid);
}

// ===== Manga SFX =====
const sfxOverlay = document.getElementById('sfxOverlay');
const sfxTexts = ['BANKAI', 'SWISH', 'CLANG', '斬月', 'SLASH', '卍解'];
let sfxCooldown = false;

function showSFX(text, x, y) {
  if (sfxCooldown) return;
  sfxCooldown = true;
  sfxOverlay.textContent = text || sfxTexts[Math.floor(Math.random() * sfxTexts.length)];
  sfxOverlay.style.left = (x || window.innerWidth / 2) - 100 + 'px';
  sfxOverlay.style.top = (y || window.innerHeight / 2) - 50 + 'px';
  sfxOverlay.classList.remove('show');
  void sfxOverlay.offsetWidth;
  sfxOverlay.classList.add('show');
  setTimeout(() => { sfxCooldown = false; }, 2000);
}

document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mouseenter', e => showSFX(null, e.clientX, e.clientY));
});

// ===== Reiatsu Particles in Hero =====
const particleContainer = document.getElementById('reiatsuParticles');
for (let i = 0; i < 30; i++) {
  const p = document.createElement('div');
  const size = Math.random() * 3 + 1;
  p.style.cssText = `position:absolute;left:${Math.random()*100}%;bottom:-10px;width:${size}px;height:${size}px;background:rgba(255,255,255,${Math.random()*0.2+0.05});border-radius:50%;animation:particleRise ${Math.random()*6+4}s ${Math.random()*4}s linear infinite;pointer-events:none;`;
  particleContainer.appendChild(p);
}
const pStyle = document.createElement('style');
pStyle.textContent = `@keyframes particleRise{0%{transform:translateY(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-100vh) translateX(${Math.random()*40-20}px);opacity:0}}`;
document.head.appendChild(pStyle);

// ===== Hell Butterflies =====
const butterfliesContainer = document.getElementById('hellButterflies');
for (let i = 0; i < 5; i++) {
  const b = document.createElement('span');
  b.className = 'hell-butterfly';
  b.textContent = '🦋';
  b.style.left = Math.random() * 100 + '%';
  b.style.animationDelay = Math.random() * 6 + 's';
  b.style.animationDuration = (6 + Math.random() * 4) + 's';
  b.style.filter = 'grayscale(1) brightness(0.4)';
  butterfliesContainer.appendChild(b);
}

// ===== Contact Form =====
document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  showSFX('送信完了', window.innerWidth / 2, window.innerHeight / 2);
  const btn = e.target.querySelector('button[type="submit"]');
  btn.querySelector('.btn-text').textContent = '卍 Message Sent!';
  setTimeout(() => { btn.querySelector('.btn-text').textContent = 'Send Hell Butterfly'; e.target.reset(); }, 3000);
});



// ===== Active Nav Link =====
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  const scrollPos = window.scrollY + 150;
  sections.forEach(section => {
    const top = section.offsetTop, height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = document.querySelector(`.nav-links a[href="#${id}"]`);
    if (link) link.style.color = (scrollPos >= top && scrollPos < top + height) ? '#F5F5F5' : '';
  });
});


// ================================================================
// ===== ICHIGO EVOLUTION ENGINE — Scroll-Based Transformation =====
// ================================================================

const ichigoContainer = document.getElementById('ichigoContainer');
const ichigoLabel = document.getElementById('ichigoLabel');
const ichigoParticlesEl = document.getElementById('ichigoParticles');

// SVG element groups
const shikaiSword = document.querySelector('.ichigo-zangetsu-shikai');
const bankaiCoat = document.querySelector('.ichigo-bankai-coat');
const tensaZangetsu = document.querySelector('.ichigo-tensa-zangetsu');
const hollowMask = document.querySelector('.ichigo-hollow-mask');
const mugetsuHair = document.querySelector('.ichigo-mugetsu-hair');
const normalHair = document.querySelector('.ichigo-hair');
const ichigoRobe = document.querySelector('.ichigo-robe');
const ichigoEyes = document.querySelectorAll('.ichigo-pupil');
const ichigoAura1 = document.querySelector('.ichigo-aura-1');
const ichigoAura2 = document.querySelector('.ichigo-aura-2');

const stageLabels = [
  'SUBSTITUTE SHINIGAMI',
  'SHIKAI — ZANGETSU',
  'BANKAI — TENSA ZANGETSU',
  'VIZARD — HOLLOW MASK',
  'MUGETSU — FINAL GETSUGA'
];

let currentStage = 0;
let particleInterval = null;

function getScrollStage() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = Math.min(scrollTop / docHeight, 1);
  if (pct < 0.15) return 0;      // Hero
  if (pct < 0.35) return 1;      // Skills — Shikai
  if (pct < 0.55) return 2;      // Projects — Bankai
  if (pct < 0.78) return 3;      // Experience — Vizard
  return 4;                       // Footer — Mugetsu
}

function setOpacity(el, val) { if (el) el.style.opacity = val; }

function applyStage(stage) {
  // Reset all layers
  setOpacity(shikaiSword, 0);
  setOpacity(bankaiCoat, 0);
  setOpacity(tensaZangetsu, 0);
  setOpacity(hollowMask, 0);
  setOpacity(mugetsuHair, 0);
  setOpacity(normalHair, 1);
  setOpacity(ichigoAura1, 0);
  setOpacity(ichigoAura2, 0);

  // Reset robe color
  if (ichigoRobe) { ichigoRobe.style.stroke = '#E0E0E0'; ichigoRobe.style.fill = 'none'; }
  ichigoEyes.forEach(e => { e.style.fill = '#0A0A0A'; e.setAttribute('r', '2.5'); });

  // Remove old stage classes
  for (let i = 1; i <= 5; i++) ichigoContainer.classList.remove('stage-' + i);
  ichigoContainer.classList.add('stage-' + (stage + 1));

  // Apply stage-specific transforms
  switch (stage) {
    case 0: // Substitute Shinigami — base
      break;
    case 1: // Shikai
      setOpacity(shikaiSword, 1);
      setOpacity(ichigoAura1, 0.15);
      break;
    case 2: // Bankai
      setOpacity(tensaZangetsu, 1);
      setOpacity(bankaiCoat, 1);
      setOpacity(ichigoAura1, 0.3);
      setOpacity(ichigoAura2, 0.15);
      if (ichigoRobe) { ichigoRobe.style.stroke = '#fff'; }
      break;
    case 3: // Vizard / Hollow Mask
      setOpacity(tensaZangetsu, 1);
      setOpacity(bankaiCoat, 1);
      setOpacity(hollowMask, 1);
      setOpacity(ichigoAura1, 0.5);
      setOpacity(ichigoAura2, 0.3);
      if (ichigoRobe) { ichigoRobe.style.stroke = '#fff'; }
      ichigoEyes.forEach(e => { e.style.fill = '#FFD700'; e.setAttribute('r', '3'); });
      break;
    case 4: // Mugetsu
      setOpacity(mugetsuHair, 1);
      setOpacity(normalHair, 0);
      setOpacity(bankaiCoat, 1);
      setOpacity(ichigoAura1, 0.7);
      setOpacity(ichigoAura2, 0.5);
      if (ichigoRobe) { ichigoRobe.style.stroke = '#555'; ichigoRobe.style.fill = 'rgba(30,30,30,0.6)'; }
      ichigoEyes.forEach(e => { e.style.fill = '#000'; e.setAttribute('r', '4'); });
      break;
  }

  ichigoLabel.textContent = stageLabels[stage];
  updateIchigoParticles(stage);
}

function updateIchigoParticles(stage) {
  // Clear old
  if (particleInterval) clearInterval(particleInterval);
  ichigoParticlesEl.innerHTML = '';

  const density = [2, 5, 10, 16, 25][stage]; // particles per batch
  const colors = stage < 3 ? ['#fff', '#ccc'] : stage === 3 ? ['#fff', '#ccc', '#ff4444'] : ['#333', '#555', '#fff'];

  particleInterval = setInterval(() => {
    if (ichigoParticlesEl.children.length > 40) return; // cap
    for (let i = 0; i < density / 3; i++) {
      const p = document.createElement('div');
      p.className = 'ichigo-particle';
      const s = Math.random() * 3 + 1;
      const c = colors[Math.floor(Math.random() * colors.length)];
      const x = Math.random() * 220 - 30;
      const y = Math.random() * 380;
      p.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${s}px;background:${c};opacity:0;animation-delay:${Math.random()*2}s;animation-duration:${2+Math.random()*3}s;`;
      ichigoParticlesEl.appendChild(p);
      setTimeout(() => p.remove(), 5000);
    }
  }, 600);
}

function onIchigoScroll() {
  const newStage = getScrollStage();
  if (newStage !== currentStage) {
    // Trigger transition burst
    ichigoContainer.classList.add('transitioning');
    setTimeout(() => ichigoContainer.classList.remove('transitioning'), 400);
    // Show SFX for major transitions
    if (newStage > currentStage && newStage >= 2) {
      const sfxMap = ['', '', 'BANKAI', '虚化', '無月'];
      showSFX(sfxMap[newStage], window.innerWidth - 200, window.innerHeight / 2);
    }
    currentStage = newStage;
    applyStage(currentStage);
  }
}

// Getsuga Tensho hover interaction
if (window.innerWidth > 768) {
  // Create getsuga slash overlay
  const getsugaSlash = document.createElement('div');
  getsugaSlash.className = 'ichigo-getsuga-slash';
  document.body.appendChild(getsugaSlash);

  ichigoContainer.style.pointerEvents = 'auto';
  ichigoContainer.addEventListener('mouseenter', () => {
    cursor && cursor.classList.add('hover');
    getsugaSlash.classList.remove('active');
    void getsugaSlash.offsetWidth;
    getsugaSlash.classList.add('active');
    showSFX('月牙天衝', window.innerWidth / 2, window.innerHeight / 2);
    setTimeout(() => getsugaSlash.classList.remove('active'), 700);
  });
  ichigoContainer.addEventListener('mouseleave', () => {
    cursor && cursor.classList.remove('hover');
  });
}

// Init Ichigo
window.addEventListener('scroll', onIchigoScroll, { passive: true });
applyStage(0);
