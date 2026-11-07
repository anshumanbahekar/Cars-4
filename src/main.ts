import './style.css';
import { loadChallenge, type DailyChallenge } from './challenge';
import './game/engine';

interface GameState {
  state: 'menu' | 'count' | 'race' | 'done' | 'settings' | 'levels' | 'garage' | 'final';
  track: string;
  laps: number;
  mode: string;
  difficulty: string;
  races: number;
  wins: number;
  bestScore: number;
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('App container missing');

app.innerHTML = `
  <header class="site-header">
    <div class="brand"><span class="brand-mark">95</span><span class="brand-text">CARS <b>4</b><small>THE NEXT LAP</small></span></div>
    <div class="header-right"><span class="live-dot"></span><span>ARCADE RACING EXPERIENCE</span><span class="header-divider"></span><span id="header-track">RADIATOR SPRINGS</span></div>
  </header>
  <main class="menu" id="menu">
    <section class="intro" aria-labelledby="main-title">
      <div class="eyebrow"><span class="eyebrow-line"></span> THE LEGEND CONTINUES <span class="eyebrow-index">01 / 04</span></div>
      <h1 id="main-title">THE NEXT <em>LAP.</em></h1>
      <p class="intro-copy">A new chapter on the track. Outrun your rivals, master every corner, and take the road to racing glory.</p>
      <div class="action-row">
        <button class="primary-button" data-key="Enter"><span class="button-icon">▶</span> QUICK RACE <span class="button-arrow">↗</span></button>
        <button class="secondary-button" data-key="KeyG">EXPLORE CAREER <span>→</span></button>
      </div>
      <div class="race-stats" aria-label="Your racing statistics">
        <div><strong id="stat-races">0</strong><span>RACES</span></div>
        <div><strong id="stat-wins">0</strong><span>WINS</span></div>
        <div><strong id="stat-drift">0</strong><span>BEST DRIFT</span></div>
      </div>
      <p class="intro-credit">An original arcade racing fan project built from your Hairpin game.</p>
    </section>
    <aside class="race-panel" aria-label="Race options">
      <div class="panel-top"><span>THE GRID</span><span>CHOOSE YOUR ROAD <b>↗</b></span></div>
      <div class="hero-car"><div class="car-ring"></div><img src="/cars/car0.webp" alt="Red racing car" /><div class="car-number">95</div></div>
      <div class="panel-heading"><span>READY TO RACE?</span><strong>YOU'RE UP NEXT.</strong></div>
      <div class="race-detail"><span>CIRCUIT</span><b id="race-track">Radiator Springs</b></div>
      <div class="race-detail"><span>FORMAT</span><b id="race-format">3 LAPS · NORMAL</b></div>
      <div class="panel-actions">
        <button data-key="KeyC"><span class="option-icon">🏆</span><span><b>CHAMPIONSHIP</b><small>Three races. One trophy.</small></span><span class="option-arrow">↗</span></button>
        <button data-key="KeyO"><span class="option-icon">⚙</span><span><b>RACE SETTINGS</b><small>Tracks, modes, weather & more.</small></span><span class="option-arrow">↗</span></button>
      </div>
      <div class="daily-card"><div><span class="daily-label">DAILY CHALLENGE <i>NEW</i></span><strong id="daily-title">Loading today's circuit…</strong><small id="daily-subtitle">Same course for everyone today</small></div><button id="daily-button" aria-label="Start daily challenge" disabled>→</button></div>
    </aside>
  </main>
  <footer class="site-footer" id="footer"><div><span class="keycap">↑↓←→</span> / WASD DRIVE <span class="footer-sep">·</span> <span class="keycap">SHIFT</span> NITRO <span class="footer-sep">·</span> <span class="keycap">SPACE</span> HANDBRAKE</div><div>BUILT FOR THE LOVE OF RACING <span class="footer-sep">●</span> V 1.0</div></footer>
  <div class="game-caption" id="game-caption" hidden><span class="caption-logo">95</span><span>CARS 4 <b>THE NEXT LAP</b></span><span class="caption-controls">P PAUSE · R RESTART · V CAMERA</span></div>
`;

function tapKey(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
  document.querySelector<HTMLCanvasElement>('#c')?.focus();
}

app.querySelectorAll<HTMLButtonElement>('[data-key]').forEach((button) => {
  button.addEventListener('click', () => tapKey(button.dataset.key!));
});

const menu = app.querySelector<HTMLElement>('#menu')!;
const footer = app.querySelector<HTMLElement>('#footer')!;
const caption = app.querySelector<HTMLElement>('#game-caption')!;
window.addEventListener('cars4:state', ((event: CustomEvent<GameState>) => {
  const s = event.detail;
  const onMenu = s.state === 'menu';
  menu.hidden = !onMenu;
  footer.hidden = !onMenu;
  caption.hidden = onMenu || s.state === 'settings' || s.state === 'levels';
  document.body.classList.toggle('in-game', !onMenu);
  app.querySelector('#header-track')!.textContent = s.track.toUpperCase();
  app.querySelector('#race-track')!.textContent = s.track;
  app.querySelector('#race-format')!.textContent = `${s.laps} LAPS · ${s.mode.toUpperCase()} · ${s.difficulty.toUpperCase()}`;
  app.querySelector('#stat-races')!.textContent = String(s.races);
  app.querySelector('#stat-wins')!.textContent = String(s.wins);
  app.querySelector('#stat-drift')!.textContent = String(s.bestScore);
}) as EventListener);

let daily: DailyChallenge | null = null;
const dailyButton = app.querySelector<HTMLButtonElement>('#daily-button')!;
dailyButton.addEventListener('click', () => {
  if (!daily) return;
  window.dispatchEvent(new CustomEvent('cars4:daily', { detail: daily }));
});

void loadChallenge().then((challenge) => {
  daily = challenge;
  app.querySelector('#daily-title')!.textContent = challenge.title;
  const weather = ['CLEAR SKIES', 'WET TRACK', 'NIGHT RACE'][challenge.weather];
  app.querySelector('#daily-subtitle')!.textContent = `${weather} · 3 LAPS · ${challenge.date}`;
  dailyButton.disabled = false;
});
