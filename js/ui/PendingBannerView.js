// PendingBannerView renders a sticky, always-visible banner (pinned under the
// status strip, next to the header) that flags anything the GM still owes
// the game before play can continue cleanly — a status-roll dice entry that
// hasn't been tapped yet, or a fighter who used a Potion/Elixir and is still
// turn-locked. Without this, those cues only showed up on the Combat tab, so
// a GM working on Fighters or Moderator could miss them and stall the game.
// Tapping the banner jumps straight to the Combat tab to resolve it.

import { STATUS_EFFECTS } from '../data/gameData.js';
import { escapeHtml } from '../utils/helpers.js';

export class PendingBannerView {
  constructor(container) {
    this.container = container;
  }

  render(state) {
    const pending = state.pendingStatusRoll;

    if (pending) {
      const target = state.getEntity(pending.targetId);
      const info = STATUS_EFFECTS[pending.effect];
      this.container.innerHTML = `
        <button class="pending-banner is-roll" data-action="goto-combat">
          🎲 Roll owed: ${info.label} on ${target ? escapeHtml(target.name) : '?'} — tap to enter it
        </button>`;
      this.container.style.display = 'block';
      return;
    }

    const locked = state.entities.filter(e => e.turnLocked);
    if (locked.length > 0) {
      const names = locked.map(e => escapeHtml(e.name)).join(', ');
      this.container.innerHTML = `
        <button class="pending-banner is-lock" data-action="goto-combat">
          ⏳ Turn consumed: ${names} — clear when their next turn begins
        </button>`;
      this.container.style.display = 'block';
      return;
    }

    this.container.innerHTML = '';
    this.container.style.display = 'none';
  }
}
