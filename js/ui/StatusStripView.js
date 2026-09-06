// StatusStripView renders the always-visible mini strip pinned under the
// header: just the currently selected Attacker and Defender, so there's
// nothing to scroll and no risk of hidden fighters on a phone.

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
        return `<div class="status-chip role-${role} ${downed ? 'is-down' : ''}" data-action="strip-jump" data-id="${e.id}">
          <div class="chip-row1">
            <span class="chip-role">${label}</span>
            <span class="chip-name">${escapeHtml(e.name)}</span>
          </div>
          ${e.type === 'player' ? `<span class="chip-class">${e.class}</span>` : ''}
          <div class="chip-vitals">
            <span class="chip-dot" style="background:${hpColor(p)}"></span><span class="chip-hp">${e.hp}/${e.maxHp}</span>
            <span class="chip-dot chip-dot-mp"></span><span class="chip-mp">${e.mp}/${e.maxMp}</span>
          </div>
        </div>`;
      }).join('');
  }
}
