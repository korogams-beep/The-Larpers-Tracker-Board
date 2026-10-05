// StatusStripView renders the always-visible mini strip pinned under the
// header: the currently selected Attacker and Defender side by side, each
// with its own quick-action Potion/Elixir buttons — so a GM can heal or
// restore mana without leaving whatever tab they're on.

import { escapeHtml, pct, hpColor } from '../utils/helpers.js';

export class StatusStripView {
  constructor(container) {
    this.container = container;
  }

  render(state) {
    const atk = state.getEntity(state.selectedAttacker);
    const def = state.getEntity(state.selectedDefender);
    const roles = [
      { entity: atk, role: 'atk', label: '⚔ ATK' },
      { entity: def, role: 'def', label: '🛡 DEF' }
    ];

    this.container.innerHTML = roles
      .filter(r => r.entity)
      .map(({ entity: e, role, label }) => {
        const p = pct(e.hp, e.maxHp);
        const downed = e.hp <= 0;
        const actionsHtml = e.type === 'player' ? `
          <div class="chip-actions">
            <button class="chip-btn potion" data-action="potion" data-id="${e.id}" ${(!e.hasPotion || e.turnLocked) ? 'disabled' : ''}>+50 HP</button>
            <button class="chip-btn elixir" data-action="elixir" data-id="${e.id}" ${(!e.hasElixir || e.turnLocked) ? 'disabled' : ''}>+40 MP</button>
          </div>
          ${e.turnLocked ? `<button class="chip-btn clear-lock" data-action="clear-turn-lock" data-id="${e.id}">⏳ Clear Turn</button>` : ''}` : '';
        return `<div class="status-chip role-${role} ${downed ? 'is-down' : ''}">
          <div class="chip-row1" data-action="strip-jump" data-id="${e.id}">
            <span class="chip-role">${label}</span>
            <span class="chip-name">${escapeHtml(e.name)}</span>
          </div>
          ${e.type === 'player' ? `<span class="chip-class">${e.class}</span>` : ''}
          <div class="chip-vitals">
            <span class="chip-dot" style="background:${hpColor(p)}"></span><span class="chip-hp">${e.hp}/${e.maxHp}</span>
            <span class="chip-dot chip-dot-mp"></span><span class="chip-mp">${e.mp}/${e.maxMp}</span>
          </div>
          ${actionsHtml}
        </div>`;
      }).join('');
  }
}
