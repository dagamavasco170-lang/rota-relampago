import "./style.css";
import { AudioManager } from "./game/AudioManager";
import { InputController } from "./game/InputController";
import { Runner3D } from "./game/Runner3D";
import { SaveManager } from "./game/SaveManager";
import { RunnerGame, type GameStats as LegacyGameStats } from "./game";
import type { GameAction, GameStats } from "./game/types";
import type { StageDefinition } from "./game/LevelManager";

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
const stageNameEl = byId<HTMLElement>("stage-name");
const stageHintEl = byId<HTMLElement>("stage-hint");
const stageProgressEl = byId<HTMLElement>("stage-progress");
const energyEl = byId<HTMLElement>("energy");
const toastEl = byId<HTMLElement>("game-toast");

const save = new SaveManager();
const audio = new AudioManager();
let best = save.getBest();
let game3D: Runner3D | null = null;
let legacyGame: RunnerGame | null = null;
let toastTimer = 0;

bestEl.textContent = best.toLocaleString("pt-BR");

function show(element: HTMLElement): void {
  element.classList.remove("hidden");
}

function hide(element: HTMLElement): void {
  element.classList.add("hidden");
}

function showMessage(message: string): void {
  toastEl.textContent = message;
  show(toastEl);
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => hide(toastEl), 1500);
}

function updateStats(stats: GameStats | LegacyGameStats): void {
  scoreEl.textContent = stats.score.toLocaleString("pt-BR").padStart(6, "0");
  distanceEl.textContent = stats.distance.toLocaleString("pt-BR");
  coinsEl.textContent = stats.coins.toString();
  if ("energy" in stats) {
    energyEl.textContent = "♥".repeat(stats.energy) + "♡".repeat(3 - stats.energy);
    stageNameEl.textContent = stats.stageName;
    stageProgressEl.style.width = Math.round(stats.stageProgress * 100) + "%";
  } else {
    energyEl.textContent = "♥♥♥";
    stageNameEl.textContent = "Modo clássico";
  }
}

function handleStageChanged(stage: StageDefinition): void {
  stageNameEl.textContent = stage.name;
  stageHintEl.textContent = stage.subtitle;
  stageProgressEl.style.width = "0%";
  showMessage("NOVA ÁREA: " + stage.name.toUpperCase());
}

function handleGameOver(stats: GameStats | LegacyGameStats): void {
  const stageIndex = "stageIndex" in stats ? stats.stageIndex : 0;
  best = save.recordRun(stats.score, stats.coins, stageIndex);
  bestEl.textContent = best.toLocaleString("pt-BR");
  byId<HTMLElement>("final-score").textContent = stats.score.toLocaleString("pt-BR");
  byId<HTMLElement>("final-distance").textContent = stats.distance.toLocaleString("pt-BR") + " m";
  byId<HTMLElement>("final-coins").textContent = stats.coins.toString();
  byId<HTMLElement>("final-best").textContent = best.toLocaleString("pt-BR");
  show(gameOverScreen);
  pauseButton.disabled = true;
  audio.stopMusic();
}

try {
  game3D = new Runner3D(canvas, {
    onStats: updateStats,
    onGameOver: handleGameOver,
    onStageChanged: handleStageChanged,
    onMessage: showMessage,
    playSound: (sound) => audio.play(sound)
  });
  document.body.classList.add("three-dimensional");
} catch (error) {
  console.warn("WebGL indisponível; ativando o modo clássico 2D.", error);
  document.body.classList.add("classic-fallback");
  stageHintEl.textContent = "Modo de compatibilidade ativado para este aparelho.";
  game3D = null;
  legacyGame = new RunnerGame(canvas, {
    onStats: updateStats,
    onGameOver: handleGameOver,
    playSound: (sound) => audio.play(sound)
  });
}

const controls = new InputController(
  canvas,
  (action: GameAction) => {
    if (game3D) game3D.act(action);
    else legacyGame?.act(action);
  },
  () => togglePause()
);

function startGame(): void {
  hide(startScreen);
  hide(pauseScreen);
  hide(gameOverScreen);
  pauseButton.disabled = false;
  pauseButton.textContent = "Ⅱ";
  if (game3D) game3D.start();
  else legacyGame?.start();
  audio.startMusic();
}

function togglePause(): void {
  const running = game3D ? game3D.isRunning : Boolean(legacyGame?.isRunning);
  const paused = game3D ? game3D.isPaused : Boolean(legacyGame?.isPaused);
  if (running) {
    game3D ? game3D.pause() : legacyGame?.pause();
    show(pauseScreen);
    pauseButton.textContent = "▶";
    audio.stopMusic();
  } else if (paused) {
    game3D ? game3D.resume() : legacyGame?.resume();
    hide(pauseScreen);
    pauseButton.textContent = "Ⅱ";
    audio.startMusic();
  }
}

startButton.addEventListener("click", startGame);
againButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
resumeButton.addEventListener("click", togglePause);
pauseButton.addEventListener("click", togglePause);

soundButton.addEventListener("click", () => {
  audio.setEnabled(!audio.isEnabled);
  soundButton.textContent = audio.isEnabled ? "♫" : "♪";
  soundButton.classList.toggle("muted", !audio.isEnabled);
  soundButton.setAttribute("aria-label", audio.isEnabled ? "Desativar som" : "Ativar som");
  if (audio.isEnabled) audio.play("power");
});

document.addEventListener("visibilitychange", () => {
  const running = game3D ? game3D.isRunning : Boolean(legacyGame?.isRunning);
  if (document.hidden && running) togglePause();
});

window.addEventListener("beforeunload", () => {
  controls.dispose();
  game3D?.dispose();
  audio.dispose();
});