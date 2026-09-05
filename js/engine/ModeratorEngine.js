// ModeratorEngine applies the Violations & Penalties table to a target fighter.

import { VIOLATIONS, SKILL_LABEL } from '../data/gameData.js';
import { clamp } from '../utils/helpers.js';

export class ModeratorEngine {
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

  /** @param {string} tongueTwisterSkillKey which skill was being attempted (Tongue Twister only) */
  apply(tongueTwisterSkillKey) {
    const state = this.state;
    const target = state.getEntity(state.violationTargetId);
    const v = VIOLATIONS[state.violationType];
    if (!target || !v) return;

    this.pushHistory();

    if (v.forfeit) {
      target.forfeited = true;
      target.hp = 0;
      target.mp = 0;
      this.log(`🚫 Moderator calls '${v.call}' on ${target.name} — immediate forfeiture of the match.`);
      return;
    }

    if (v.downgrade) {
      target.forcedBasic = true;
      this.log(`⏱ Moderator calls '${v.call}' on ${target.name} — next action downgraded to a free Basic Attack.`);
      return;
    }

    const prevHp = target.hp;
    target.hp = clamp(target.hp - v.hpPenalty, 0, target.maxHp);

    let mpNote = '';
    if (v.consumesMp) {
      const cd = target.getClassData();
      const skill = cd.skills[tongueTwisterSkillKey];
      if (skill && skill.mp < 0) {
        target.mp = clamp(target.mp + skill.mp, 0, target.maxMp);
        mpNote = `, ${Math.abs(skill.mp)} MP consumed on the failed ${SKILL_LABEL[tongueTwisterSkillKey]}`;
      }
    }

    this.log(`⚠ Moderator calls '${v.call}' on ${target.name} — -${v.hpPenalty} HP${mpNote}.`);
    if (prevHp > 0 && target.hp <= 0) this.log(`💀 ${target.name} has been defeated by penalty!`);
  }
}
