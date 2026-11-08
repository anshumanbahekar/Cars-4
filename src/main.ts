import './style.css';
import './cars95.css';
import './mobile.css';
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
  graphics: string;
  sound: boolean;
  paused: boolean;
  settings?: Array<{label: string; value: string; description: string}>;
  levels?: Array<{name: string; laps: number; goal: number; locked: boolean; best: number}>;
  upgrades?: Array<{name: string; description: string; level: number; cost: number; affordable: boolean}>;
  credits?: number;
  place?: number;
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
      <p class="mobile-tip">On mobile: hold <b>GAS</b> on the right to drive forward. Use <b>LEFT</b> and <b>RIGHT</b> to steer.</p>
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
      <div class="hero-car"><img src="/lightning-mcqueen-official.jpeg" alt="Lightning McQueen, car number 95" /><div class="hero-image-caption"><span>THE LEGEND RETURNS</span><b>NO. 95</b></div></div>
      <div class="panel-heading"><span>READY TO RACE?</span><strong>YOU'RE UP NEXT.</strong></div>
      <div class="race-detail"><span>CIRCUIT</span><b id="race-track">Radiator Springs</b></div>
      <div class="race-detail"><span>FORMAT</span><b id="race-format">3 LAPS · NORMAL</b></div>
      <div class="panel-actions">
        <button data-key="KeyC"><span class="option-icon">🏆</span><span><b>CHAMPIONSHIP</b><small>Three races. One trophy.</small></span><span class="option-arrow">↗</span></button>
        <button data-key="KeyO"><span class="option-icon">⚙</span><span><b>RACE SETTINGS</b><small>Tracks, modes, weather & more.</small></span><span class="option-arrow">↗</span></button>
        <button data-key="KeyB"><span class="option-icon">◈</span><span><b id="graphics-label">3D GRAPHICS</b><small>Switch between 3D and classic views.</small></span><span class="option-arrow">↗</span></button>
        <button data-key="KeyM"><span class="option-icon">♫</span><span><b id="sound-label">SOUND ON</b><small>Engine, tyres, collisions and race cues.</small></span><span class="option-arrow">↗</span></button>
      </div>
      <div class="daily-card"><div><span class="daily-label">DAILY CHALLENGE <i>NEW</i></span><strong id="daily-title">Loading today's circuit…</strong><small id="daily-subtitle">Same course for everyone today</small></div><button id="daily-button" aria-label="Start daily challenge" disabled>→</button></div>
    </aside>
  </main>
  <footer class="site-footer" id="footer"><div><span class="keycap">↑↓←→</span> / WASD DRIVE <span class="footer-sep">·</span> <span class="keycap">SHIFT</span> NITRO <span class="footer-sep">·</span> <span class="keycap">SPACE</span> HANDBRAKE</div><div>BUILT FOR THE LOVE OF RACING <span class="footer-sep">●</span> V 1.0</div></footer>
  <div class="game-caption" id="game-caption" hidden><span class="caption-logo">95</span><span>CARS 4 <b>THE NEXT LAP</b></span><span class="caption-controls">P PAUSE · R RESTART · V CAMERA</span></div>
  <button class="audio-toggle" id="audio-toggle" data-key="KeyM" aria-label="Mute game audio" hidden>♫</button>
  <nav class="race-toolbar" id="race-toolbar" aria-label="Race controls" hidden>
    <button data-key="KeyP" aria-label="Pause race">Ⅱ <span>PAUSE</span></button>
    <button data-key="KeyV" aria-label="Change camera">◎ <span>CAMERA</span></button>
  </nav>
  <section class="touch-panel" id="touch-panel" aria-label="Game menu" hidden></section>
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
const audioToggle = app.querySelector<HTMLButtonElement>('#audio-toggle')!;
const raceToolbar = app.querySelector<HTMLElement>('#race-toolbar')!;
const touchPanel = app.querySelector<HTMLElement>('#touch-panel')!;
let lastPanelKind = '';

function renderTouchPanel(s: GameState): string {
  if (s.paused) return `<div class="touch-panel-card"><p class="touch-kicker">RACE CONTROL</p><h2>PAUSED</h2><p>Take a breath, then hit the track.</p><div class="touch-panel-actions"><button class="touch-primary" data-action="resume">RESUME RACE</button><button data-action="restart">RESTART RACE</button><button data-action="quit">BACK TO MENU</button></div></div>`;
  if (s.state === 'settings') return `<div class="touch-panel-card"><div class="touch-panel-top"><div><p class="touch-kicker">TUNE YOUR RACE</p><h2>SETTINGS</h2></div><button data-action="back">← BACK</button></div><p class="touch-panel-note">Tap the arrows to change each option.</p><div class="touch-list">${(s.settings ?? []).map((row, index) => `<div class="touch-setting"><div><b>${row.label}</b><small>${row.description}</small></div><div class="touch-stepper"><button data-action="setting" data-index="${index}" data-direction="-1" aria-label="Previous ${row.label}">‹</button><strong>${row.value}</strong><button data-action="setting" data-index="${index}" data-direction="1" aria-label="Next ${row.label}">›</button></div></div>`).join('')}</div><button class="touch-primary touch-done" data-action="back">SAVE & BACK</button></div>`;
  if (s.state === 'levels') return `<div class="touch-panel-card"><div class="touch-panel-top"><div><p class="touch-kicker">THE ROAD AHEAD</p><h2>CAREER</h2></div><button data-action="back">← BACK</button></div><p class="touch-panel-note">Choose an unlocked race to start.</p><div class="touch-list">${(s.levels ?? []).map((level, index) => `<button class="touch-level" data-action="level" data-index="${index}" ${level.locked ? 'disabled' : ''}><span class="touch-level-number">${String(index + 1).padStart(2, '0')}</span><span><b>${level.name}</b><small>${level.laps} laps · Finish top ${level.goal}${level.best ? ` · Best ${level.best}` : ''}</small></span><span class="touch-level-arrow">${level.locked ? '🔒' : '↗'}</span></button>`).join('')}</div></div>`;
  if (s.state === 'garage') return `<div class="touch-panel-card"><p class="touch-kicker">PIT STOP · ${s.credits ?? 0} CREDITS</p><h2>GARAGE</h2><p class="touch-panel-note">Upgrade your car for the next race.</p><div class="touch-list">${(s.upgrades ?? []).map((upgrade, index) => `<button class="touch-upgrade" data-action="upgrade" data-index="${index}" ${upgrade.level >= 3 || !upgrade.affordable ? 'disabled' : ''}><span><b>${upgrade.name} · LV ${upgrade.level}/3</b><small>${upgrade.description}</small></span><strong>${upgrade.level >= 3 ? 'MAX' : `${upgrade.cost} CR`}</strong></button>`).join('')}</div><button class="touch-primary touch-done" data-action="continue">CONTINUE →</button></div>`;
  if (s.state === 'done') return `<div class="touch-panel-card touch-result"><p class="touch-kicker">CHECKERED FLAG</p><h2>${s.place === 1 ? 'VICTORY!' : `P${s.place ?? '—'} FINISH`}</h2><p>${s.track} · ${s.laps} laps</p><div class="touch-panel-actions"><button class="touch-primary" data-action="continue">CONTINUE →</button><button data-action="quit">BACK TO MENU</button></div></div>`;
  if (s.state === 'final') return `<div class="touch-panel-card touch-result"><p class="touch-kicker">CHAMPIONSHIP COMPLETE</p><h2>THE FINAL LAP.</h2><div class="touch-panel-actions"><button class="touch-primary" data-action="continue">MAIN MENU →</button></div></div>`;
  return '';
}

touchPanel.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
  if (!button) return;
  window.dispatchEvent(new CustomEvent('cars4:action', {detail: {type: button.dataset.action, index: Number(button.dataset.index), direction: Number(button.dataset.direction)}}));
});
window.addEventListener('cars4:state', ((event: CustomEvent<GameState>) => {
  const s = event.detail;
  const onMenu = s.state === 'menu';
  menu.hidden = !onMenu;
  footer.hidden = !onMenu;
  caption.hidden = onMenu || s.state === 'settings' || s.state === 'levels';
  const panelOpen = s.paused || ['settings', 'levels', 'garage', 'done', 'final'].includes(s.state);
  touchPanel.hidden = !panelOpen;
  if (panelOpen) {
    const kind = s.paused ? 'paused' : s.state;
    touchPanel.innerHTML = renderTouchPanel(s);
    if (kind !== lastPanelKind) touchPanel.scrollTop = 0;
    lastPanelKind = kind;
  } else lastPanelKind = '';
  raceToolbar.hidden = panelOpen || (s.state !== 'race' && s.state !== 'count');
  audioToggle.hidden = onMenu || panelOpen;
  audioToggle.textContent = s.sound ? '♫' : '♪̸';
  audioToggle.setAttribute('aria-label', s.sound ? 'Mute game audio' : 'Enable game audio');
  document.body.classList.toggle('in-game', !onMenu);
  app.querySelector('#header-track')!.textContent = s.track.toUpperCase();
  app.querySelector('#race-track')!.textContent = s.track;
  app.querySelector('#race-format')!.textContent = `${s.laps} LAPS · ${s.mode.toUpperCase()} · ${s.difficulty.toUpperCase()}`;
  app.querySelector('#stat-races')!.textContent = String(s.races);
  app.querySelector('#stat-wins')!.textContent = String(s.wins);
  app.querySelector('#stat-drift')!.textContent = String(s.bestScore);
  app.querySelector('#graphics-label')!.textContent = `${s.graphics} GRAPHICS`;
  app.querySelector('#sound-label')!.textContent = s.sound ? 'SOUND ON' : 'SOUND OFF';
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
