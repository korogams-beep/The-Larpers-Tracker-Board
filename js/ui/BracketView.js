// BracketView renders the 4-player elimination tree: two semifinal
// matchups feeding into a champion. Tapping a leaf records that fighter
// as its match's winner; tapping a decided finalist crowns the champion.
// Once crowned, a "Send Champion to Fight the Dragon" action sets up the
// Combat tab. If the Alternate Boss Route has been triggered, the tree
// is replaced with a simple "All 4 Players vs Boss Dragon" display, since
// there's no single champion in that stage — everyone fights together.
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
    const name = (id) => (id ? (state.getEntity(id)?.name ?? '?') : null);
    const hasBracket = b.leaves.every(Boolean);

    if (!hasBracket) {
      this.container.innerHTML = banner + `
        <div class="bracket-empty">Tap "Randomize Bracket" above to seed the 4 players into a bracket.</div>`;
      return;
    }

    const leafBtn = (id, target) => {
      const winner = b[target];
      const isWinner = winner === id;
      const isEliminated = winner && winner !== id;
      return `<button class="bracket-node ${isWinner ? 'is-winner' : ''} ${isEliminated ? 'is-eliminated' : ''}"
                data-action="pick-winner" data-target="${target}" data-fighter="${id}">
                ${name(id)}
              </button>`;
    };

    const finalBtn = (target) => {
      const id = b[target];
      const canPickChampion = Boolean(b.finalA && b.finalB);
      const isChampionWinner = b.champion === id;
      const isChampionLoser = b.champion && b.champion !== id && canPickChampion;
      const label = id ? name(id) : '?';
      return `<button class="bracket-node ${isChampionWinner ? 'is-winner' : ''} ${isChampionLoser ? 'is-eliminated' : ''}"
                data-action="pick-winner" data-target="champion" data-fighter="${id || ''}"
                ${!id || !canPickChampion ? 'disabled' : ''}>
                ${label}
              </button>`;
    };

    const championLabel = b.champion ? name(b.champion) : '?';

    const sendChampionHtml = b.champion ? `
      <button class="btn" data-action="send-champion">⚔ Send Champion to Fight the Dragon</button>` : '';

    this.container.innerHTML = banner + `
      <div class="bracket-tree">
        <ul>
          <li>
            <button class="bracket-node role-champion ${b.champion ? 'is-winner' : ''}" disabled>${championLabel}</button>
            <ul>
              <li>
                ${finalBtn('finalA')}
                <ul>
                  <li>${leafBtn(b.leaves[0], 'finalA')}</li>
                  <li>${leafBtn(b.leaves[1], 'finalA')}</li>
                </ul>
              </li>
              <li>
                ${finalBtn('finalB')}
                <ul>
                  <li>${leafBtn(b.leaves[2], 'finalB')}</li>
                  <li>${leafBtn(b.leaves[3], 'finalB')}</li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
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
