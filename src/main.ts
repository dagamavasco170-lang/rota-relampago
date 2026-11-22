import "./style.css";
import { RunnerGame, type GameAction, type GameStats } from "./game";

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error("Elemento da interface não encontrado: " + id);
  return element as T;
};

const canvas = byId<HTMLCanvasElement>("game-canvas");
const startScreen = byId<HTMLDivElement>("start-screen");
const pauseScreen = byId<HTMLDivElement>("pause-screen");
const gameOverScreen = byId<HTMLDivElement>("game-over-screen");
const pauseButton = byId<HTMLButtonElement>("pause-button");
const soundButton = byId<HTMLButtonElement>("sound-button");
const startButton = byId<HTMLButtonElement>("start-button");
const resumeButton = byId<HTMLButtonElement>("resume-button");
const restartButton = byId<HTMLButtonElement>("restart-button");
const againButton = byId<HTMLButtonElement>("again-button");

const scoreEl = byId<HTMLElement>("score");
const distanceEl = byId<HTMLElement>("distance");
const coinsEl = byId<HTMLElement>("coins");
const bestEl = byId<HTMLElement>("menu-best");

const BEST_KEY = "rota-relampago-best-v1";
let best = readBest();
let soundEnabled = true;
let audio: AudioContext | null = null;

bestEl.textContent = best.toLocaleString("pt-BR");

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY) || 0);
  } catch {
    return 0;
  }
}

function saveBest(value: number): void {
  best = Math.max(best, value);
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch {
    // O jogo continua funcionando mesmo quando o armazenamento está indisponível.
  }
  bestEl.textContent = best.toLocaleString("pt-BR");
}

function tone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.045): void {
  if (!soundEnabled) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  } catch {
    // Alguns navegadores bloqueiam áudio até a primeira interação.
  }
}

function playSound(kind: "coin" | "jump" | "crash" | "power"): void {
  if (kind === "coin") {
    tone(880, 0.09, "sine", 0.035);
    window.setTimeout(() => tone(1180, 0.11, "sine", 0.025), 55);
  } else if (kind === "jump") {
    tone(310, 0.16, "triangle", 0.035);
  } else if (kind === "power") {
    tone(560, 0.12, "sine", 0.04);
    window.setTimeout(() => tone(920, 0.2, "sine", 0.03), 80);
  } else {
    tone(120, 0.35, "sawtooth", 0.055);
  }
}

function updateHud(stats: GameStats): void {
  scoreEl.textContent = stats.score.toString().padStart(6, "0");
  distanceEl.textContent = stats.distance.toLocaleString("pt-BR");
  coinsEl.textContent = stats.coins.toString();
}

function show(element: HTMLElement): void {
  element.classList.remove("hidden");
}

function hide(element: HTMLElement): void {
  element.classList.add("hidden");
}

const game = new RunnerGame(canvas, {
  onStats: updateHud,
  playSound,
  onGameOver: (stats) => {
    saveBest(stats.score);
    byId<HTMLElement>("final-score").textContent = stats.score.toLocaleString("pt-BR");
    byId<HTMLElement>("final-distance").textContent = stats.distance.toLocaleString("pt-BR") + " m";
    byId<HTMLElement>("final-coins").textContent = stats.coins.toString();
    byId<HTMLElement>("final-best").textContent = best.toLocaleString("pt-BR");
    show(gameOverScreen);
    pauseButton.disabled = true;
  }
});

function startGame(): void {
  hide(startScreen);
  hide(pauseScreen);
  hide(gameOverScreen);
  pauseButton.disabled = false;
  pauseButton.textContent = "Ⅱ";
  game.start();
}

function togglePause(): void {
  if (game.isRunning) {
    game.pause();
    show(pauseScreen);
    pauseButton.textContent = "▶";
  } else if (game.isPaused) {
    game.resume();
    hide(pauseScreen);
    pauseButton.textContent = "Ⅱ";
  }
}

startButton.addEventListener("click", startGame);
againButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
resumeButton.addEventListener("click", togglePause);
pauseButton.addEventListener("click", togglePause);

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "♫" : "♪";
  soundButton.classList.toggle("muted", !soundEnabled);
  soundButton.setAttribute("aria-label", soundEnabled ? "Desativar som" : "Ativar som");
  if (soundEnabled) tone(660, 0.1);
});

function perform(action: GameAction): void {
  game.act(action);
}

const keyMap: Record<string, GameAction> = {
  ArrowLeft: "left",
  a: "left",
  A: "left",
  ArrowRight: "right",
  d: "right",
  D: "right",
  ArrowUp: "jump",
  w: "jump",
  W: "jump",
  " ": "jump",
  ArrowDown: "slide",
  s: "slide",
  S: "slide"
};

window.addEventListener("keydown", (event) => {
  const action = keyMap[event.key];
  if (action) {
    event.preventDefault();
    perform(action);
  } else if (event.key === "Escape" || event.key.toLowerCase() === "p") {
    event.preventDefault();
    togglePause();
  } else if (event.key === "Enter" && !game.isRunning && !game.isPaused) {
    startGame();
  }
});

document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const action = button.dataset.action as GameAction | undefined;
    if (action) perform(action);
  });
});

let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener("pointerdown", (event) => {
  touchStartX = event.clientX;
  touchStartY = event.clientY;
});
canvas.addEventListener("pointerup", (event) => {
  const dx = event.clientX - touchStartX;
  const dy = event.clientY - touchStartY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) perform(dx > 0 ? "right" : "left");
  else perform(dy > 0 ? "slide" : "jump");
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && game.isRunning) togglePause();
});

window.addEventListener("beforeunload", () => {
  if (audio) void audio.close();
});