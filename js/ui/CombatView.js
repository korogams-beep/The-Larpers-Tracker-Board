// CombatView renders the Attacker/Defender selects, the attacker's skill
// buttons (with MP-affordability and Last-Ditch/Hesitation gating reflected
// visually), the counter info line, and the Undo button state.

import { CLASS_DATA, BOSS_DATA, SKILL_LABEL } from '../data/gameData.js';
import { escapeHtml } from '../utils/helpers.js';
import { CombatEngine } from '../engine/CombatEngine.js';

export class CombatView {
  constructor({ attackerSelect, defenderSelect, skillsWrap, counterSelect, counterInfo, undoBtn }) {
    this.attackerSelect = attackerSelect;
    this.defenderSelect = defenderSelect;
    this.skillsWrap = skillsWrap;
    this.counterSelect = counterSelect;
    this.counterInfo = counterInfo;
    this.undoBtn = undoBtn;
  }

  render(state) {
    this.renderSelects(state);
    this.renderSkills(state);
    this.renderCounterInfo(state);
  }

  renderSelects(state) {
    const optionsHtml = state.entities
      .map(e => `<option value="${e.id}">${escapeHtml(e.name)} (${e.class})${e.hp <= 0 ? ' [DOWNED]' : ''}</option>`)
      .join('');
    this.attackerSelect.innerHTML = optionsHtml;
    this.defenderSelect.innerHTML = optionsHtml;
    if (!state.getEntity(state.selectedAttacker)) state.selectedAttacker = state.entities[0].id;
    if (!state.getEntity(state.selectedDefender)) state.selectedDefender = state.entities[1].id;
    this.attackerSelect.value = state.selectedAttacker;
    this.defenderSelect.value = state.selectedDefender;
  }

  renderSkills(state) {
    const attacker = state.getEntity(state.selectedAttacker);
    if (!attacker) { this.skillsWrap.innerHTML = ''; return; }

    if (attacker.forfeited) {
      this.skillsWrap.innerHTML = `<div class="last-ditch-note">🚫 ${attacker.name} has forfeited and cannot act.</div>`;
      state.selectedSkill = null;
      return;
    }

    const cd = attacker.getClassData();
    const enraged = attacker.type === 'boss' && attacker.hp > 0 && attacker.hp <= BOSS_DATA.passiveThreshold;
    const isLastDitch = attacker.hp <= 0;
    const bonus = (state.round1Active ? 10 : 0) + (attacker.atkBuff || 0) + (enraged ? BOSS_DATA.passiveBonus : 0);

    if (attacker.forcedBasic && !isLastDitch) {
      const s = cd.skills.basic;
      const dmg = s.dmg + bonus;
      this.skillsWrap.innerHTML = `<div class="last-ditch-note">⏱ Hesitation penalty — this turn is downgraded to a free Basic Attack.</div>
        <button class="skill-btn selected" data-action="select-skill" data-skill="basic">
          <span class="sk-name">Basic</span><span class="sk-stats">0 MP (forced) · ${dmg} DMG</span>
        </button>`;
      state.selectedSkill = 'basic';
      return;
    }

    let html = isLastDitch ? `<div class="last-ditch-note">⚠ Last Ditch Effort — HP is 0, only Ultimate can be cast.</div>` : '';

    html += Object.keys(cd.skills).map(key => {
      const s = cd.skills[key];
      const dmg = s.dmg + bonus;
      const mpLabel = s.mp === 0 ? '0 MP' : (s.mp > 0 ? `+${s.mp} MP` : `${s.mp} MP`);
      const canAffordMp = CombatEngine.affordable(attacker, s.mp);
      const disabled = isLastDitch ? key !== 'ultimate' : !canAffordMp;
      const selected = (state.selectedSkill === key && !disabled) ? 'selected' : '';
      let note = '';
      if (!isLastDitch && !canAffordMp) note = ' · Not enough MP';
      if (s.stun) note += ' · Stun';
      return `<button class="skill-btn ${selected}" data-action="select-skill" data-skill="${key}" ${disabled ? 'disabled' : ''}>
                <span class="sk-name">${SKILL_LABEL[key]}</span>
                <span class="sk-stats">${mpLabel} · ${dmg} DMG${enraged ? ' 🔥' : ''}${note}</span>
              </button>`;
    }).join('');

    this.skillsWrap.innerHTML = html;

    const stillValid = state.selectedSkill && (isLastDitch
      ? state.selectedSkill === 'ultimate'
      : CombatEngine.affordable(attacker, cd.skills[state.selectedSkill]?.mp ?? -Infinity));
    if (state.selectedSkill && !stillValid) state.selectedSkill = null;
  }

  renderCounterInfo(state) {
    const defender = state.getEntity(state.selectedDefender);
    this.counterSelect.value = state.selectedCounterOpt;
    const counterOptionEl = this.counterSelect.querySelector('option[value="counter"]');

    if (!defender || defender.type === 'boss' || defender.maxCounters === 0) {
      counterOptionEl.disabled = true;
      if (state.selectedCounterOpt === 'counter') { state.selectedCounterOpt = 'none'; this.counterSelect.value = 'none'; }
      this.counterInfo.textContent = defender && defender.type === 'boss' ? 'Boss Dragon has no counter ability.' : '';
      return;
    }

    const remaining = defender.maxCounters - defender.countersChecked.filter(Boolean).length;
    const cd = CLASS_DATA[defender.class].counter;
    const mpOk = defender.mp >= Math.abs(cd.mp);
    counterOptionEl.disabled = remaining <= 0 || !mpOk;
    if (state.selectedCounterOpt === 'counter' && counterOptionEl.disabled) {
      state.selectedCounterOpt = 'none'; this.counterSelect.value = 'none';
    }

    let desc = `${defender.class} Counter: ${cd.mp} MP, `;
    desc += cd.type === 'reduce' ? `-${cd.reduce * 100}% DMG taken` : `absorbs ${cd.absorb} flat DMG`;
    if (cd.reflect) desc += `, reflects ${cd.reflect} DMG`;
    desc += `. Remaining: ${remaining}/${defender.maxCounters}.`;
    if (remaining > 0 && !mpOk) desc += ' Not enough MP to counter!';
    this.counterInfo.textContent = desc;
  }

  updateUndoButton(historyLength) {
    this.undoBtn.disabled = historyLength === 0;
  }
}
