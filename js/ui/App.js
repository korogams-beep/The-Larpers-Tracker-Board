// App is the composition root: it builds the state, engines, and views,
// wires every DOM event to the right engine/state call, and re-renders
// all views after each change. No game rules live here — only wiring.

import { GameState } from '../state/GameState.js';
import { CombatEngine } from '../engine/CombatEngine.js';
import { ModeratorEngine } from '../engine/ModeratorEngine.js';
import { Logger } from './Logger.js';
import { CardsView } from './CardsView.js';
import { StatusStripView } from './StatusStripView.js';
import { CombatView } from './CombatView.js';
import { ModeratorView } from './ModeratorView.js';
import { ArenaView } from './ArenaView.js';
import { TabNav } from './TabNav.js';
import { HistoryView } from './HistoryView.js';

const RESET_ARM_TIMEOUT_MS = 3000;

export class App {
  constructor() {
    this.state = new GameState();

    this.logger = new Logger(document.getElementById('combatLog'), document.getElementById('logBarLatest'));

    const pushHistory = () => this.state.pushHistory(this.logger.getHtml());
    const log = (text) => this.logger.log(text);

    this.combatEngine = new CombatEngine(this.state, log, pushHistory);
    this.moderatorEngine = new ModeratorEngine(this.state, log, pushHistory);

    this.cardsView = new CardsView(document.getElementById('cardsRow'));
    this.statusStrip = new StatusStripView(document.getElementById('statusStrip'));

    this.combatView = new CombatView({
      attackerSelect: document.getElementById('attackerSelect'),
      defenderSelect: document.getElementById('defenderSelect'),
      skillsWrap: document.getElementById('attackerSkills'),
      counterSelect: document.getElementById('counterSelect'),
      counterInfo: document.getElementById('counterInfo'),
      undoBtn: document.getElementById('undoBtn')
    });

    this.moderatorView = new ModeratorView({
      targetSelect: document.getElementById('violationTarget'),
      typeSelect: document.getElementById('violationType'),
      skillWrap: document.getElementById('tongueTwisterSkillWrap'),
      skillSelect: document.getElementById('tongueTwisterSkill'),
      hint: document.getElementById('violationHint')
    });

    this.arenaView = new ArenaView({
      round1Toggle: document.getElementById('round1Toggle'),
      championSelect: document.getElementById('championSelect'),
      bossRouteBtn: document.getElementById('bossRouteBtn')
    });

    this.tabNav = new TabNav();

    this.historyView = new HistoryView({
      select: document.getElementById('battleSelect'),
      archivedLog: document.getElementById('archivedLog'),
      currentLogWrap: document.getElementById('currentLogWrap')
    });

    this.logBar = document.getElementById('logBar');
    this.logBarToggle = document.getElementById('logBarToggle');
    this.fabExecute = document.getElementById('fabExecute');

    this.resetBtn = document.getElementById('resetBtn');
    this.resetArmed = false;
    this.resetTimer = null;
  }

  init() {
    this.bindEvents();
    this.renderAll();
    this.positionLogBar();
    window.addEventListener('resize', () => this.positionLogBar());
  }

  /** Keeps the persistent log bar (and the FAB above it) pinned correctly
   *  above the tab bar, measured live so it works across devices/safe-areas. */
  positionLogBar() {
    const tabBarH = document.querySelector('.tab-bar').offsetHeight;
    this.logBar.style.bottom = tabBarH + 'px';
    const headerH = this.logBarToggle.offsetHeight;
    this.fabExecute.style.bottom = (tabBarH + headerH + 12) + 'px';
  }

  renderAll() {
    this.cardsView.render(this.state);
    this.statusStrip.render(this.state);
    this.combatView.render(this.state);
    this.moderatorView.render(this.state);
    this.arenaView.render(this.state);
    this.historyView.render(this.state);
    this.tabNav.updateBadges(this.state);
    this.combatView.updateUndoButton(this.state.historyStack.length);
  }

  undo() {
    const snap = this.state.popHistory();
    if (!snap) return;
    this.state.restore(snap.state);
    this.logger.setHtml(snap.logHtml);
    this.renderAll();
  }

  bindEvents() {
    this.bindCardsRow();
    this.bindStatusStrip();
    this.bindCombatTab();
    this.bindModeratorTab();
    this.bindArenaTab();
    this.bindResetButton();
    document.getElementById('fabExecute').addEventListener('click', () => {
      this.tabNav.switchTo('combat');
      this.combatEngine.execute();
      this.renderAll();
    });
    this.logBarToggle.addEventListener('click', () => {
      this.logBar.classList.toggle('expanded');
      this.fabExecute.classList.toggle('log-open', this.logBar.classList.contains('expanded'));
    });
    document.getElementById('battleSelect').addEventListener('change', (e) => {
      this.historyView.setViewing(e.target.value);
      this.historyView.render(this.state);
    });
  }

  bindCardsRow() {
    const row = document.getElementById('cardsRow');

    row.addEventListener('click', (e) => {
      const t = e.target.closest('[data-action]');
      if (!t) return;
      const entity = this.state.getEntity(t.dataset.id);
      if (!entity) return;
      const pushHistory = () => this.state.pushHistory(this.logger.getHtml());

      switch (t.dataset.action) {
        case 'potion':
          if (!entity.hasPotion) return;
          pushHistory();
          entity.hp = Math.min(entity.hp + 50, entity.maxHp);
          entity.hasPotion = false;
          this.logger.log(`${entity.name} drinks a Potion (+50 HP).`);
          this.renderAll();
          break;
        case 'elixir':
          if (!entity.hasElixir) return;
          pushHistory();
          entity.mp = Math.min(entity.mp + 40, entity.maxMp);
          entity.hasElixir = false;
          this.logger.log(`${entity.name} drinks a Mana Elixir (+40 MP).`);
          this.renderAll();
          break;
        case 'champion-restore':
          if (!entity.hasChampionBlessing) return;
          pushHistory();
          entity.hp = entity.maxHp;
          entity.mp = entity.maxMp;
          entity.hasChampionBlessing = false;
          this.logger.log(`👑 ${entity.name} receives the Champion's Blessing — full HP/MP restored!`);
          this.renderAll();
          break;
        case 'toggle-counter': {
          pushHistory();
          const idx = parseInt(t.dataset.index, 10);
          entity.countersChecked[idx] = !entity.countersChecked[idx];
          this.renderAll();
          break;
        }
        case 'set-attacker':
          this.state.selectedAttacker = entity.id;
          this.state.selectedSkill = null;
          this.renderAll();
          this.tabNav.switchTo('combat');
          break;
        case 'set-defender':
          this.state.selectedDefender = entity.id;
          this.renderAll();
          this.tabNav.switchTo('combat');
          break;
      }
    });

    row.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.action === 'rename') {
        const entity = this.state.getEntity(t.dataset.id);
        entity.name = t.value.trim() || entity.name;
        this.renderAll();
      } else if (t.dataset.action === 'change-class') {
        const entity = this.state.getEntity(t.dataset.id);
        entity.applyClass(t.value);
        this.renderAll();
      }
    });
  }

  bindStatusStrip() {
    document.getElementById('statusStrip').addEventListener('click', (e) => {
      if (!e.target.closest('[data-action="strip-jump"]')) return;
      this.tabNav.switchTo('fighters');
    });
  }

  bindCombatTab() {
    document.getElementById('attackerSelect').addEventListener('change', (e) => {
      this.state.selectedAttacker = e.target.value;
      this.state.selectedSkill = null;
      this.renderAll();
    });

    document.getElementById('defenderSelect').addEventListener('change', (e) => {
      this.state.selectedDefender = e.target.value;
      this.renderAll();
    });

    document.getElementById('counterSelect').addEventListener('change', (e) => {
      this.state.selectedCounterOpt = e.target.value;
      this.combatView.renderCounterInfo(this.state);
    });

    document.getElementById('attackerSkills').addEventListener('click', (e) => {
      const t = e.target.closest('[data-action="select-skill"]');
      if (!t || t.disabled) return;
      this.state.selectedSkill = t.dataset.skill;
      this.combatView.renderSkills(this.state);
    });

    document.getElementById('executeBtn').addEventListener('click', () => {
      this.combatEngine.execute();
      this.renderAll();
    });

    document.getElementById('undoBtn').addEventListener('click', () => this.undo());
  }

  bindModeratorTab() {
    document.getElementById('violationTarget').addEventListener('change', (e) => {
      this.state.violationTargetId = e.target.value;
      this.moderatorView.render(this.state);
    });

    document.getElementById('violationType').addEventListener('change', (e) => {
      this.state.violationType = e.target.value;
      this.moderatorView.render(this.state);
    });

    document.getElementById('applyViolationBtn').addEventListener('click', () => {
      const skillKey = document.getElementById('tongueTwisterSkill').value;
      this.moderatorEngine.apply(skillKey);
      this.renderAll();
    });
  }

  bindArenaTab() {
    document.getElementById('round1Toggle').addEventListener('change', (e) => {
      this.state.pushHistory(this.logger.getHtml());
      this.state.round1Active = e.target.checked;
      this.logger.log(this.state.round1Active
        ? '🗡 Round 1 modifier active: +10 DMG to all attacks.'
        : 'Round 1 modifier cleared.');
      this.renderAll();
    });

    document.getElementById('round2HealBtn').addEventListener('click', () => {
      this.state.pushHistory(this.logger.getHtml());
      this.state.players.forEach(p => { p.hp = Math.min(p.hp + 10, p.maxHp); });
      this.logger.log('🌿 Round 2 modifier: all players heal +10 HP.');
      this.renderAll();
    });

    document.getElementById('championSelect').addEventListener('change', (e) => {
      this.state.championId = e.target.value;
    });

    document.querySelectorAll('#bossPhaseDice .dice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const roll = parseInt(btn.dataset.roll, 10);
        this.state.pushHistory(this.logger.getHtml());
        const boss = this.state.boss;
        if (roll <= 3) {
          boss.atkBuff = (boss.atkBuff || 0) + 10;
          this.logger.log(`🎲 Boss Phase (physical roll: ${roll}) — Dragon gains +10 ATK!`);
        } else {
          const champ = this.state.getEntity(this.state.championId);
          if (champ) {
            champ.atkBuff = (champ.atkBuff || 0) + 10;
            this.logger.log(`🎲 Boss Phase (physical roll: ${roll}) — Champion ${champ.name} gains +10 ATK!`);
          }
        }
        this.renderAll();
      });
    });

    document.getElementById('bossRouteBtn').addEventListener('click', () => {
      if (this.state.bossRouteTriggered) return;
      if (!this.state.players.every(p => p.hp <= 0)) return;
      this.state.pushHistory(this.logger.getHtml());
      this.state.players.forEach(p => { p.hp = p.maxHp; p.mp = p.maxMp; p.forfeited = false; });
      this.state.boss.enterBossRoute();
      this.state.bossRouteTriggered = true;
      this.logger.log("⚡ Alternate Boss Route triggered! All players revived to full HP/MP — Boss Dragon's stats are doubled (800 HP) for the 4v1 showdown.");
      this.renderAll();
    });
  }

  bindResetButton() {
    this.resetBtn.addEventListener('click', () => {
      if (!this.resetArmed) {
        this.resetArmed = true;
        this.resetBtn.textContent = 'Tap to Confirm';
        this.resetBtn.classList.add('armed');
        clearTimeout(this.resetTimer);
        this.resetTimer = setTimeout(() => {
          this.resetArmed = false;
          this.resetBtn.textContent = '⟲';
          this.resetBtn.classList.remove('armed');
        }, RESET_ARM_TIMEOUT_MS);
        return;
      }

      this.resetArmed = false;
      clearTimeout(this.resetTimer);
      this.resetBtn.textContent = '⟲';
      this.resetBtn.classList.remove('armed');

      this.state.pushHistory(this.logger.getHtml());
      this.state.archiveCurrentBattle(this.logger.getHtml());
      this.state.resetAll();
      this.historyView.setViewing('current');
      this.logger.clear();
      this.logger.log(`— Tournament reset: HP/MP restored, counters cleared, potions/elixirs/blessings refreshed, modifiers cleared — Battle ${this.state.battleNumber} begins —`);
      this.renderAll();
    });
  }
}
