// CardsView renders the Fighters tab: one card per entity, 2x2 grid with the
// Boss spanning full width (handled purely via CSS grid rules).

import { CLASS_NAMES } from '../data/gameData.js';
import { escapeHtml, pct, hpColor } from '../utils/helpers.js';

export class CardsView {
  constructor(container) {
    this.container = container;
  }

  render(state) {
    this.container.innerHTML = state.entities.map(e => this.cardHtml(e, state)).join('');
  }

  cardHtml(e, state) {
    const remaining = e.maxCounters - e.countersChecked.filter(Boolean).length;
    const isBoss = e.type === 'boss';
    const enraged = isBoss && e.hp > 0 && e.hp <= 200;
    const downed = e.hp <= 0;
    const hpP = pct(e.hp, e.maxHp);
    const isAtk = e.id === state.selectedAttacker;
    const isDef = e.id === state.selectedDefender;

    const classOptions = isBoss
      ? `<option>Boss Dragon</option>`
      : CLASS_NAMES.map(c => `<option value="${c}" ${c === e.class ? 'selected' : ''}>${c}</option>`).join('');

    const countersHtml = isBoss
      ? `<div class="no-counters-note">No Counters</div>`
      : `<div class="counters-row">
           <span class="ctr-label">CTR ${remaining}/${e.maxCounters}</span>
           ${e.countersChecked.map((checked, i) => `
             <label class="counter-box">
               <input type="checkbox" data-action="toggle-counter" data-id="${e.id}" data-index="${i}" ${checked ? 'checked' : ''}>
               <span class="shield"></span>
             </label>`).join('')}
         </div>`;

    const consumablesHtml = isBoss ? '' : `
      <div class="consumables-row">
        <button class="btn-consumable potion" data-action="potion" data-id="${e.id}" ${!e.hasPotion ? 'disabled' : ''}>${e.hasPotion ? '+50 HP' : 'Potion Used'}</button>
        <button class="btn-consumable elixir" data-action="elixir" data-id="${e.id}" ${!e.hasElixir ? 'disabled' : ''}>${e.hasElixir ? '+40 MP' : 'Elixir Used'}</button>
      </div>
      <button class="btn-consumable champion-btn" data-action="champion-restore" data-id="${e.id}" ${!e.hasChampionBlessing ? 'disabled' : ''}>${e.hasChampionBlessing ? '👑 Champion Restore' : '👑 Used'}</button>`;

    const badges = [];
    if (enraged) badges.push(`<span class="enrage-badge">ENRAGED +10 DMG</span>`);
    if (e.atkBuff > 0) badges.push(`<span class="buff-badge">+${e.atkBuff} ATK</span>`);
    if (e.forfeited) badges.push(`<span class="defeated-badge">FORFEITED</span>`);
    else if (downed) badges.push(`<span class="defeated-badge">DOWNED — LAST DITCH</span>`);
    if (e.forcedBasic) badges.push(`<span class="violation-badge">HESITATION</span>`);

    return `
      <div class="card ${isBoss ? 'is-boss' : ''} ${isAtk ? 'is-attacker' : ''} ${isDef ? 'is-defender' : ''}">
        <div class="card-banner">
          <input type="text" class="name-input" value="${escapeHtml(e.name)}" data-action="rename" data-id="${e.id}">
        </div>
        <div class="card-body">
          <select class="class-select" ${isBoss ? 'disabled' : ''} data-action="change-class" data-id="${e.id}">${classOptions}</select>
          <div class="select-row">
            <button class="btn-set-atk ${isAtk ? 'active' : ''}" data-action="set-attacker" data-id="${e.id}">⚔ Attacker</button>
            <button class="btn-set-def ${isDef ? 'active' : ''}" data-action="set-defender" data-id="${e.id}">🛡 Defender</button>
          </div>
          <div class="badge-row">${badges.join('')}</div>
          <div class="stat-row">
            <span class="stat-label">HP</span>
            <div class="bar"><div class="bar-fill hp-fill" style="width:${hpP}%"></div></div>
            <span class="stat-value-wrap"><span class="hp-dot" style="background:${hpColor(hpP)}"></span><span class="stat-value">${e.hp}/${e.maxHp}</span></span>
          </div>
          <div class="stat-row">
            <span class="stat-label">MP</span>
            <div class="bar"><div class="bar-fill mp-fill" style="width:${pct(e.mp, e.maxMp)}%"></div></div>
            <span class="stat-value-wrap"><span class="stat-value">${e.mp}/${e.maxMp}</span></span>
          </div>
          ${countersHtml}
          ${consumablesHtml}
        </div>
      </div>`;
  }
}
