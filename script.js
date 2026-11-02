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
// Easter egg: tap Miso 5 times quickly and he rolls belly-up
const sleepPose = document.getElementById('miso-sleep');
const rollPose = document.getElementById('miso-roll');
let taps = [], rolling = false;
document.getElementById('oyen-hit').addEventListener('click', () => {
  if (rolling) return;
  const now = Date.now();
  taps = taps.filter((t) => now - t < 3000).concat(now);
  if (taps.length >= 5) {
    taps = []; rolling = true; setAwake(false);
    sleepPose.style.display = 'none'; rollPose.style.display = '';
    setTimeout(() => { rollPose.style.display = 'none'; sleepPose.style.display = ''; rolling = false; }, 4500);
  } else {
    setAwake(!awake);
  }
});

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

// ---------- Phone menu ----------
const menuBtn = document.getElementById('menu-btn');
const navLinks = document.getElementById('nav-links');
function setMenu(open) {
  navLinks.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// ---------- Open now badge (Penang time) ----------
// PLACEHOLDER HOURS: replace with your real opening hours.
// 0 = Sunday ... 6 = Saturday. Use null for closed days. 24-hour "HH:MM".
const HOURS = {
  0: ['09:00', '18:00'],
  1: null,
  2: ['08:00', '18:00'],
  3: ['08:00', '18:00'],
  4: ['08:00', '18:00'],
  5: ['08:00', '18:00'],
  6: ['09:00', '18:00'],
};
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const pretty = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`;
};
function penangNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kuala_Lumpur', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { day: DAY_NAMES.indexOf(parts.weekday), min: Number(parts.hour) * 60 + Number(parts.minute) };
}
function openStatus() {
  const { day, min } = penangNow();
  const today = HOURS[day];
  if (today && min >= toMin(today[0]) && min < toMin(today[1])) {
    return { open: true, text: `Open now · closes ${pretty(today[1])}` };
  }
  if (today && min < toMin(today[0])) {
    return { open: false, text: `Closed · opens ${pretty(today[0])} today` };
  }
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    if (HOURS[d]) {
      const when = i === 1 ? 'tomorrow' : DAY_NAMES[d];
      return { open: false, text: `Closed, Miso is napping · opens ${pretty(HOURS[d][0])} ${when}` };
    }
  }
  return { open: false, text: 'Closed for now' };
}
function updateBadges() {
  const s = openStatus();
  document.querySelectorAll('[data-open-badge]').forEach((el) => {
    el.classList.toggle('is-open', s.open);
    el.querySelector('.txt').textContent = s.text;
  });
}
updateBadges();
setInterval(updateBadges, 60 * 1000);

// ---------- Miso FM: a lofi loop synthesised in the browser ----------
const radio = document.getElementById('radio');
const radioBtn = document.getElementById('radio-btn');
let audio = null, playing = false, schedTimer = null, nextBar = 0, barIndex = 0;
const BPM = 72, BEAT = 60 / BPM, BAR = BEAT * 4;
const CHORDS = [ // Fmaj7, Em7, Dm7, Cmaj7 (MIDI notes) + bass root
  { notes: [53, 57, 60, 64], bass: 41 },
  { notes: [52, 55, 59, 62], bass: 40 },
  { notes: [50, 53, 57, 60], bass: 38 },
  { notes: [48, 52, 55, 59], bass: 36 },
];
const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

function buildAudio() {
  const ac = new (window.AudioContext || window.webkitAudioContext)();
  // gentle compressor + limiter-ish ceiling so nothing clips on phone/laptop speakers
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 6;
  comp.attack.value = 0.005; comp.release.value = 0.25;
  comp.connect(ac.destination);
  const master = ac.createGain(); master.gain.value = 0; master.connect(comp);
  const warm = ac.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 1400; warm.connect(master);

  // noise buffer for hats + vinyl crackle
  const noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const crackleBuf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
  const cd = crackleBuf.getChannelData(0);
  for (let i = 0; i < cd.length; i++) cd[i] = Math.random() < 0.0004 ? (Math.random() * 2 - 1) * 0.4 : (Math.random() * 2 - 1) * 0.01;
  const crackle = ac.createBufferSource(); crackle.buffer = crackleBuf; crackle.loop = true;
  const cg = ac.createGain(); cg.gain.value = 0.18;
  const chp = ac.createBiquadFilter(); chp.type = 'bandpass'; chp.frequency.value = 2500; chp.Q.value = 0.6;
  crackle.connect(chp).connect(cg).connect(master); crackle.start();

  return { ac, master, warm, noise };
}

function note(a, m, t, dur, type, vol, dest) {
  const o = a.ac.createOscillator(), g = a.ac.createGain();
  o.type = type; o.frequency.value = freq(m); o.detune.value = (Math.random() - 0.5) * 12;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.06);
  g.gain.exponentialRampToValueAtTime(vol * 0.35, t + 0.8);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(dest); o.start(t); o.stop(t + dur + 0.05);
}
function kick(a, t) {
  const o = a.ac.createOscillator(), g = a.ac.createGain();
  // soft, rounded kick that small speakers can actually play (no sub-bass, no click)
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(65, t + 0.15);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.28, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(a.master); o.start(t); o.stop(t + 0.4);
}
function hat(a, t, vol) {
  const s = a.ac.createBufferSource(), f = a.ac.createBiquadFilter(), g = a.ac.createGain();
  s.buffer = a.noise; f.type = 'bandpass'; f.frequency.value = 7000; f.Q.value = 1;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  s.connect(f).connect(g).connect(a.master); s.start(t, Math.random()); s.stop(t + 0.08);
}
function scheduleBar(a, t) {
  const c = CHORDS[barIndex % CHORDS.length];
  c.notes.forEach((m, i) => note(a, m, t + i * 0.03, BAR * 0.98, 'sine', 0.045, a.warm)); // lazy strum, soft keys
  c.notes.forEach((m, i) => note(a, m + 12, t + i * 0.03, BAR * 0.6, 'triangle', 0.012, a.warm)); // a little shimmer
  note(a, c.bass + 12, t, BEAT * 1.8, 'triangle', 0.09, a.warm); // bass an octave up: warm, not boomy
  note(a, c.bass + 12, t + BEAT * 2.5, BEAT * 1.4, 'triangle', 0.07, a.warm);
  kick(a, t); kick(a, t + BEAT * 2.5);
  for (let i = 0; i < 8; i++) {
    const swing = i % 2 ? BEAT * 0.08 : 0; // a little lazy swing
    hat(a, t + i * (BEAT / 2) + swing, i % 2 ? 0.025 : 0.045);
  }
  barIndex++;
}
function scheduler() {
  while (nextBar < audio.ac.currentTime + 1.5) { scheduleBar(audio, nextBar); nextBar += BAR; }
}
async function setRadio(on) {
  if (on) {
    if (!audio) audio = buildAudio();
    await audio.ac.resume();
    nextBar = audio.ac.currentTime + 0.1;
    scheduler(); schedTimer = setInterval(scheduler, 300);
    audio.master.gain.cancelScheduledValues(audio.ac.currentTime);
    audio.master.gain.setValueAtTime(audio.master.gain.value, audio.ac.currentTime);
    audio.master.gain.linearRampToValueAtTime(0.6, audio.ac.currentTime + 1.5);
  } else if (audio) {
    clearInterval(schedTimer);
    audio.master.gain.cancelScheduledValues(audio.ac.currentTime);
    audio.master.gain.setValueAtTime(audio.master.gain.value, audio.ac.currentTime);
    audio.master.gain.linearRampToValueAtTime(0, audio.ac.currentTime + 0.6);
    // close the whole audio engine so leftover scheduled notes can't pile up on the next play
    const old = audio; audio = null;
    setTimeout(() => old.ac.close(), 700);
  }
  playing = on;
  radio.classList.toggle('playing', on);
  radioBtn.setAttribute('aria-pressed', String(on));
  radioBtn.setAttribute('aria-label', on ? 'Pause Miso FM' : 'Play Miso FM lofi radio');
}
radioBtn.addEventListener('click', () => setRadio(!playing));
