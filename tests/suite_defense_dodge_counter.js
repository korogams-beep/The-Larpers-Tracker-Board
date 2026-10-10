import { createTestEnv } from './test_helpers.js';

export function runDefenseDodgeCounterTests(runner) {
  runner.suite('2. Defense: 3-Second Dodge & Counters');

  runner.test('3-Second Dodge Rule against Basic Attack halves damage', () => {
    const { state, combat } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior (25 dmg basic)
    const p2 = state.getEntity('p2'); // Brawler (210 hp)

    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'dodge';

    const p2CountersBefore = [...p2.countersChecked];
    combat.execute();

    // 25 * 0.5 = 12.5 -> Math.round is 13
    runner.assertEqual(p2.hp, 210 - 13, 'Brawler should take 13 damage from dodged basic');
    runner.assertDeepEqual(p2.countersChecked, p2CountersBefore, 'Dodge does not consume any counters');
    runner.assertEqual(p2.mp, 40, 'Dodge costs 0 MP');
  });

  runner.test('3-Second Dodge Rule against Primary Attack: FAILS, lands full damage', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior: Primary 45 DMG
    const p2 = state.getEntity('p2'); // Brawler: 210 HP

    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'primary';
    state.selectedCounterOpt = 'dodge';

    combat.execute();

    runner.assertEqual(p2.hp, 210 - 45, 'Primary lands at full 45 DMG even if defender dodged');
    runner.assert(logs.some(l => l.includes('Dodge only reduces Basic attacks; full damage lands')), 'Log confirms dodge only reduces Basic');
  });

  runner.test('3-Second Dodge Rule against Ultimate Attack: FAILS, lands full damage', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior: Ultimate 65 DMG
    const p2 = state.getEntity('p2'); // Brawler: 210 HP

    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'ultimate';
    state.selectedCounterOpt = 'dodge';

    combat.execute();

    runner.assertEqual(p2.hp, 210 - 65, 'Ultimate lands at full 65 DMG even if defender dodged');
    runner.assert(logs.some(l => l.includes('Dodge only reduces Basic attacks; full damage lands')), 'Log confirms dodge fails on Ultimate');
  });

  runner.test('Warrior Full Counter: reduces damage by 50% and reflects 10 DMG to attacker', () => {
    const { state, combat } = createTestEnv();
    const p2 = state.getEntity('p2'); // Brawler: Basic 30 DMG
    const p1 = state.getEntity('p1'); // Warrior: 200 HP, 60 MP, 2 counters

    state.selectedAttacker = 'p2';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'counter';

    combat.execute();

    // 30 * (1 - 0.5) = 15 taken by Warrior
    runner.assertEqual(p1.hp, 200 - 15, 'Warrior HP reduced by 15');
    // Reflect 10 DMG to Brawler
    runner.assertEqual(p2.hp, 210 - 10, 'Attacking Brawler takes 10 reflected DMG');
    runner.assertEqual(p1.countersChecked[0], true, 'First counter slot marked as used');
  });

  runner.test('Warrior Full Counter Reflection lethally downs attacker', () => {
    const { state, combat, logs } = createTestEnv();
    const p2 = state.getEntity('p2'); // Brawler
    const p1 = state.getEntity('p1'); // Warrior

    p2.hp = 8; // Less than 10 HP reflection
    state.selectedAttacker = 'p2';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'counter';

    combat.execute();

    runner.assertEqual(p2.hp, 0, 'Attacker HP reaches 0 from reflected damage');
    runner.assert(logs.some(l => l.includes('has fallen from the counter-reflect')), 'Log records attacker defeated by reflect');
  });

  runner.test('Brawler Ultra Instinct: reduces damage by 50% and consumes 1 counter', () => {
    const { state, combat } = createTestEnv();
    const p3 = state.getEntity('p3'); // Archer: Basic 35 DMG
    const p2 = state.getEntity('p2'); // Brawler: 210 HP, 3 counters

    state.selectedAttacker = 'p3';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'counter';

    combat.execute();

    // 35 * 0.5 = 17.5 -> Math.round is 18
    runner.assertEqual(p2.hp, 210 - 18, 'Brawler takes 18 damage');
    runner.assertEqual(p2.countersChecked.filter(Boolean).length, 1, '1 counter used');
  });

  runner.test('Archer Substitution Jutsu: reduces damage by 50% and consumes 1 counter', () => {
    const { state, combat } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior: Primary 45 DMG
    const p3 = state.getEntity('p3'); // Archer: 180 HP, 2 counters

    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p3';
    state.selectedSkill = 'primary';
    state.selectedCounterOpt = 'counter';

    combat.execute();

    // 45 * 0.5 = 22.5 -> Math.round is 23
    runner.assertEqual(p3.hp, 180 - 23, 'Archer takes 23 damage');
    runner.assertEqual(p3.countersChecked[0], true, 'Counter consumed');
  });

  runner.test('Mage Domain Expansion: absorbs up to 30 DMG', () => {
    const { state, combat } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior: Basic 25 DMG
    const p4 = state.getEntity('p4'); // Mage: 160 HP, absorbs 30

    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p4';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'counter';

    combat.execute();

    // 25 - 30 <= 0 -> 0 taken!
    runner.assertEqual(p4.hp, 160, 'Mage takes 0 damage when hit is below 30 absorb limit');
    runner.assertEqual(p4.countersChecked[0], true, 'Counter consumed');

    // Test Mage absorbing hit > 30 DMG (e.g. Primary 45 DMG)
    p1.mp = 60;
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p4';
    state.selectedSkill = 'primary';
    state.selectedCounterOpt = 'counter';

    combat.execute();

    // 45 - 30 = 15 taken
    runner.assertEqual(p4.hp, 160 - 15, 'Mage takes 15 damage (45 - 30 absorbed)');
    runner.assertEqual(p4.countersChecked.filter(Boolean).length, 2, 'Both counters now used');
  });

  runner.test('Counter Exhaustion: When counters run out, full damage lands', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior
    const p3 = state.getEntity('p3'); // Archer (2 counters max)

    p3.countersChecked = [true, true]; // all counters spent

    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p3';
    state.selectedSkill = 'basic'; // 25 DMG
    state.selectedCounterOpt = 'counter';

    combat.execute();

    runner.assertEqual(p3.hp, 180 - 25, 'Full 25 damage lands when counters exhausted');
    runner.assert(logs.some(l => l.includes('Counter attempted but unavailable')), 'Log shows counter unavailable');
  });

  runner.test('Boss Dragon cannot use Counter (0 max counters)', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior
    const boss = state.boss;

    state.selectedAttacker = 'p1';
    state.selectedDefender = 'boss';
    state.selectedSkill = 'basic'; // 25 DMG
    state.selectedCounterOpt = 'counter';

    combat.execute();

    runner.assertEqual(boss.hp, 400 - 25, 'Boss takes full 25 DMG when counter is selected');
  });
}
