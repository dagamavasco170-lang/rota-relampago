import type { GameAction } from "./types";

export class InputController {
  private startX = 0;
  private startY = 0;
  private readonly onAction: (action: GameAction) => void;
  private readonly onPause: () => void;
  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, onAction: (action: GameAction) => void, onPause: () => void) {
    this.canvas = canvas;
    this.onAction = onAction;
    this.onPause = onPause;

    window.addEventListener("keydown", this.handleKeyDown);
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);
    this.canvas.addEventListener("contextmenu", this.preventContextMenu);

    document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
      button.addEventListener("pointerdown", this.handleActionButton);
    });
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    const actions: Record<string, GameAction> = {
      arrowleft: "left", a: "left",
      arrowright: "right", d: "right",
      arrowup: "jump", w: "jump", " ": "jump",
      arrowdown: "slide", s: "slide",
      shift: "dash", x: "dash"
    };
    const action = actions[key];
    if (action) {
      event.preventDefault();
      this.onAction(action);
      return;
    }
    if (key === "escape" || key === "p") {
      event.preventDefault();
      this.onPause();
    }
  };

  private handlePointerDown = (event: PointerEvent): void => {
    this.startX = event.clientX;
    this.startY = event.clientY;
  };

  private handlePointerUp = (event: PointerEvent): void => {
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) this.onAction(dx > 0 ? "right" : "left");
    else this.onAction(dy > 0 ? "slide" : "jump");
  };

  private handleActionButton = (event: PointerEvent): void => {
    event.preventDefault();
    const button = event.currentTarget as HTMLButtonElement;
    const action = button.dataset.action as GameAction | undefined;
    if (action) this.onAction(action);
  };

  private preventContextMenu = (event: Event): void => event.preventDefault();

  dispose(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("contextmenu", this.preventContextMenu);
    document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
      button.removeEventListener("pointerdown", this.handleActionButton);
    });
  }
}