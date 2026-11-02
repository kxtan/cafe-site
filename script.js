const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Pet Miso: wake him up (or let him sleep) ----------
const petBtn = document.getElementById('pet-btn');
const closed = document.getElementById('eyes-closed');
const open = document.getElementById('eyes-open');
let awake = false;

function setAwake(next) {
  awake = next;
  closed.style.display = awake ? 'none' : '';
  open.style.display = awake ? '' : 'none';
  petBtn.textContent = awake ? 'Let Miso sleep' : 'Pet Miso';
  clearTimeout(setAwake.t);
  if (awake) setAwake.t = setTimeout(() => setAwake(false), 5000); // he dozes off again
}
petBtn.addEventListener('click', () => setAwake(!awake));
document.getElementById('oyen-hit').addEventListener('click', () => setAwake(!awake));

// ---------- Rain: canvas drops + splash ripples ----------
const hero = document.querySelector('.hero');
const canvas = document.querySelector('.rain-canvas');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, drops = [], ripples = [], raining = true, heroVisible = true;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = hero.clientWidth; H = hero.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.round(W / 7);
  drops = Array.from({ length: count }, () => newDrop(true));
}
function newDrop(anywhere) {
  const speed = 6 + Math.random() * 8;
  return {
    x: Math.random() * (W + 60) - 30,
    y: anywhere ? Math.random() * H : -20 - Math.random() * H * 0.5,
    len: 10 + speed * 1.4,
    speed,
    alpha: 0.12 + Math.random() * 0.3,
    floor: H - 4 - Math.random() * 46, // land somewhere on the wet street
    active: raining,
  };
}
function tick() {
  requestAnimationFrame(tick);
  if (!heroVisible) return;
  ctx.clearRect(0, 0, W, H);
  ctx.lineCap = 'round';
  for (const d of drops) {
    if (!d.active) continue;
    d.y += d.speed; d.x -= d.speed * 0.12;
    if (d.y >= d.floor) {
      if (Math.random() < 0.6) ripples.push({ x: d.x, y: d.floor, r: 1, life: 1 });
      Object.assign(d, newDrop(false));
      continue;
    }
    ctx.strokeStyle = `rgba(200, 215, 255, ${d.alpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + d.len * 0.12, d.y - d.len);
    ctx.stroke();
  }
  ripples = ripples.filter((r) => r.life > 0);
  for (const r of ripples) {
    r.r += 0.45; r.life -= 0.035;
    ctx.strokeStyle = `rgba(210, 225, 255, ${r.life * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(r.x, r.y, r.r, r.r * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}
function setRain(on) {
  raining = on;
  // turning on: drops start falling from the top; turning off: drops finish and stop
  drops.forEach((d) => { if (on && !d.active) Object.assign(d, newDrop(false)); });
  if (!on) drops.forEach((d) => { d.active = d.y > 0 && d.y < d.floor; d.floor = d.active ? d.floor : 0; });
  if (!on) setTimeout(() => { if (!raining) drops.forEach((d) => (d.active = false)); }, 1200);
  rainBtn.setAttribute('aria-pressed', String(on));
  rainBtn.setAttribute('aria-label', on ? 'Turn rain off' : 'Turn rain on');
}

const rainBtn = document.getElementById('rain-btn');
rainBtn.addEventListener('click', () => setRain(!raining));

if (!reduceMotion) {
  resize();
  window.addEventListener('resize', resize);
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);
  tick();
} else {
  rainBtn.hidden = true;
}

// ---------- Day / night ----------
const modeBtn = document.getElementById('mode-btn');
const title = document.getElementById('hero-title');
function setDay(day) {
  document.body.classList.toggle('day', day);
  title.textContent = day ? 'Slow coffee for sleepy afternoons.' : 'Slow coffee for rainy afternoons.';
  modeBtn.setAttribute('aria-label', day ? 'Switch to night-time' : 'Switch to daytime');
  if (!reduceMotion) setRain(!day);
}
modeBtn.addEventListener('click', () => setDay(!document.body.classList.contains('day')));

// Start in the mode that matches the time in Penang (7am to 7pm = day)
const penangHour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kuala_Lumpur' }).format(new Date()));
setDay(penangHour >= 7 && penangHour < 19);

// ---------- Fade sections in as you scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal, .peek').forEach((el) => io.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();
