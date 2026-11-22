const BEST_KEY = "rota-relampago-best-v2";
const LEGACY_BEST_KEY = "rota-relampago-best-v1";
const COINS_KEY = "rota-relampago-coins-v1";
const UNLOCK_KEY = "rota-relampago-unlocked-stage-v1";

export class SaveManager {
  getBest(): number {
    return Math.max(this.readNumber(BEST_KEY), this.readNumber(LEGACY_BEST_KEY));
  }

  getTotalCoins(): number {
    return this.readNumber(COINS_KEY);
  }

  getUnlockedStage(): number {
    return Math.max(0, this.readNumber(UNLOCK_KEY));
  }

  recordRun(score: number, coins: number, stageIndex: number): number {
    const best = Math.max(this.getBest(), Math.floor(score));
    this.writeNumber(BEST_KEY, best);
    this.writeNumber(COINS_KEY, this.getTotalCoins() + Math.max(0, Math.floor(coins)));
    this.writeNumber(UNLOCK_KEY, Math.max(this.getUnlockedStage(), stageIndex));
    return best;
  }

  private readNumber(key: string): number {
    try {
      const value = Number(localStorage.getItem(key) ?? 0);
      return Number.isFinite(value) ? value : 0;
    } catch {
      return 0;
    }
  }

  private writeNumber(key: string, value: number): void {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      // O jogo continua funcionando sem armazenamento persistente.
    }
  }
}