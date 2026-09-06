// GameState owns the roster, the current Turn Action / Moderator selections,
// and the undo history. It has no DOM or rendering knowledge — pure state.

import { PlayerFighter, BossFighter } from '../models/Fighter.js';

const MAX_HISTORY = 20;

export class GameState {
  constructor() {
    this.entities = [
      new PlayerFighter('p1', 'Player 1', 'Warrior'),
      new PlayerFighter('p2', 'Player 2', 'Brawler'),
      new PlayerFighter('p3', 'Player 3', 'Archer'),
      new PlayerFighter('p4', 'Player 4', 'Mage'),
      new BossFighter()
    ];

    this.selectedAttacker = 'p1';
    this.selectedDefender = 'p2';
    this.selectedSkill = null;
    this.selectedCounterOpt = 'none';

    this.round1Active = false;
    this.championId = 'p1';
    this.bossRouteTriggered = false;

    this.violationTargetId = 'p1';
    this.violationType = 'execution-fail';

    this.historyStack = [];

    // Battle archive: each Reset Tournament files the log-so-far away as
    // "Battle N" and the live log starts clean as the next battle number.
    this.battleNumber = 1;
    this.battleHistory = []; // [{ number, logHtml }], newest first

    // Player bracket: 4 leaves (fighter ids in randomized order) feeding
    // into two semifinal winners, feeding into one champion.
    this.bracket = { leaves: [null, null, null, null], finalA: null, finalB: null, champion: null };
  }

  getEntity(id) {
    return this.entities.find(e => e.id === id);
  }

  get players() {
    return this.entities.filter(e => e.type === 'player');
  }

  get boss() {
    return this.getEntity('boss');
  }

  /** Plain-data snapshot of everything undo needs to restore. */
  snapshot() {
    return JSON.parse(JSON.stringify({
      entities: this.entities,
      selectedAttacker: this.selectedAttacker,
      selectedDefender: this.selectedDefender,
      selectedSkill: this.selectedSkill,
      selectedCounterOpt: this.selectedCounterOpt,
      round1Active: this.round1Active,
      championId: this.championId,
      bossRouteTriggered: this.bossRouteTriggered,
      violationTargetId: this.violationTargetId,
      violationType: this.violationType,
      battleNumber: this.battleNumber,
      battleHistory: this.battleHistory,
      bracket: this.bracket
    }));
  }

  /** Restores fields from a snapshot in place, preserving entity class instances. */
  restore(snap) {
    snap.entities.forEach((plain, idx) => Object.assign(this.entities[idx], plain));
    this.selectedAttacker = snap.selectedAttacker;
    this.selectedDefender = snap.selectedDefender;
    this.selectedSkill = snap.selectedSkill;
    this.selectedCounterOpt = snap.selectedCounterOpt;
    this.round1Active = snap.round1Active;
    this.championId = snap.championId;
    this.bossRouteTriggered = snap.bossRouteTriggered;
    this.violationTargetId = snap.violationTargetId;
    this.violationType = snap.violationType;
    this.battleNumber = snap.battleNumber;
    this.battleHistory = snap.battleHistory;
    this.bracket = snap.bracket;
  }

  pushHistory(logHtml) {
    this.historyStack.push({ state: this.snapshot(), logHtml });
    if (this.historyStack.length > MAX_HISTORY) this.historyStack.shift();
  }

  popHistory() {
    return this.historyStack.pop();
  }

  /**
   * Files the current combat log away as "Battle N" and advances the
   * counter so the next live log becomes the next battle number.
   * Skips filing (and does not advance the number) if the log is empty,
   * so an accidental Reset with no actions doesn't create a stray entry.
   */
  archiveCurrentBattle(logHtml) {
    const hasContent = Boolean((logHtml || '').trim());
    if (hasContent) {
      this.battleHistory.unshift({ number: this.battleNumber, logHtml });
      this.battleNumber += 1;
    }
  }

  /** Reset Tournament: every fighter back to class/base max, all modifiers cleared. */
  resetAll() {
    this.entities.forEach(e => {
      if (e.type === 'player') e.applyClass(e.class);
      else e.resetToBase();
    });
    this.round1Active = false;
    this.championId = this.players[0].id;
    this.bossRouteTriggered = false;
    this.selectedSkill = null;
    this.selectedCounterOpt = 'none';
    this.violationType = 'execution-fail';
  }

  /** Randomly shuffles the 4 current players into fresh bracket leaves,
   *  clearing any previous winner picks. */
  generateBracket() {
    const ids = this.players.map(p => p.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    this.bracket = { leaves: ids, finalA: null, finalB: null, champion: null };
  }

  /**
   * Records a match winner. target is 'finalA', 'finalB', or 'champion'.
   * Picking (or re-picking) a semifinal winner clears any champion already
   * chosen, since the finalist pool changed. Picking a champion also syncs
   * championId so Arena's Boss Phase roll / Champion Restore use the result.
   */
  pickBracketWinner(target, fighterId) {
    if (target === 'finalA' || target === 'finalB') {
      this.bracket[target] = fighterId;
      this.bracket.champion = null;
    } else if (target === 'champion') {
      if (!this.bracket.finalA || !this.bracket.finalB) return;
      this.bracket.champion = fighterId;
      this.championId = fighterId;
    }
  }

  /** Derives the current bracket stage and which Arena modifier applies to it. */
  get bracketStage() {
    if (this.bossRouteTriggered) {
      return {
        title: '⚡ Alternate Boss Route',
        modifier: 'All 4 Players (revived) vs Boss Dragon (800 HP) — 4v1 Battle'
      };
    }
    const b = this.bracket;
    if (b.champion) {
      return {
        title: '👑 Tournament Complete',
        modifier: `Champion: ${this.getEntity(b.champion)?.name || '?'} — ready to face the Boss Dragon`
      };
    }
    if (b.finalA && b.finalB) {
      return { title: '🏆 Final (Round 2)', modifier: 'Arena Modifier: All players heal 10 HP per turn' };
    }
    if (b.leaves.every(Boolean)) {
      return { title: '🥊 Semifinals (Round 1)', modifier: 'Arena Modifier: +10 Damage to all attacks' };
    }
    return { title: 'No bracket yet', modifier: 'Tap "Randomize Bracket" to begin' };
  }
}
