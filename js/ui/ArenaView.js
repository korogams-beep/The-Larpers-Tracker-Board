// ArenaView renders the Arena Modifiers tab: Round 1 toggle, Champion
// picker, and the Boss Route button's disabled state.

import { escapeHtml } from '../utils/helpers.js';

export class ArenaView {
  constructor({ round1Toggle, championSelect, bossRouteBtn }) {
    this.round1Toggle = round1Toggle;
    this.championSelect = championSelect;
    this.bossRouteBtn = bossRouteBtn;
  }

  render(state) {
    this.round1Toggle.checked = state.round1Active;
    this.championSelect.innerHTML = state.players
      .map(p => `<option value="${p.id}" ${p.id === state.championId ? 'selected' : ''}>${escapeHtml(p.name)}</option>`)
      .join('');
    this.bossRouteBtn.disabled = state.bossRouteTriggered;
  }
}
