// ModeratorView renders the Moderator tab: target/violation pickers, the
// conditional "attempted skill" select for Tongue Twister, and the hint line.

import { VIOLATIONS, SKILL_LABEL } from '../data/gameData.js';
import { escapeHtml } from '../utils/helpers.js';

export class ModeratorView {
  constructor({ targetSelect, typeSelect, skillWrap, skillSelect, hint }) {
    this.targetSelect = targetSelect;
    this.typeSelect = typeSelect;
    this.skillWrap = skillWrap;
    this.skillSelect = skillSelect;
    this.hint = hint;
  }

  render(state) {
    this.targetSelect.innerHTML = state.entities
      .map(e => `<option value="${e.id}">${escapeHtml(e.name)} (${e.class})</option>`)
      .join('');
    if (!state.getEntity(state.violationTargetId)) state.violationTargetId = state.entities[0].id;
    this.targetSelect.value = state.violationTargetId;

    this.typeSelect.value = state.violationType;

    const isTongue = state.violationType === 'tongue-twister';
    this.skillWrap.style.display = isTongue ? 'block' : 'none';

    const v = VIOLATIONS[state.violationType];
    this.hint.textContent = v.forfeit
      ? 'Removes the target from the match immediately.'
      : v.downgrade
        ? "Target's next turn becomes a free Basic Attack."
        : `Applies -${v.hpPenalty} HP${v.consumesMp ? ' and consumes MP for the failed skill' : ''}.`;

    if (isTongue) {
      const target = state.getEntity(state.violationTargetId);
      const cd = target.getClassData();
      this.skillSelect.innerHTML = Object.keys(cd.skills).map(k => {
        const s = cd.skills[k];
        const mpLabel = s.mp === 0 ? '0 MP' : (s.mp > 0 ? `+${s.mp} MP` : `${s.mp} MP`);
        return `<option value="${k}">${SKILL_LABEL[k]} (${mpLabel})</option>`;
      }).join('');
    }
  }
}
