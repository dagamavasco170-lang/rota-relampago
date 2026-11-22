import * as THREE from "three";
import type { StageDefinition } from "./LevelManager";

interface MovingProp {
  group: THREE.Group;
  resetDistance: number;
}

export class World {
  private readonly scene: THREE.Scene;
  private readonly roadMaterial: THREE.MeshStandardMaterial;
  private readonly groundMaterial: THREE.MeshStandardMaterial;
  private readonly buildingMaterial: THREE.MeshStandardMaterial;
  private readonly windowMaterial: THREE.MeshStandardMaterial;
  private readonly dashedLines: THREE.Group[] = [];
  private readonly props: MovingProp[] = [];
  private readonly roadAccent: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    const ambient = new THREE.HemisphereLight(0xdceeff, 0x52604e, 2.0);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffe5bf, 2.2);
    sun.position.set(-12, 24, 12);
    scene.add(sun);

    this.groundMaterial = new THREE.MeshStandardMaterial({ color: 0x54755b, roughness: 1, flatShading: true });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 280), this.groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.18, -100);
    scene.add(ground);

    this.roadMaterial = new THREE.MeshStandardMaterial({ color: 0x303b48, roughness: 0.95, flatShading: true });
    const road = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 280), this.roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.08, -100);
    scene.add(road);

    this.roadAccent = new THREE.MeshStandardMaterial({ color: 0xf5ad4e, roughness: 0.8 });
    for (const x of [-6.05, 6.05]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 280), this.roadAccent);
      curb.position.set(x, 0.015, -100);
      scene.add(curb);
    }

    const laneMaterial = new THREE.MeshBasicMaterial({ color: 0xe8e6d3 });
    for (const x of [-2.08, 2.08]) {
      for (let i = 0; i < 18; i++) {
        const dash = new THREE.Group();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.025, 5.8), laneMaterial);
        dash.add(mesh);
        dash.position.set(x, 0.012, -i * 14);
        scene.add(dash);
        this.dashedLines.push(dash);
      }
    }

    this.buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x647b89, roughness: 1, flatShading: true });
    this.windowMaterial = new THREE.MeshStandardMaterial({ color: 0xffd78a, emissive: 0x6a4f24, flatShading: true });
    this.createCity();
  }

  private createCity(): void {
    const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
    const windowGeometry = new THREE.BoxGeometry(0.16, 0.22, 0.035);
    for (let i = 0; i < 18; i++) {
      for (const side of [-1, 1]) {
        const group = new THREE.Group();
        const width = 2.8 + ((i * 7 + (side + 1) * 5) % 4) * 0.55;
        const height = 5 + ((i * 11 + side * 3 + 20) % 7) * 1.6;
        const building = new THREE.Mesh(buildingGeometry, this.buildingMaterial);
        building.scale.set(width, height, 7 + (i % 3) * 2);
        building.position.y = height / 2 - 0.1;
        group.add(building);

        const columns = Math.max(2, Math.floor(width / 0.55));
        for (let row = 0; row < Math.min(5, Math.floor(height / 1.8)); row++) {
          for (let col = 0; col < columns; col++) {
            const windowMesh = new THREE.Mesh(windowGeometry, this.windowMaterial);
            windowMesh.position.set(
              -width / 2 + 0.38 + col * ((width - 0.5) / columns),
              1.2 + row * 1.45,
              3.53 + (i % 3)
            );
            group.add(windowMesh);
          }
        }
        group.position.set(side * (10 + (i % 3) * 1.2), 0, -i * 16);
        this.scene.add(group);
        this.props.push({ group, resetDistance: 18 * 16 });
      }
    }

    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x394553, roughness: 0.9 });
    const lampMaterial = new THREE.MeshStandardMaterial({ color: 0xffe6a8, emissive: 0x98703a });
    for (let i = 0; i < 10; i++) {
      for (const side of [-1, 1]) {
        const lamp = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 5.4, 6), poleMaterial);
        pole.position.y = 2.7;
        lamp.add(pole);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.11, 0.11), poleMaterial);
        arm.position.set(-side * 0.5, 5.25, 0);
        lamp.add(arm);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.42), lampMaterial);
        head.position.set(-side * 1.0, 5.17, 0);
        lamp.add(head);
        lamp.position.set(side * 6.8, 0, -i * 29 - 5);
        this.scene.add(lamp);
        this.props.push({ group: lamp, resetDistance: 290 });
      }
    }
  }

  setStage(stage: StageDefinition): void {
    const sky = new THREE.Color(stage.sky);
    this.scene.background = sky;
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.setHex(stage.fog);
      this.scene.fog.near = 40;
      this.scene.fog.far = 180;
    } else {
      this.scene.fog = new THREE.Fog(stage.fog, 40, 180);
    }
    this.roadMaterial.color.setHex(stage.road);
    this.groundMaterial.color.setHex(stage.ground);
    this.buildingMaterial.color.setHex(stage.building);
    this.roadAccent.color.setHex(stage.accent);
    this.windowMaterial.emissive.setHex(stage.id === 4 ? 0x244488 : 0x6a4f24);
  }

  update(delta: number, speed: number): void {
    const movement = delta * speed;
    for (const dash of this.dashedLines) {
      dash.position.z += movement;
      if (dash.position.z > 18) dash.position.z -= 18 * 14;
    }
    for (const prop of this.props) {
      prop.group.position.z += movement;
      if (prop.group.position.z > 24) prop.group.position.z -= prop.resetDistance;
    }
  }
}