import * as THREE from "three";

const LANE_POSITIONS = [-3.15, 0, 3.15];

export class Player {
  readonly group = new THREE.Group();
  private readonly leftLeg: THREE.Group;
  private readonly rightLeg: THREE.Group;
  private readonly leftArm: THREE.Group;
  private readonly rightArm: THREE.Group;
  private lane = 1;
  private jumpTime = 0;
  private slideTime = 0;
  private stumbleTime = 0;
  private dashTime = 0;

  constructor(scene: THREE.Scene) {
    const suit = new THREE.MeshStandardMaterial({ color: 0x19b8c9, roughness: 0.78, flatShading: true });
    const dark = new THREE.MeshStandardMaterial({ color: 0x223249, roughness: 0.9, flatShading: true });
    const skin = new THREE.MeshStandardMaterial({ color: 0xf0bd91, roughness: 0.85, flatShading: true });
    const hair = new THREE.MeshStandardMaterial({ color: 0x273047, roughness: 1, flatShading: true });
    const shoe = new THREE.MeshStandardMaterial({ color: 0xffb94e, roughness: 0.75, flatShading: true });
    const white = new THREE.MeshStandardMaterial({ color: 0xf5f4e9, roughness: 0.8, flatShading: true });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 0.55), suit);
    torso.position.y = 1.55;
    this.group.add(torso);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.2, 0.58), white);
    chest.position.set(0, 1.68, 0.29);
    this.group.add(chest);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.72, 0.62), skin);
    head.position.y = 2.48;
    this.group.add(head);

    const hairCap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.25, 0.67), hair);
    hairCap.position.set(0, 2.82, -0.015);
    this.group.add(hairCap);

    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x172337, flatShading: true });
    for (const x of [-0.16, 0.16]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.035), eyeMaterial);
      eye.position.set(x, 2.53, 0.326);
      this.group.add(eye);
    }

    const makeLeg = (x: number): THREE.Group => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.08, 0);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.76, 0.34), dark);
      leg.position.y = -0.34;
      pivot.add(leg);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.58), shoe);
      boot.position.set(0, -0.7, 0.12);
      pivot.add(boot);
      this.group.add(pivot);
      return pivot;
    };

    const makeArm = (x: number): THREE.Group => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.92, 0);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.72, 0.28), suit);
      arm.position.y = -0.31;
      pivot.add(arm);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.25), skin);
      hand.position.y = -0.68;
      pivot.add(hand);
      this.group.add(pivot);
      return pivot;
    };

    this.leftLeg = makeLeg(-0.27);
    this.rightLeg = makeLeg(0.27);
    this.leftArm = makeArm(-0.62);
    this.rightArm = makeArm(0.62);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 16),
      new THREE.MeshBasicMaterial({ color: 0x101722, transparent: true, opacity: 0.3 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.025;
    this.group.add(shadow);

    this.group.position.set(0, 0, 5);
    scene.add(this.group);
  }

  moveLane(direction: -1 | 1): void {
    this.lane = THREE.MathUtils.clamp(this.lane + direction, 0, 2);
  }

  jump(): boolean {
    if (this.jumpTime > 0 || this.slideTime > 0 || this.stumbleTime > 0) return false;
    this.jumpTime = 0.88;
    return true;
  }

  slide(): boolean {
    if (this.jumpTime > 0 || this.slideTime > 0 || this.stumbleTime > 0) return false;
    this.slideTime = 0.78;
    return true;
  }

  stumble(): void {
    this.stumbleTime = 0.42;
  }

  update(delta: number, elapsed: number): void {
    this.jumpTime = Math.max(0, this.jumpTime - delta);
    this.slideTime = Math.max(0, this.slideTime - delta);
    this.stumbleTime = Math.max(0, this.stumbleTime - delta);
    this.dashTime = Math.max(0, this.dashTime - delta);

    const targetX = LANE_POSITIONS[this.lane] ?? 0;
    this.group.position.x = THREE.MathUtils.damp(this.group.position.x, targetX, 13, delta);

    const jumpProgress = this.jumpTime > 0 ? 1 - this.jumpTime / 0.88 : 0;
    const jumpHeight = this.jumpTime > 0 ? Math.sin(jumpProgress * Math.PI) * 2.65 : 0;
    const sliding = this.slideTime > 0;
    this.group.position.y = jumpHeight + (sliding ? -0.48 : 0);
    this.group.scale.y = THREE.MathUtils.damp(this.group.scale.y, sliding ? 0.58 : 1, 18, delta);

    const run = Math.sin(elapsed * 17) * (this.jumpTime > 0 ? 0.16 : 0.72);
    this.leftLeg.rotation.x = run;
    this.rightLeg.rotation.x = -run;
    this.leftArm.rotation.x = -run * 0.8;
    this.rightArm.rotation.x = run * 0.8;
    this.group.rotation.z = THREE.MathUtils.damp(
      this.group.rotation.z,
      this.stumbleTime > 0 ? Math.sin(elapsed * 38) * 0.24 : 0,
      15,
      delta
    );
    if (sliding) this.group.rotation.x = THREE.MathUtils.damp(this.group.rotation.x, -0.35, 16, delta);
    else this.group.rotation.x = THREE.MathUtils.damp(this.group.rotation.x, 0, 12, delta);
  }

  getLane(): number {
    return this.lane;
  }

  getLaneX(): number {
    return LANE_POSITIONS[this.lane] ?? 0;
  }

  get isJumping(): boolean {
    return this.jumpTime > 0.12;
  }

  get isSliding(): boolean {
    return this.slideTime > 0.12;
  }

  get isBusy(): boolean {
    return this.jumpTime > 0 || this.slideTime > 0 || this.stumbleTime > 0;
  }

  reset(): void {
    this.lane = 1;
    this.jumpTime = 0;
    this.slideTime = 0;
    this.stumbleTime = 0;
    this.group.position.set(0, 0, 5);
    this.group.rotation.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);
  }
}