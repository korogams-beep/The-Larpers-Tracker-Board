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
      battleHistory: this.battleHistory
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
}
