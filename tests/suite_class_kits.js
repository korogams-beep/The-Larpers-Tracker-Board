import { CLASS_DATA, BOSS_DATA } from '../js/data/gameData.js';
import { createTestEnv } from './test_helpers.js';

export function runClassKitsTests(runner) {
  runner.suite('1. Class Kits & Base Stats');

  runner.test('Warrior Kit Base Stats & Skills Verification', () => {
    const { state } = createTestEnv();
    const warrior = state.getEntity('p1');
    runner.assertEqual(warrior.maxHp, 200, 'Warrior Max HP should be 200');
    runner.assertEqual(warrior.hp, 200, 'Warrior starting HP should be 200');
    runner.assertEqual(warrior.maxMp, 60, 'Warrior Max MP should be 60');
    runner.assertEqual(warrior.mp, 60, 'Warrior starting MP should be 60');
    runner.assertEqual(warrior.maxCounters, 2, 'Warrior Counter count should be 2');

    const kit = CLASS_DATA.Warrior;
    runner.assertEqual(kit.skills.basic.dmg, 25, 'Warrior Basic damage is 25');
    runner.assertEqual(kit.skills.basic.mp, 5, 'Warrior Basic regens +5 MP');
    runner.assertEqual(kit.skills.primary.dmg, 45, 'Warrior Primary damage is 45');
    runner.assertEqual(kit.skills.primary.mp, -20, 'Warrior Primary costs 20 MP');
    runner.assertEqual(kit.skills.ultimate.dmg, 65, 'Warrior Ultimate damage is 65');
    runner.assertEqual(kit.skills.ultimate.mp, -40, 'Warrior Ultimate costs 40 MP');
    runner.assertEqual(kit.skills.ultimate.status, 'stun', 'Warrior Ultimate inflicts stun');
    runner.assertEqual(kit.counter.reflect, 10, 'Warrior Counter reflects 10 DMG');
    runner.assertEqual(kit.counter.reduce, 0.5, 'Warrior Counter reduces DMG by 50%');
  });

  runner.test('Brawler Kit Base Stats & Skills Verification', () => {
    const { state } = createTestEnv();
    const brawler = state.getEntity('p2');
    runner.assertEqual(brawler.maxHp, 210, 'Brawler Max HP should be 210');
    runner.assertEqual(brawler.hp, 210, 'Brawler starting HP should be 210');
    runner.assertEqual(brawler.maxMp, 40, 'Brawler Max MP should be 40');
    runner.assertEqual(brawler.mp, 40, 'Brawler starting MP should be 40');
    runner.assertEqual(brawler.maxCounters, 3, 'Brawler Counter count should be 3');

    const kit = CLASS_DATA.Brawler;
    runner.assertEqual(kit.skills.basic.dmg, 30, 'Brawler Basic damage is 30');
    runner.assertEqual(kit.skills.basic.mp, 5, 'Brawler Basic regens +5 MP');
    runner.assertEqual(kit.skills.primary.dmg, 35, 'Brawler Primary damage is 35');
    runner.assertEqual(kit.skills.primary.mp, -10, 'Brawler Primary costs 10 MP');
    runner.assertEqual(kit.skills.ultimate.dmg, 80, 'Brawler Ultimate damage is 80');
    runner.assertEqual(kit.skills.ultimate.mp, -25, 'Brawler Ultimate costs 25 MP');
    runner.assertEqual(kit.skills.ultimate.status, 'shatter', 'Brawler Ultimate inflicts shatter');
    runner.assertEqual(kit.counter.reduce, 0.5, 'Brawler Counter reduces DMG by 50%');
  });

  runner.test('Archer Kit Base Stats & Skills Verification', () => {
    const { state } = createTestEnv();
    const archer = state.getEntity('p3');
    runner.assertEqual(archer.maxHp, 180, 'Archer Max HP should be 180');
    runner.assertEqual(archer.hp, 180, 'Archer starting HP should be 180');
    runner.assertEqual(archer.maxMp, 80, 'Archer Max MP should be 80');
    runner.assertEqual(archer.mp, 80, 'Archer starting MP should be 80');
    runner.assertEqual(archer.maxCounters, 2, 'Archer Counter count should be 2');

    const kit = CLASS_DATA.Archer;
    runner.assertEqual(kit.skills.basic.dmg, 35, 'Archer Basic damage is 35');
    runner.assertEqual(kit.skills.basic.mp, 5, 'Archer Basic regens +5 MP');
    runner.assertEqual(kit.skills.primary.dmg, 50, 'Archer Primary damage is 50');
    runner.assertEqual(kit.skills.primary.mp, -25, 'Archer Primary costs 25 MP');
    runner.assertEqual(kit.skills.primary.status, 'blind', 'Archer Primary inflicts blind');
    runner.assertEqual(kit.skills.ultimate.dmg, 85, 'Archer Ultimate damage is 85');
    runner.assertEqual(kit.skills.ultimate.mp, -50, 'Archer Ultimate costs 50 MP');
    runner.assertEqual(kit.counter.reduce, 0.5, 'Archer Counter reduces DMG by 50%');
  });

  runner.test('Mage Kit Base Stats & Skills Verification', () => {
    const { state } = createTestEnv();
    const mage = state.getEntity('p4');
    runner.assertEqual(mage.maxHp, 160, 'Mage Max HP should be 160');
    runner.assertEqual(mage.hp, 160, 'Mage starting HP should be 160');
    runner.assertEqual(mage.maxMp, 110, 'Mage Max MP should be 110');
    runner.assertEqual(mage.mp, 110, 'Mage starting MP should be 110');
    runner.assertEqual(mage.maxCounters, 2, 'Mage Counter count should be 2');

    const kit = CLASS_DATA.Mage;
    runner.assertEqual(kit.skills.basic.dmg, 30, 'Mage Basic damage is 30');
    runner.assertEqual(kit.skills.basic.mp, 5, 'Mage Basic regens +5 MP');
    runner.assertEqual(kit.skills.primary.dmg, 50, 'Mage Primary damage is 50');
    runner.assertEqual(kit.skills.primary.mp, -30, 'Mage Primary costs 30 MP');
    runner.assertEqual(kit.skills.primary.status, 'burn', 'Mage Primary inflicts burn');
    runner.assertEqual(kit.skills.ultimate.dmg, 85, 'Mage Ultimate damage is 85');
    runner.assertEqual(kit.skills.ultimate.mp, -55, 'Mage Ultimate costs 55 MP');
    runner.assertEqual(kit.counter.absorb, 30, 'Mage Counter absorbs 30 DMG');
  });

  runner.test('Boss Dragon Base Stats & Skills Verification', () => {
    const { state } = createTestEnv();
    const boss = state.boss;
    runner.assertEqual(boss.maxHp, 400, 'Boss Max HP should be 400');
    runner.assertEqual(boss.hp, 400, 'Boss starting HP should be 400');
    runner.assertEqual(boss.maxMp, 120, 'Boss Max MP should be 120');
    runner.assertEqual(boss.mp, 120, 'Boss starting MP should be 120');
    runner.assertEqual(boss.maxCounters, 0, 'Boss has 0 counters');

    const kit = BOSS_DATA;
    runner.assertEqual(kit.skills.basic.dmg, 40, 'Boss Basic damage is 40');
    runner.assertEqual(kit.skills.basic.mp, 0, 'Boss Basic costs 0 MP and regens 0 MP');
    runner.assertEqual(kit.skills.primary.dmg, 30, 'Boss Primary damage is 30');
    runner.assertEqual(kit.skills.primary.mp, -35, 'Boss Primary costs 35 MP');
    runner.assertEqual(kit.skills.primary.status, 'stun', 'Boss Primary inflicts stun');
    runner.assertEqual(kit.skills.ultimate.dmg, 80, 'Boss Ultimate damage is 80');
    runner.assertEqual(kit.skills.ultimate.mp, -50, 'Boss Ultimate costs 50 MP');
    runner.assertEqual(kit.skills.ultimate.status, 'burn', 'Boss Ultimate inflicts burn');
  });

  runner.test('Basic Attack MP Regen Mechanics & Clamping', () => {
    const { state, combat } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior 200 HP, 60 MP
    const p2 = state.getEntity('p2'); // Brawler 210 HP, 40 MP

    // Set MP below max
    p1.mp = 40;
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';
    combat.execute();

    runner.assertEqual(p1.mp, 45, 'Warrior MP should increase from 40 to 45 (+5 MP regen)');
    runner.assertEqual(p2.hp, 210 - 25, 'Brawler HP should decrease by 25 from Getsuga');

    // Test MP clamping at max
    p1.mp = 59;
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';
    combat.execute();
    runner.assertEqual(p1.mp, 60, 'Warrior MP should clamp at maxMp (60)');
  });

  runner.test('MP Gating: Insufficient MP blocks Primary and Ultimate execution', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior
    const p2 = state.getEntity('p2'); // Brawler

    p1.mp = 15; // Primary requires 20 MP, Ultimate requires 40 MP
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'primary';
    combat.execute();

    runner.assertEqual(p1.mp, 15, 'MP should not change when skill is blocked by lack of MP');
    runner.assertEqual(p2.hp, 210, 'Defender should take no damage when skill fails MP check');
    runner.assert(logs.some(l => l.includes('does not have enough MP')), 'Log should indicate not enough MP');
  });
}
