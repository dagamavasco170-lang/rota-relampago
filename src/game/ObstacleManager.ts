import * as THREE from "three";
import type { Player } from "./Player";
import type { StageDefinition } from "./LevelManager";

type EntityKind = "barrier" | "arch" | "car" | "truck" | "crate" | "coin" | "battery";

interface GameEntity {
  group: THREE.Group;
  lane: number;
  kind: EntityKind;
  resolved: boolean;
}

const LANES = [-3.15, 0, 3.15];

export class ObstacleManager {
  private readonly scene: THREE.Scene;
  private readonly entities: GameEntity[] = [];
  private spawnTimer = 1.2;
  private elapsed = 0;
  private stage: StageDefinition | null = null;
  private readonly materials = {
    red: new THREE.MeshStandardMaterial({ color: 0xe65d4f, roughness: 0.8, flatShading: true }),
    white: new THREE.MeshStandardMaterial({ color: 0xf3e8d0, roughness: 0.8, flatShading: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x263444, roughness: 0.9, flatShading: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x7fc9de, metalness: 0.15, roughness: 0.25 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xa96f42, roughness: 1, flatShading: true }),
    gold: new THREE.MeshStandardMaterial({ color: 0xffd05b, metalness: 0.3, roughness: 0.35 }),
    green: new THREE.MeshStandardMaterial({ color: 0x59d68b, emissive: 0x144b2e, flatShading: true })
  };

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  setStage(stage: StageDefinition): void {
    this.stage = stage;
  }

  reset(): void {
    for (const entity of this.entities) this.scene.remove(entity.group);
    this.entities.length = 0;
    this.spawnTimer = 1.3;
    this.elapsed = 0;
  }

  update(
    delta: number,
    speed: number,
    player: Player,
    onCoin: () => void,
    onBattery: () => void,
    onHit: () => void
  ): void {
    this.elapsed += delta;
    this.spawnTimer -= delta;
    if (this.spawnTimer <= 0) {
      this.spawnPattern();
      const difficulty = this.stage?.obstacleChance ?? 0.7;
      this.spawnTimer = THREE.MathUtils.clamp(1.28 - (speed - 16) * 0.018 - (difficulty - 0.7) * 0.45, 0.68, 1.35);
      this.spawnTimer += Math.random() * 0.24;
    }

    for (const entity of this.entities) {
      entity.group.position.z += speed * delta;
      if (!entity.resolved && Math.abs(entity.group.position.z - 5) < 1.65 && entity.lane === player.getLane()) {
        if (entity.kind === "coin") {
          entity.resolved = true;
          this.scene.remove(entity.group);
          onCoin();
          continue;
        }
        if (entity.kind === "battery") {
          entity.resolved = true;
          this.scene.remove(entity.group);
          onBattery();
          continue;
        }
        const cleared = (entity.kind === "barrier" && player.isJumping)
          || (entity.kind === "arch" && player.isSliding);
        if (!cleared) {
          entity.resolved = true;
          this.scene.remove(entity.group);
          onHit();
        } else {
          entity.resolved = true;
          this.scene.remove(entity.group);
        }
      }
    }

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (entity.resolved || entity.group.position.z > 14) {
        this.scene.remove(entity.group);
        this.entities.splice(i, 1);
      }
    }
  }

  private spawnPattern(): void {
    const lane = Math.floor(Math.random() * 3);
    const roll = Math.random();
    if (roll < 0.23) {
      this.spawnCoinTrail(lane, -84);
      return;
    }
    if (roll < 0.29) {
      this.spawn("battery", (lane + 1) % 3, -86);
      this.spawnCoinTrail(lane, -96);
      return;
    }

    const obstacleRoll = Math.random();
    const kind: EntityKind = obstacleRoll < 0.2
      ? "barrier"
      : obstacleRoll < 0.38
        ? "arch"
        : obstacleRoll < 0.68
          ? "car"
          : obstacleRoll < 0.83
            ? "truck"
            : "crate";
    this.spawn(kind, lane, -88);

    const safeLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
    if (Math.random() < 0.74) this.spawnCoinTrail(safeLane, -94);
    if (this.elapsed > 24 && Math.random() < 0.16) {
      const secondSafeLane = (safeLane + 1) % 3;
      this.spawn("barrier", secondSafeLane, -124);
    }
  }

  private spawnCoinTrail(lane: number, startZ: number): void {
    for (let i = 0; i < 5; i++) this.spawn("coin", lane, startZ - i * 5.2);
  }

  private spawn(kind: EntityKind, lane: number, z: number): void {
    const group = new THREE.Group();
    const addBox = (
      width: number, height: number, depth: number,
      y: number, material: THREE.Material, x = 0, zOffset = 0
    ): THREE.Mesh => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
      mesh.position.set(x, y, zOffset);
      group.add(mesh);
      return mesh;
    };

    if (kind === "barrier") {
      addBox(2.45, 0.26, 0.46, 0.56, this.materials.red);
      for (const x of [-0.92, 0.92]) addBox(0.18, 1.12, 0.2, 0.55, this.materials.white, x);
      for (const x of [-0.55, 0.55]) {
        const stripe = addBox(0.22, 0.27, 0.48, 0.56, this.materials.white, x);
        stripe.rotation.z = -0.55;
      }
    } else if (kind === "arch") {
      for (const x of [-1.05, 1.05]) addBox(0.2, 2.15, 0.24, 1.08, this.materials.red, x);
      addBox(2.3, 0.24, 0.3, 2.05, this.materials.red);
      addBox(2.3, 0.1, 0.34, 1.82, this.materials.white);
    } else if (kind === "car" || kind === "truck") {
      const truck = kind === "truck";
      const bodyWidth = truck ? 2.35 : 1.95;
      addBox(bodyWidth, truck ? 1.35 : 0.82, truck ? 4.1 : 3.2, truck ? 1.08 : 0.72, truck ? this.materials.wood : this.materials.red);
      addBox(bodyWidth * 0.84, truck ? 0.82 : 0.56, 1.3, truck ? 1.95 : 1.31, truck ? this.materials.white : this.materials.glass, 0, -0.7);
      addBox(bodyWidth * 0.94, 0.16, 0.2, truck ? 1.08 : 0.76, this.materials.dark, 0, 1.58);
      for (const x of [-0.88, 0.88]) {
        for (const zWheel of [-1.05, 1.05]) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 8), this.materials.dark);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(x, 0.42, zWheel);
          group.add(wheel);
        }
      }
      const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffefbd });
      for (const x of [-0.66, 0.66]) addBox(0.28, 0.2, 0.08, truck ? 0.76 : 0.68, headlightMaterial, x, 1.62);
    } else if (kind === "crate") {
      addBox(1.8, 1.8, 1.8, 0.9, this.materials.wood);
      const brace = addBox(0.16, 2.1, 1.92, 0.9, this.materials.gold);
      brace.rotation.z = Math.PI / 4;
      const brace2 = addBox(0.16, 2.1, 1.92, 0.9, this.materials.gold);
      brace2.rotation.z = -Math.PI / 4;
    } else if (kind === "coin") {
      const coin = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.13, 6, 14), this.materials.gold);
      coin.rotation.y = Math.PI / 2;
      coin.position.y = 1.45;
      group.add(coin);
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 8), this.materials.gold);
      core.rotation.x = Math.PI / 2;
      core.position.y = 1.45;
      group.add(core);
    } else {
      addBox(0.92, 1.15, 0.65, 0.82, this.materials.green);
      addBox(0.56, 0.16, 0.72, 0.82, this.materials.white);
      addBox(0.16, 0.62, 0.74, 0.82, this.materials.white);
    }

    group.position.set(LANES[lane] ?? 0, 0, z);
    group.userData.kind = kind;
    this.scene.add(group);
    this.entities.push({ group, lane, kind, resolved: false });
  }
}