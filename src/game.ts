export type GameAction = "left" | "right" | "jump" | "slide";

type EntityKind = "barrier" | "crate" | "arch" | "coin" | "shield";

interface Entity {
  lane: number;
  z: number;
  kind: EntityKind;
  seed: number;
}

export interface GameStats {
  score: number;
  distance: number;
  coins: number;
  speed: number;
}

interface GameCallbacks {
  onStats: (stats: GameStats) => void;
  onGameOver: (stats: GameStats) => void;
  playSound: (sound: "coin" | "jump" | "crash" | "power") => void;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export class RunnerGame {
  private readonly ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private raf = 0;
  private lastTime = 0;
  private running = false;
  private paused = false;
  private ended = false;
  private playerLane = 1;
  private jumpTime = 0;
  private slideTime = 0;
  private invulnerable = 0;
  private spawnClock = 0;
  private statsClock = 0;
  private entities: Entity[] = [];
  private distance = 0;
  private coins = 0;
  private score = 0;
  private speed = 0.34;
  private shake = 0;
  private flash = 0;
  private roadOffset = 0;
  private readonly callbacks: GameCallbacks;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    callbacks: GameCallbacks
  ) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Seu navegador não oferece suporte ao Canvas 2D.");
    this.ctx = context;
    this.callbacks = callbacks;
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  private resize = (): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(320, rect.width);
    this.height = Math.max(420, rect.height);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.render(0);
  };

  start(): void {
    this.stopLoop();
    this.running = true;
    this.paused = false;
    this.ended = false;
    this.playerLane = 1;
    this.jumpTime = 0;
    this.slideTime = 0;
    this.invulnerable = 0;
    this.spawnClock = 0.65;
    this.statsClock = 0;
    this.entities = [];
    this.distance = 0;
    this.coins = 0;
    this.score = 0;
    this.speed = 0.34;
    this.shake = 0;
    this.flash = 0;
    this.lastTime = performance.now();
    this.callbacks.onStats(this.getStats());
    this.raf = requestAnimationFrame(this.frame);
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
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  get isPaused(): boolean {
    return this.paused;
  }

  get isRunning(): boolean {
    return this.running;
  }

  act(action: GameAction): void {
    if (!this.running || this.ended) return;
    switch (action) {
      case "left":
        this.playerLane = Math.max(0, this.playerLane - 1);
        break;
      case "right":
        this.playerLane = Math.min(2, this.playerLane + 1);
        break;
      case "jump":
        if (this.jumpTime <= 0 && this.slideTime <= 0) {
          this.jumpTime = 0.72;
          this.callbacks.playSound("jump");
        }
        break;
      case "slide":
        if (this.jumpTime <= 0 && this.slideTime <= 0) this.slideTime = 0.62;
        break;
    }
  }

  private stopLoop(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private frame = (now: number): void => {
    if (!this.running || this.paused) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.04);
    this.lastTime = now;
    this.update(dt);
    this.render(now / 1000);
    if (this.running) this.raf = requestAnimationFrame(this.frame);
  };

  private update(dt: number): void {
    this.distance += this.speed * dt * 36;
    this.speed = Math.min(0.78, 0.34 + this.distance / 9000);
    this.score = Math.floor(this.distance * 8 + this.coins * 35);
    this.roadOffset = (this.roadOffset + dt * this.speed * 0.7) % 1;
    this.jumpTime = Math.max(0, this.jumpTime - dt);
    this.slideTime = Math.max(0, this.slideTime - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.shake = Math.max(0, this.shake - dt * 24);
    this.flash = Math.max(0, this.flash - dt * 2.8);

    this.spawnClock -= dt;
    if (this.spawnClock <= 0) {
      this.spawnPattern();
      this.spawnClock = Math.max(0.48, 1.16 - this.speed * 0.72) + Math.random() * 0.32;
    }

    for (const entity of this.entities) entity.z += dt * this.speed;
    this.checkCollisions();
    this.entities = this.entities.filter((entity) => entity.z < 1.16);

    this.statsClock += dt;
    if (this.statsClock >= 0.12) {
      this.statsClock = 0;
      this.callbacks.onStats(this.getStats());
    }
  }

  private spawnPattern(): void {
    const lane = Math.floor(Math.random() * 3);
    const roll = Math.random();
    if (roll < 0.16) {
      for (let i = 0; i < 5; i++) {
        this.entities.push({ lane, z: -0.02 - i * 0.075, kind: "coin", seed: Math.random() });
      }
      return;
    }
    if (roll < 0.23) {
      this.entities.push({ lane, z: 0, kind: "shield", seed: Math.random() });
      return;
    }
    const kind: EntityKind = roll < 0.48 ? "barrier" : roll < 0.72 ? "crate" : "arch";
    this.entities.push({ lane, z: 0, kind, seed: Math.random() });
    if (this.distance > 180 && Math.random() < 0.22) {
      const otherLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
      this.entities.push({
        lane: otherLane,
        z: -0.015,
        kind: Math.random() < 0.55 ? "coin" : "crate",
        seed: Math.random()
      });
    }
  }

  private checkCollisions(): void {
    for (const entity of this.entities) {
      if (entity.z < 0.82 || entity.z > 0.94 || entity.lane !== this.playerLane) continue;
      if (entity.kind === "coin") {
        entity.z = 2;
        this.coins += 1;
        this.callbacks.playSound("coin");
        continue;
      }
      if (entity.kind === "shield") {
        entity.z = 2;
        this.invulnerable = 5;
        this.flash = 1;
        this.callbacks.playSound("power");
        continue;
      }
      if (this.invulnerable > 0) {
        entity.z = 2;
        continue;
      }
      const cleared = (entity.kind === "barrier" && this.jumpTime > 0.18)
        || (entity.kind === "arch" && this.slideTime > 0.16);
      if (cleared) {
        entity.z = 2;
      } else {
        this.finish();
        return;
      }
    }
  }

  private finish(): void {
    if (this.ended) return;
    this.ended = true;
    this.running = false;
    this.stopLoop();
    this.shake = 9;
    this.callbacks.playSound("crash");
    this.callbacks.onGameOver(this.getStats());
  }

  private getStats(): GameStats {
    return {
      score: this.score,
      distance: Math.floor(this.distance),
      coins: this.coins,
      speed: this.speed
    };
  }

  private render(time: number): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const horizon = h * 0.19;
    const roadTop = w * 0.13;
    const roadBottom = w * 0.94;
    ctx.clearRect(0, 0, w, h);

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#101e37");
    sky.addColorStop(0.62, "#263b57");
    sky.addColorStop(1, "#0a1422");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    this.drawSkyline(horizon, time);
    this.drawRoad(horizon, roadTop, roadBottom);

    const ordered = [...this.entities].sort((a, b) => a.z - b.z);
    for (const entity of ordered) this.drawEntity(entity, horizon, time);
    this.drawPlayer(time);

    if (this.invulnerable > 0 || this.flash > 0) {
      ctx.fillStyle = "rgba(58, 220, 255, " + (0.06 + Math.sin(time * 18) * 0.035) + ")";
      ctx.fillRect(0, 0, w, h);
    }
    if (this.shake > 0) {
      // The shake value is also used by the CSS feedback; keep the canvas scene readable.
      ctx.strokeStyle = "rgba(255,255,255," + Math.min(0.3, this.shake / 30) + ")";
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, w - 4, h - 4);
    }
  }

  private drawSkyline(horizon: number, time: number): void {
    const ctx = this.ctx;
    const w = this.width;
    ctx.fillStyle = "#172943";
    for (let i = 0; i < 13; i++) {
      const x = (i / 13) * w;
      const bw = w / 18;
      const bh = 18 + ((i * 37) % 48);
      ctx.fillRect(x, horizon - bh, bw, bh);
      ctx.fillStyle = "#f7b955";
      for (let row = 0; row < 3; row++) {
        ctx.globalAlpha = 0.12 + (Math.sin(time * 2 + i + row) + 1) * 0.08;
        ctx.fillRect(x + 4, horizon - bh + 8 + row * 11, 3, 4);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#172943";
    }
    const glow = ctx.createRadialGradient(w * 0.5, horizon * 0.7, 2, w * 0.5, horizon * 0.7, w * 0.45);
    glow.addColorStop(0, "rgba(255,174,82,0.24)");
    glow.addColorStop(1, "rgba(255,174,82,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, horizon + 40);
  }

  private drawRoad(horizon: number, top: number, bottom: number): void {
    const ctx = this.ctx;
    const w = this.width;
    const cx = w / 2;
    ctx.fillStyle = "#182b41";
    ctx.beginPath();
    ctx.moveTo(cx - top, horizon);
    ctx.lineTo(cx + top, horizon);
    ctx.lineTo(cx + bottom, this.height);
    ctx.lineTo(cx - bottom, this.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#243a51";
    ctx.beginPath();
    ctx.moveTo(cx - top * 0.85, horizon);
    ctx.lineTo(cx + top * 0.85, horizon);
    ctx.lineTo(cx + bottom * 0.88, this.height);
    ctx.lineTo(cx - bottom * 0.88, this.height);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < 2; i++) {
      const topX = cx - top + (top * 2 * (i + 1)) / 3;
      const bottomX = cx - bottom + (bottom * 2 * (i + 1)) / 3;
      ctx.strokeStyle = "rgba(174,211,236,0.4)";
      ctx.lineWidth = 1 + (i + 1) * 0.6;
      ctx.setLineDash([12, 13]);
      ctx.lineDashOffset = -this.roadOffset * 140;
      ctx.beginPath();
      ctx.moveTo(topX, horizon);
      ctx.lineTo(bottomX, this.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const edge = ctx.createLinearGradient(0, horizon, 0, this.height);
    edge.addColorStop(0, "#f2b65a");
    edge.addColorStop(1, "#f17b48");
    ctx.strokeStyle = edge;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - top, horizon);
    ctx.lineTo(cx - bottom, this.height);
    ctx.moveTo(cx + top, horizon);
    ctx.lineTo(cx + bottom, this.height);
    ctx.stroke();

  }

  private laneX(lane: number, z: number): number {
    const perspective = Math.pow(clamp(z, 0, 1), 0.92);
    const half = this.width * (0.12 + 0.35 * perspective);
    return this.width / 2 + (lane - 1) * half * 0.66;
  }

  private drawEntity(entity: Entity, horizon: number, time: number): void {
    if (entity.z < 0) return;
    const ctx = this.ctx;
    const p = clamp(entity.z, 0, 1.05);
    const perspective = Math.pow(p, 1.35);
    const x = this.laneX(entity.lane, p);
    const y = horizon + p * (this.height * 0.78);
    const scale = 0.25 + perspective * 1.08;
    const size = this.width * 0.055 * scale;

    ctx.save();
    ctx.translate(x, y);
    if (entity.kind === "coin") {
      const spin = Math.abs(Math.cos(time * 7 + entity.seed * 8));
      ctx.scale(Math.max(0.18, spin), 1);
      ctx.shadowColor = "#ffd66b";
      ctx.shadowBlur = 15 * scale;
      ctx.fillStyle = "#ffc84e";
      ctx.beginPath();
      ctx.arc(0, -size * 0.38, size * 0.27, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff0a6";
      ctx.lineWidth = Math.max(1, size * 0.08);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (entity.kind === "shield") {
      ctx.shadowColor = "#43d8ff";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgba(45,205,255,0.24)";
      ctx.strokeStyle = "#8beaff";
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(0, -size * 0.3, size * 0.46, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d6faff";
      ctx.font = "bold " + Math.max(11, size * 0.75) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✦", 0, -size * 0.05);
      ctx.restore();
      return;
    }
    if (entity.kind === "barrier") {
      ctx.fillStyle = "#ec6e4f";
      ctx.shadowColor = "#ff7959";
      ctx.shadowBlur = 8 * scale;
      ctx.beginPath();
      ctx.moveTo(-size * 0.72, -size * 0.15);
      ctx.lineTo(-size * 0.48, -size * 0.75);
      ctx.lineTo(size * 0.48, -size * 0.75);
      ctx.lineTo(size * 0.72, -size * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffe2a0";
      ctx.fillRect(-size * 0.54, -size * 0.46, size * 1.08, size * 0.13);
    } else if (entity.kind === "crate") {
      ctx.fillStyle = "#bd7650";
      ctx.fillRect(-size * 0.53, -size * 1.05, size * 1.06, size * 0.9);
      ctx.strokeStyle = "#f2bd7c";
      ctx.lineWidth = Math.max(1, size * 0.07);
      ctx.strokeRect(-size * 0.53, -size * 1.05, size * 1.06, size * 0.9);
      ctx.beginPath();
      ctx.moveTo(-size * 0.43, -size * 0.95);
      ctx.lineTo(size * 0.43, -size * 0.25);
      ctx.moveTo(size * 0.43, -size * 0.95);
      ctx.lineTo(-size * 0.43, -size * 0.25);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#e98c51";
      ctx.lineWidth = Math.max(3, size * 0.2);
      ctx.beginPath();
      ctx.moveTo(-size * 0.74, -size * 1.55);
      ctx.lineTo(-size * 0.74, -size * 0.08);
      ctx.quadraticCurveTo(0, size * 0.08, size * 0.74, -size * 0.08);
      ctx.lineTo(size * 0.74, -size * 1.55);
      ctx.stroke();
      ctx.strokeStyle = "#ffd08b";
      ctx.lineWidth = Math.max(1, size * 0.06);
      ctx.beginPath();
      ctx.moveTo(-size * 0.68, -size * 1.48);
      ctx.lineTo(size * 0.68, -size * 1.48);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawPlayer(time: number): void {
    const ctx = this.ctx;
    const laneX = this.width / 2 + (this.playerLane - 1) * this.width * 0.22;
    const baseY = this.height * 0.84;
    const jumpProgress = this.jumpTime > 0 ? 1 - this.jumpTime / 0.72 : 0;
    const jumpLift = this.jumpTime > 0 ? Math.sin(jumpProgress * Math.PI) * this.height * 0.16 : 0;
    const sliding = this.slideTime > 0;
    const bob = this.jumpTime > 0 || sliding ? 0 : Math.sin(time * 13) * 3;
    const x = laneX;
    const y = baseY - jumpLift + bob;
    const scale = clamp(this.width / 420, 0.72, 1.18);
    const flicker = this.invulnerable > 0 && Math.floor(time * 16) % 2 === 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    if (flicker) ctx.globalAlpha = 0.42;
    ctx.shadowColor = "#020811";
    ctx.shadowBlur = 13;
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 4, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (sliding) {
      ctx.rotate(-0.12);
      ctx.fillStyle = "#24bfd0";
      ctx.fillRect(-26, -18, 48, 23);
      ctx.fillStyle = "#f1bd91";
      ctx.beginPath();
      ctx.arc(24, -12, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#18263b";
      ctx.fillRect(-28, 3, 22, 6);
      ctx.fillRect(7, 3, 22, 6);
    } else {
      const run = Math.sin(time * 15) * (this.jumpTime > 0 ? 2 : 9);
      ctx.strokeStyle = "#162238";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-7, -15);
      ctx.lineTo(-12 - run * 0.45, 0);
      ctx.moveTo(7, -15);
      ctx.lineTo(13 + run * 0.45, 0);
      ctx.stroke();
      ctx.fillStyle = "#f3c59b";
      ctx.beginPath();
      ctx.arc(0, -42, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#172842";
      ctx.beginPath();
      ctx.arc(0, -47, 13, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#27c3d1";
      ctx.beginPath();
      ctx.moveTo(-13, -30);
      ctx.lineTo(13, -30);
      ctx.lineTo(17, -10);
      ctx.lineTo(-17, -10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#e9a979";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-12, -27);
      ctx.lineTo(-20 - run * 0.35, -13);
      ctx.moveTo(12, -27);
      ctx.lineTo(20 + run * 0.35, -13);
      ctx.stroke();
      ctx.fillStyle = "#f6bd4c";
      ctx.fillRect(-17 - run * 0.45, -2, 13, 5);
      ctx.fillRect(5 + run * 0.45, -2, 13, 5);
    }
    ctx.restore();
  }
}