// BracketView renders the 4-player elimination bracket as three clearly
// labeled rounds (Semifinal 1, Semifinal 2, Final) stacked vertically,
// each a simple "A vs B" row — no connector-line tricks that can misalign
// or force horizontal scrolling on a phone. Tapping a fighter records
// them as their match's winner; tapping a decided finalist crowns the
// champion. Once crowned, a "Send Champion to Fight the Dragon" action
// sets up the Combat tab. If the Alternate Boss Route has been triggered,
// this is replaced with a simple "All 4 Players vs Boss Dragon" display,
// since there's no single champion in that stage — everyone fights together.
// Purely a renderer — App wires the actual click handling.

import { escapeHtml } from '../utils/helpers.js';

export class BracketView {
  constructor(container) {
    this.container = container;
  }

  render(state) {
    const stage = state.bracketStage;
    const banner = `
      <div class="bracket-banner">
        <div class="bracket-banner-title">${stage.title}</div>
        <div class="bracket-banner-modifier">${stage.modifier}</div>
      </div>`;

    if (state.bossRouteTriggered) {
      this.container.innerHTML = banner + this.routeHtml(state);
      return;
    }

    const b = state.bracket;
    const name = (id) => (id ? (state.getEntity(id)?.name ?? '?') : '?');
    const hasBracket = b.leaves.every(Boolean);

    if (!hasBracket) {
      this.container.innerHTML = banner + `
        <div class="bracket-empty">Tap "Randomize Bracket" above to seed the 4 players into a bracket.</div>`;
      return;
    }

    const matchupBtn = (id, target) => {
      const winner = b[target];
      const isWinner = winner === id;
      const isEliminated = winner && winner !== id;
      return `<button class="bracket-node ${isWinner ? 'is-winner' : ''} ${isEliminated ? 'is-eliminated' : ''}"
                data-action="pick-winner" data-target="${target}" data-fighter="${id}">${name(id)}</button>`;
    };

    const finalNode = (target) => {
      const id = b[target];
      const canPickChampion = Boolean(b.finalA && b.finalB);
      const isWin = b.champion === id;
      const isLose = b.champion && b.champion !== id && canPickChampion;
      return `<button class="bracket-node ${isWin ? 'is-winner' : ''} ${isLose ? 'is-eliminated' : ''}"
                data-action="pick-winner" data-target="champion" data-fighter="${id || ''}"
                ${!id || !canPickChampion ? 'disabled' : ''}>${id ? name(id) : '?'}</button>`;
    };

    const championLabel = b.champion ? name(b.champion) : '?';
    const sendChampionHtml = b.champion ? `
      <button class="btn" data-action="send-champion">⚔ Send Champion to Fight the Dragon</button>` : '';

    this.container.innerHTML = banner + `
      <div class="bracket-rounds">
        <div class="bracket-round">
          <div class="bracket-round-title">Semifinal 1</div>
          <div class="bracket-matchup">
            ${matchupBtn(b.leaves[0], 'finalA')}
            <span class="bracket-vs-sm">VS</span>
            ${matchupBtn(b.leaves[1], 'finalA')}
          </div>
        </div>
        <div class="bracket-round">
          <div class="bracket-round-title">Semifinal 2</div>
          <div class="bracket-matchup">
            ${matchupBtn(b.leaves[2], 'finalB')}
            <span class="bracket-vs-sm">VS</span>
            ${matchupBtn(b.leaves[3], 'finalB')}
          </div>
        </div>
        <div class="bracket-round bracket-final-round">
          <div class="bracket-round-title">Final</div>
          <div class="bracket-matchup">
            ${finalNode('finalA')}
            <span class="bracket-vs-sm">VS</span>
            ${finalNode('finalB')}
          </div>
        </div>
        <div class="bracket-round bracket-champion-round">
          <div class="bracket-round-title">Champion</div>
          <button class="bracket-node role-champion ${b.champion ? 'is-winner' : ''}" disabled>${championLabel}</button>
        </div>
      </div>
      ${sendChampionHtml}`;
  }

  routeHtml(state) {
    const playersHtml = state.players
      .map(p => `<div class="bracket-node ${p.hp <= 0 ? '' : 'is-winner'}">${escapeHtml(p.name)}</div>`)
      .join('');
    const boss = state.boss;
    return `
      <div class="bracket-route">
        <div class="bracket-route-players">${playersHtml}</div>
        <div class="bracket-vs">⚔ VS ⚔</div>
        <div class="bracket-node role-champion">${escapeHtml(boss.name)} (${boss.hp}/${boss.maxHp} HP)</div>
      </div>`;
  }
}