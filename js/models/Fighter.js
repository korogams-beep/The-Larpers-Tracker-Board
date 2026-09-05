// Domain models: Fighter is the shared base; PlayerFighter and BossFighter
// specialize how their stats/class-data are resolved.

import { CLASS_DATA, BOSS_DATA } from '../data/gameData.js';

export class Fighter {
  constructor(id, type, name) {
    this.id = id;
    this.type = type;
    this.name = name;
    this.atkBuff = 0;
    this.forcedBasic = false;
    this.forfeited = false;
  }

  get isDowned() {
    return this.hp <= 0;
  }

  /** Returns the rulebook data (skills, counter, thresholds) for this fighter. */
  getClassData() {
    throw new Error('getClassData() must be implemented by subclass');
  }
}

export class PlayerFighter extends Fighter {
  constructor(id, name, className) {
    super(id, 'player', name);
    this.applyClass(className);
  }

  /** Switching class fully resets this fighter to that class's base stats. */
  applyClass(className) {
    const cd = CLASS_DATA[className];
    this.class = className;
    this.maxHp = cd.hp; this.hp = cd.hp;
    this.maxMp = cd.mp; this.mp = cd.mp;
    this.maxCounters = cd.counters;
    this.countersChecked = Array(cd.counters).fill(false);
    this.hasPotion = true;
    this.hasElixir = true;
    this.hasChampionBlessing = true;
    this.atkBuff = 0;
    this.forcedBasic = false;
    this.forfeited = false;
  }

  getClassData() {
    return CLASS_DATA[this.class];
  }
}

export class BossFighter extends Fighter {
  constructor(id = 'boss', name = 'Boss Dragon') {
    super(id, 'boss', name);
    this.class = 'Boss Dragon';
    this.resetToBase();
  }

  getClassData() {
    return BOSS_DATA;
  }

  /** Full Tournament Reset: back to base 400 HP / 120 MP. */
  resetToBase() {
    this.maxHp = BOSS_DATA.hp;
    this.maxMp = BOSS_DATA.mp;
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.maxCounters = 0;
    this.countersChecked = [];
    this.atkBuff = 0;
    this.forcedBasic = false;
    this.forfeited = false;
  }

  /** Alternate Boss Route (4v1): doubles the Dragon's stats to 800 HP. */
  enterBossRoute() {
    this.maxHp = BOSS_DATA.hp * 2;
    this.hp = this.maxHp;
  }
}
