// CombatEngine owns the Turn Action resolution rules: MP gating, Turn-Lock
// (Potion/Elixir), Last Ditch Effort, Hesitation downgrades, dodge/counter
// math, status effects (Stun/Shatter/Blind/Burn), and defeat detection.

import { CLASS_DATA, BOSS_DATA, SKILL_LABEL, STATUS_EFFECTS, STATUS_FIELD } from '../data/gameData.js';
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
    if (defender.forfeited) { this.log(`${defender.name} has forfeited and cannot be targeted.`); return; }
    if (defender.hp <= 0) { this.log(`${defender.name} is already downed and cannot be targeted.`); return; }
    if (attacker.turnLocked) {
      this.log(`${attacker.name} already used a Potion/Elixir this turn and cannot attack. Use "Clear Turn Lock" once their next turn begins.`);
      return;
    }

    // Last Ditch Effort only exists in the final Champion vs Boss Dragon duel.
    // Everywhere else, hitting 0 HP simply takes a fighter out of the match.
    if (attacker.hp <= 0 && !state.championDuelActive) {
      this.log(`${attacker.name} is downed and out of the fight. Last Ditch Effort only applies in the Champion vs Boss Dragon duel.`);
      return;
    }

    // Stun resolves on its own — the attacker loses the whole turn, no
    // skill needs to be selected to "use up" a stunned turn.
    if (attacker.statusStun) {
      this.pushHistory();
      attacker.statusStun = false;
      if (attacker.forcedBasic) attacker.forcedBasic = false;
      if (attacker.statusBurn) {
        attacker.hp = clamp(attacker.hp - 15, 0, attacker.maxHp);
        attacker.statusBurn = false;
        this.log(`🔥 ${attacker.name} takes 15 Burn DMG at the start of their turn.`);
        if (attacker.hp <= 0) {
          this.log(`💀 ${attacker.name} has succumbed to burn damage!`);
        }
      }
      this.log(`💫 ${attacker.name} is Stunned and loses their turn!`);
      this.swapAttackerDefender();
      return;
    }

    if (!skillKey) { this.log('Select a skill for the attacker first.'); return; }

    const atkClassData = attacker.getClassData();
    const skill = atkClassData.skills[skillKey];
    const isLastDitch = attacker.hp <= 0 && state.championDuelActive;
    const isForcedBasic = attacker.forcedBasic && !isLastDitch;

    if (isLastDitch && attacker.lastDitchUsed) {
      this.log(`${attacker.name} has already used their one Last Ditch Effort and cannot act again at 0 HP.`); return;
    }
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

    // Last Ditch Effort is a once-per-match privilege — mark it spent the
    // moment the downed fighter commits to this Ultimate.
    if (isLastDitch) attacker.lastDitchUsed = true;

    // Burn ticks at the start of the burned fighter's turn, before they act.
    if (attacker.statusBurn) {
      attacker.hp = clamp(attacker.hp - 15, 0, attacker.maxHp);
      attacker.statusBurn = false;
      this.log(`🔥 ${attacker.name} takes 15 Burn DMG at the start of their turn.`);
      if (attacker.hp <= 0 && !state.championDuelActive) {
        this.log(`💀 ${attacker.name} has succumbed to burn damage!`);
        this.swapAttackerDefender();
        return;
      }
    }

    const isRound1PlayerMatch = state.round1Active && attacker.type !== 'boss' && !state.championDuelActive;
    const bonus = (isRound1PlayerMatch ? 10 : 0) + (attacker.atkBuff || 0);
    const baseDmg = skill.dmg + bonus;

    if (!isForcedBasic) {
      attacker.mp = clamp(attacker.mp + skill.mp, 0, attacker.maxMp);
    }

    let finalDmg = baseDmg;
    let extra = '';
    const prevAttackerHp = attacker.hp;
    const counterOpt = state.selectedCounterOpt;

    if (counterOpt === 'dodge') {
      if (skillKey === 'basic') {
        finalDmg = Math.round(baseDmg * 0.5);
        extra = ' — Dodged (Basic, -50% DMG)';
      } else {
        extra = ' — Dodge only reduces Basic attacks; full damage lands';
      }
    } else if (counterOpt === 'counter' && defender.statusShatter) {
      extra = ' — Shattered! Counter is disabled this turn; full damage lands';
      defender.statusShatter = false;
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

    // Blind halves the blinded fighter's own next attack, applied after
    // dodge/counter math so it stacks correctly with whatever else happened.
    if (attacker.statusBlind) {
      finalDmg = Math.round(finalDmg * 0.5);
      extra += ' (Blinded: -50% DMG)';
      attacker.statusBlind = false;
    }

    const prevDefenderHp = defender.hp;
    defender.hp = clamp(defender.hp - finalDmg, 0, defender.maxHp);

    const defenderJustDied = prevDefenderHp > 0 && defender.hp <= 0;
    const attackerJustDied = prevAttackerHp > 0 && attacker.hp <= 0;

    this.log(
      `${attacker.name} used ${SKILL_LABEL[skillKey]} on ${defender.name}: ${baseDmg} base DMG → ${finalDmg} taken${extra}.` +
      `${isLastDitch ? ' [Last Ditch Effort]' : ''}${isForcedBasic ? ' [Hesitation — forced Basic]' : ''}`
    );

    if (isLastDitch && defenderJustDied) {
      if (defender.type === 'boss') {
        // The Champion was already at 0 HP — this Ultimate was their one
        // shot, and it landed. That's a win, not a mutual fall.
        this.log(`🏆 ${attacker.name}'s Last Ditch Effort brings down the Boss Dragon! Battered but victorious — ${attacker.name} wins the duel!`);
      } else {
        // The Dragon was already at 0 HP and took the Champion down on its
        // way out — neither combatant is left standing.
        this.log(`💀 Both ${attacker.name} and ${defender.name} have fallen!`);
      }
    } else {
      if (defenderJustDied) this.log(`💀 ${defender.name} has been defeated!`);
      if (attackerJustDied) this.log(`💀 ${attacker.name} has fallen from the counter-reflect!`);
    }

    if (isForcedBasic) attacker.forcedBasic = false;

    // If the skill used can inflict a status effect and the hit landed on a
    // target still standing, queue the GM's physical 1d6 roll to resolve it.
    if (skill.status && defender.hp > 0) {
      state.pendingStatusRoll = { effect: skill.status, targetId: defender.id };
    }

    this.swapAttackerDefender();
  }

  /** Flips Attacker/Defender once a turn finishes, so the GM doesn't have to
   *  manually swap roles each turn. This runs after pushHistory() already
   *  snapshotted the pre-swap pairing, so Undo puts it right back. */
  swapAttackerDefender() {
    const state = this.state;
    const defender = state.getEntity(state.selectedDefender);
    const canLastDitch = defender && defender.hp <= 0 && state.championDuelActive && !defender.lastDitchUsed;
    if (defender && (defender.forfeited || (defender.hp <= 0 && !canLastDitch))) {
      state.selectedSkill = null;
      state.selectedCounterOpt = 'none';
      return;
    }
    [state.selectedAttacker, state.selectedDefender] = [state.selectedDefender, state.selectedAttacker];
    state.selectedSkill = null;
    state.selectedCounterOpt = 'none';
  }

  /** Resolves a queued status roll from the GM's physical 1d6: odd fails, even succeeds. */
  resolveStatusRoll(roll) {
    const state = this.state;
    const pending = state.pendingStatusRoll;
    if (!pending) return;

    const target = state.getEntity(pending.targetId);
    const info = STATUS_EFFECTS[pending.effect];
    const success = roll % 2 === 0;

    if (success && target) {
      target[STATUS_FIELD[pending.effect]] = true;
      this.log(`🎲 Status roll: ${roll} (even) — ${info.label} succeeds on ${target.name}! ${info.description}`);
    } else {
      this.log(`🎲 Status roll: ${roll} (odd) — ${info.label} fails.`);
    }

    state.pendingStatusRoll = null;
  }
}
