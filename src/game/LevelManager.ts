export interface StageDefinition {
  id: number;
  name: string;
  subtitle: string;
  sky: number;
  fog: number;
  road: number;
  ground: number;
  building: number;
  accent: number;
  obstacleChance: number;
}

export const STAGE_LENGTH = 650;

const STAGES: StageDefinition[] = [
  {
    id: 0, name: "Centro urbano", subtitle: "Desvie do trânsito e atravesse a cidade",
    sky: 0x79b8d6, fog: 0x9ab9c4, road: 0x303b48, ground: 0x54755b,
    building: 0x647b89, accent: 0xf5ad4e, obstacleChance: 0.7
  },
  {
    id: 1, name: "Rodovia solar", subtitle: "Atenção aos caminhões e às barreiras",
    sky: 0xe6a66c, fog: 0xd6a47b, road: 0x34363b, ground: 0xa88a55,
    building: 0x95785c, accent: 0xf3d46b, obstacleChance: 0.78
  },
  {
    id: 2, name: "Distrito industrial", subtitle: "Máquinas e cargas fora de controle",
    sky: 0x687d91, fog: 0x687d91, road: 0x303741, ground: 0x505c60,
    building: 0x536875, accent: 0x57c8d4, obstacleChance: 0.82
  },
  {
    id: 3, name: "Estrada litorânea", subtitle: "Curvas, pontes e trechos apertados",
    sky: 0x5daec1, fog: 0x83bdba, road: 0x3b4850, ground: 0x4b9a78,
    building: 0x7da6a1, accent: 0xffd06b, obstacleChance: 0.76
  },
  {
    id: 4, name: "Metrópole neon", subtitle: "A última corrida é a mais perigosa",
    sky: 0x242d58, fog: 0x343b68, road: 0x22283b, ground: 0x303b52,
    building: 0x414d77, accent: 0x54d8e8, obstacleChance: 0.88
  }
];

export class LevelManager {
  getStage(distance: number): StageDefinition {
    const index = Math.floor(Math.max(0, distance) / STAGE_LENGTH) % STAGES.length;
    const cycle = Math.floor(Math.max(0, distance) / (STAGE_LENGTH * STAGES.length));
    const stage = STAGES[index];
    if (cycle === 0) return stage;
    return { ...stage, obstacleChance: Math.min(0.96, stage.obstacleChance + cycle * 0.035) };
  }

  getProgress(distance: number): number {
    return (Math.max(0, distance) % STAGE_LENGTH) / STAGE_LENGTH;
  }

  getStageNumber(distance: number): number {
    return Math.floor(Math.max(0, distance) / STAGE_LENGTH) + 1;
  }

  getAllStages(): readonly StageDefinition[] {
    return STAGES;
  }
}