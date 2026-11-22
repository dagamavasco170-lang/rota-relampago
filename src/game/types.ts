import type { StageDefinition } from "./LevelManager";

export type GameAction = "left" | "right" | "jump" | "slide" | "dash";

export interface GameStats {
  score: number;
  distance: number;
  coins: number;
  speed: number;
  energy: number;
  stageIndex: number;
  stageName: string;
  stageProgress: number;
}

export interface GameCallbacks {
  onStats: (stats: GameStats) => void;
  onGameOver: (stats: GameStats) => void;
  onStageChanged: (stage: StageDefinition) => void;
  onMessage: (message: string) => void;
  playSound: (sound: "coin" | "jump" | "slide" | "crash" | "power" | "dash" | "stage") => void;
}