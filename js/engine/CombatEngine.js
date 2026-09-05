// CombatEngine owns the Turn Action resolution rules: MP gating, Last Ditch
// Effort, Hesitation downgrades, dodge/counter math, and defeat detection.

import { CLASS_DATA, BOSS_DATA, SKILL_LABEL } from '../data/gameData.js';
import { clamp } from '../utils/helpers.js';

export class CombatEngine {
  /**
   * @param {GameState} state
   * @param {(text:string)=>void} logFn
   * @param {()=>void} pushHistoryFn
   */
  constructor(state, logFn, pushHistoryFn) {
    this.state = state;
    this.log = logFn;
    this.pushHistory = pushHistoryFn;
  }

  static affordable(attacker, cost) {
    return cost >= 0 ? true : attacker.mp >= Math.abs(cost);
  }

  execute() {
    const state = this.state;
    const attacker = state.getEntity(state.selectedAttacker);
    const defender = state.getEntity(state.selectedDefender);
    const skillKey = state.selectedSkill;

    if (!attacker || !defender) { this.log('Select an attacker and defender first.'); return; }
    if (attacker.id === defender.id) { this.log('Attacker and defender must be different.'); return; }
    if (attacker.forfeited) { this.log(`${attacker.name} has forfeited and cannot act.`); return; }
    if (!skillKey) { this.log('Select a skill for the attacker first.'); return; }

    const atkClassData = attacker.getClassData();
    const skill = atkClassData.skills[skillKey];
    const isLastDitch = attacker.hp <= 0;
    const isForcedBasic = attacker.forcedBasic && !isLastDitch;

    if (isLastDitch && skillKey !== 'ultimate') {
      this.log('At 0 HP, only the Ultimate can be used (Last Ditch Effort).'); return;
    }
    if (isForcedBasic && skillKey !== 'basic') {
      this.log(`${attacker.name} is downgraded to a Basic Attack this turn (Hesitation penalty).`); return;
    }
    if (!isLastDitch && !isForcedBasic && !CombatEngine.affordable(attacker, skill.mp)) {
      this.log(`${attacker.name} does not have enough MP for that skill.`); return;
    }

    this.pushHistory();

    const enraged = attacker.type === 'boss' && attacker.hp > 0 && attacker.hp <= BOSS_DATA.passiveThreshold;
    const bonus = (state.round1Active ? 10 : 0) + (attacker.atkBuff || 0) + (enraged ? BOSS_DATA.passiveBonus : 0);
    const baseDmg = skill.dmg + bonus;

    if (!isForcedBasic) {
      attacker.mp = clamp(attacker.mp + skill.mp, 0, attacker.maxMp);
    }

    let finalDmg = baseDmg;
    let extra = '';
    const counterOpt = state.selectedCounterOpt;

    if (counterOpt === 'dodge') {
      if (skillKey === 'basic') {
        finalDmg = Math.round(baseDmg * 0.5);
        extra = ' — Dodged (Basic, -50% DMG)';
      } else {
        extra = ' — Dodge only reduces Basic attacks; full damage lands';
      }
    } else if (counterOpt === 'counter' && defender.type === 'player' && defender.maxCounters > 0) {
      const cd = CLASS_DATA[defender.class].counter;
      const remaining = defender.maxCounters - defender.countersChecked.filter(Boolean).length;
      const canCounter = defender.mp >= Math.abs(cd.mp) && remaining > 0;

      if (!canCounter) {
        extra = ' — Counter attempted but unavailable (no MP or no counters left); full damage lands';
      } else {
        defender.mp = clamp(defender.mp + cd.mp, 0, defender.maxMp);
        if (cd.type === 'reduce') finalDmg = Math.round(baseDmg * (1 - cd.reduce));
        else if (cd.type === 'absorb') finalDmg = Math.max(baseDmg - cd.absorb, 0);

        let reflectNote = '';
        if (cd.reflect) {
          attacker.hp = clamp(attacker.hp - cd.reflect, 0, attacker.maxHp);
          reflectNote = `, reflects ${cd.reflect} DMG to ${attacker.name}`;
        }
        const idx = defender.countersChecked.indexOf(false);
        if (idx !== -1) defender.countersChecked[idx] = true;
        extra = ` — ${defender.class} Counter (${cd.mp} MP)${reflectNote}`;
      }
    }

    const prevDefenderHp = defender.hp;
    const prevAttackerHp = attacker.hp;
    defender.hp = clamp(defender.hp - finalDmg, 0, defender.maxHp);

    const defenderJustDied = prevDefenderHp > 0 && defender.hp <= 0;
    const attackerJustDied = prevAttackerHp > 0 && attacker.hp <= 0;

    this.log(
      `${attacker.name} used ${SKILL_LABEL[skillKey]} on ${defender.name}: ${baseDmg} base DMG → ${finalDmg} taken${extra}.` +
      `${isLastDitch ? ' [Last Ditch Effort]' : ''}${isForcedBasic ? ' [Hesitation — forced Basic]' : ''}`
    );

    if (isLastDitch && defenderJustDied) {
      this.log(`💀 Both ${attacker.name} and ${defender.name} have fallen!`);
    } else {
      if (defenderJustDied) this.log(`💀 ${defender.name} has been defeated!`);
      if (attackerJustDied) this.log(`💀 ${attacker.name} has fallen from the counter-reflect!`);
    }

    if (isForcedBasic) attacker.forcedBasic = false;
  }
}
