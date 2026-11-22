import * as THREE from "three";
import { LevelManager } from "./LevelManager";
import { ObstacleManager } from "./ObstacleManager";
import { Player } from "./Player";
import { World } from "./World";
import type { GameAction, GameCallbacks, GameStats } from "./types";

export class Runner3D {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(58, 1, 0.1, 260);
  private readonly world: World;
  private readonly player: Player;
  private readonly obstacles: ObstacleManager;
  private readonly levels = new LevelManager();
  private readonly callbacks: GameCallbacks;
  private animationFrame = 0;
  private lastFrame = 0;
  private statsClock = 0;
  private running = false;
  private paused = false;
  private ended = false;
  private elapsed = 0;
  private distance = 0;
  private coins = 0;
  private score = 0;
  private energy = 3;
  private speed = 17;
  private invulnerability = 0;
  private dashTime = 0;
  private dashCooldown = 0;
  private stageId = -1;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.callbacks = callbacks;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(canvas.clientWidth || 640, canvas.clientHeight || 480, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = false;

    this.scene.fog = new THREE.Fog(0x9ab9c4, 40, 180);
    this.camera.position.set(0, 7.4, 14.5);
    this.camera.lookAt(0, 1.1, -7);
    this.world = new World(this.scene);
    this.player = new Player(this.scene);
    this.obstacles = new ObstacleManager(this.scene);

    window.addEventListener("resize", this.handleResize);
    this.handleResize();
    this.renderer.render(this.scene, this.camera);
  }

  private handleResize = (): void => {
    const canvas = this.renderer.domElement;
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(width, height, false);
  };

  start(): void {
    this.stopLoop();
    this.running = true;
    this.paused = false;
    this.ended = false;
    this.elapsed = 0;
    this.distance = 0;
    this.coins = 0;
    this.score = 0;
    this.energy = 3;
    this.speed = 17;
    this.invulnerability = 0;
    this.dashTime = 0;
    this.dashCooldown = 0;
    this.statsClock = 0;
    this.stageId = -1;
    this.player.reset();
    this.obstacles.reset();
    this.updateStage();
    this.callbacks.onStats(this.getStats());
    this.lastFrame = performance.now();
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  pause(): void {
    if (!this.running || this.ended) return;
    this.paused = true;
    this.running = false;
    this.stopLoop();
  }

  resume(): void {
    if (!this.paused || this.ended) return;
    this.paused = false;
    this.running = true;
    this.lastFrame = performance.now();
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  get isPaused(): boolean {
    return this.paused;
  }

  get isRunning(): boolean {
    return this.running;
  }

  act(action: GameAction): void {
    if (!this.running || this.ended) return;
    if (action === "left") this.player.moveLane(-1);
    else if (action === "right") this.player.moveLane(1);
    else if (action === "jump") {
      if (this.player.jump()) this.callbacks.playSound("jump");
    } else if (action === "slide") {
      if (this.player.slide()) this.callbacks.playSound("slide");
    } else if (action === "dash" && this.dashCooldown <= 0) {
      this.dashTime = 1.25;
      this.dashCooldown = 5;
      this.callbacks.playSound("dash");
      this.callbacks.onMessage("DISPARADA!");
    }
  }

  private stopLoop(): void {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
  }

  private frame = (now: number): void => {
    if (!this.running || this.paused) return;
    const delta = Math.min((now - this.lastFrame) / 1000, 0.045);
    this.lastFrame = now;
    this.update(delta);
    this.renderer.render(this.scene, this.camera);
    if (this.running) this.animationFrame = requestAnimationFrame(this.frame);
  };

  private update(delta: number): void {
    this.elapsed += delta;
    this.dashTime = Math.max(0, this.dashTime - delta);
    this.dashCooldown = Math.max(0, this.dashCooldown - delta);
    this.invulnerability = Math.max(0, this.invulnerability - delta);
    this.speed = Math.min(29, 17 + this.distance / 210);
    const currentSpeed = this.speed * (this.dashTime > 0 ? 1.48 : 1);
    this.distance += currentSpeed * delta * 0.82;
    this.score = Math.floor(this.distance * 8 + this.coins * 50);

    this.updateStage();
    this.player.update(delta, this.elapsed);
    this.world.update(delta, currentSpeed);
    this.obstacles.update(
      delta,
      currentSpeed,
      this.player,
      () => {
        this.coins += 1;
        this.callbacks.playSound("coin");
      },
      () => {
        this.energy = Math.min(3, this.energy + 1);
        this.callbacks.playSound("power");
        this.callbacks.onMessage("ENERGIA RECUPERADA!");
      },
      () => this.handleHit()
    );

    const playerX = this.player.getLaneX();
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, playerX * 0.24, 3.2, delta);
    this.camera.position.y = 7.35 + Math.sin(this.elapsed * 8) * 0.055;
    this.camera.lookAt(playerX * 0.13, 1.15, -8);
    this.camera.fov = this.dashTime > 0 ? 63 : 58;
    this.camera.updateProjectionMatrix();

    this.statsClock += delta;
    if (this.statsClock >= 0.12) {
      this.statsClock = 0;
      this.callbacks.onStats(this.getStats());
    }
  }

  private updateStage(): void {
    const stage = this.levels.getStage(this.distance);
    if (stage.id === this.stageId) return;
    this.stageId = stage.id;
    this.world.setStage(stage);
    this.obstacles.setStage(stage);
    this.callbacks.onStageChanged(stage);
    if (this.stageId > 0) this.callbacks.playSound("stage");
  }

  private handleHit(): void {
    if (this.invulnerability > 0 || this.ended) return;
    this.energy = Math.max(0, this.energy - 1);
    this.invulnerability = 1.55;
    this.player.stumble();
    this.callbacks.playSound("crash");
    this.callbacks.onMessage(this.energy > 0 ? "CUIDADO! VOCÊ PERDEU ENERGIA" : "FIM DE JOGO");
    if (this.energy <= 0) this.finish();
  }

  private finish(): void {
    if (this.ended) return;
    this.ended = true;
    this.running = false;
    this.stopLoop();
    this.callbacks.onGameOver(this.getStats());
  }

  private getStats(): GameStats {
    const stage = this.levels.getStage(this.distance);
    return {
      score: this.score,
      distance: Math.floor(this.distance),
      coins: this.coins,
      speed: this.speed,
      energy: this.energy,
      stageIndex: stage.id,
      stageName: stage.name,
      stageProgress: this.levels.getProgress(this.distance)
    };
  }

  dispose(): void {
    this.stopLoop();
    window.removeEventListener("resize", this.handleResize);
    this.obstacles.reset();
    this.renderer.dispose();
  }
}