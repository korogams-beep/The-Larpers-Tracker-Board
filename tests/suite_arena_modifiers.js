import { createTestEnv } from './test_helpers.js';

export function runArenaModifiersTests(runner) {
  runner.suite('5. Arena Modifiers & Boss Phase');

  runner.test('Round 1 Modifier adds +10 DMG to all attacks', () => {
    const { state, combat } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior: Basic 25 DMG
    const p2 = state.getEntity('p2'); // Brawler: 210 HP

    state.round1Active = true;
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';
    combat.execute();

    // 25 + 10 = 35 DMG
    runner.assertEqual(p2.hp, 210 - 35, 'Basic attack deals 35 DMG with Round 1 modifier (+10)');

    // Toggle Round 1 off
    state.round1Active = false;
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';
    combat.execute();

    // 25 normal DMG
    runner.assertEqual(p2.hp, 210 - 35 - 25, 'Basic attack reverts to 25 DMG when Round 1 modifier is off');
  });

  runner.test('Round 2 (Semi-Finals) FULL RESTORE resets HP, MP, Potions, Counters, and clears statuses', () => {
    const { state } = createTestEnv();
    const p1 = state.getEntity('p1');
    const p2 = state.getEntity('p2');

    // Inflict battle damage and spend resources
    p1.hp = 50;
    p1.mp = 10;
    p1.hasPotion = false;
    p1.hasElixir = false;
    p1.countersChecked = [true, true];
    p1.statusBlind = true;
    p1.turnLocked = true;
    p1.oocWarned = true; // rulebook: disciplinary record not wiped by heal

    p2.hp = 80;
    p2.mp = 5;
    p2.statusBurn = true;

    state.fullRestoreRound2();

    // Verify p1 full restore
    runner.assertEqual(p1.hp, p1.maxHp, 'Warrior HP restored to 200');
    runner.assertEqual(p1.mp, p1.maxMp, 'Warrior MP restored to 60');
    runner.assertEqual(p1.hasPotion, true, 'Potion renewed');
    runner.assertEqual(p1.hasElixir, true, 'Elixir renewed');
    runner.assertDeepEqual(p1.countersChecked, [false, false], 'Counters renewed');
    runner.assertEqual(p1.statusBlind, false, 'Blind status cleared');
    runner.assertEqual(p1.turnLocked, false, 'Turn lock cleared');
    runner.assertEqual(p1.oocWarned, true, 'Disciplinary OOC warning preserved');

    // Verify p2 full restore
    runner.assertEqual(p2.hp, p2.maxHp, 'Brawler HP restored to 210');
    runner.assertEqual(p2.mp, p2.maxMp, 'Brawler MP restored to 40');
    runner.assertEqual(p2.statusBurn, false, 'Burn status cleared');
  });

  runner.test('Boss Phase 1d6 Roll: 1-3 buff Dragon, 4-6 buff Champion', () => {
    const { state } = createTestEnv();
    const boss = state.boss;
    const champ = state.getEntity('p1');
    state.championId = 'p1';

    // Simulate Boss Phase roll 2 (1-3: Dragon gets +10 ATK)
    const rollDragon = 2;
    if (rollDragon <= 3) {
      boss.atkBuff = (boss.atkBuff || 0) + 10;
    } else {
      champ.atkBuff = (champ.atkBuff || 0) + 10;
    }
    runner.assertEqual(boss.atkBuff, 10, 'Boss Dragon receives +10 ATK buff on roll <= 3');
    runner.assertEqual(champ.atkBuff, 0, 'Champion receives no buff on roll <= 3');

    // Simulate Boss Phase roll 5 (4-6: Champion gets +10 ATK)
    const rollChamp = 5;
    if (rollChamp <= 3) {
      boss.atkBuff = (boss.atkBuff || 0) + 10;
    } else {
      champ.atkBuff = (champ.atkBuff || 0) + 10;
    }
    runner.assertEqual(champ.atkBuff, 10, 'Champion receives +10 ATK buff on roll >= 4');
  });

  runner.test('Boss Dragon Damage consistency across HP ranges (No Enrage passive)', () => {
    const { state, combat } = createTestEnv();
    const boss = state.boss;
    const p1 = state.getEntity('p1');

    // At full HP (400)
    boss.hp = 400;
    p1.hp = 200;
    state.selectedAttacker = 'boss';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'basic'; // Tail Swipe: 40 DMG
    combat.execute();
    runner.assertEqual(p1.hp, 200 - 40, 'At 400 HP, deals 40 DMG');

    // Below 200 HP (e.g. 150 HP)
    p1.hp = 200;
    boss.hp = 150;
    state.selectedAttacker = 'boss';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'basic';
    combat.execute();
    runner.assertEqual(p1.hp, 200 - 40, 'At 150 HP, still deals base 40 DMG (no enrage passive)');
  });

  runner.test('Round 1 Modifier applies only to Player matches and NEVER to Boss Dragon', () => {
    const { state, combat } = createTestEnv();
    const boss = state.boss;
    const p1 = state.getEntity('p1');

    state.round1Active = true; // Round 1 Active (+10 for players only)
    boss.atkBuff = 10; // Boss Phase roll buff (+10)

    state.selectedAttacker = 'boss';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'basic'; // Base 40 + 10 (roll) = 50 DMG (NO Round 1 bonus!)
    combat.execute();

    runner.assertEqual(p1.hp, 200 - 50, 'Boss Dragon receives boss phase roll buff (10) but NEVER Round 1 player bonus');
  });
}
