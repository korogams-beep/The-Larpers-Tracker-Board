import { createTestEnv } from './test_helpers.js';

export function runModeratorPenaltiesTests(runner) {
  runner.suite('4. Violations, Penalties & Moderator Guidelines');

  runner.test('Execution Fail Penalty: -40 HP', () => {
    const { state, moderator, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // 200 HP

    state.violationTargetId = 'p1';
    state.violationType = 'execution-fail';
    moderator.apply();

    runner.assertEqual(p1.hp, 200 - 40, 'Warrior HP reduced by 40');
    runner.assert(logs.some(l => l.includes("EXECUTION FAIL")), 'Log contains EXECUTION FAIL call');
  });

  runner.test('Tongue Twister Penalty: -20 HP and consumes skill MP', () => {
    const { state, moderator, logs } = createTestEnv();
    const p4 = state.getEntity('p4'); // Mage: 160 HP, 110 MP

    state.violationTargetId = 'p4';
    state.violationType = 'tongue-twister';
    // Failed Ultimate (Megumin\'s Explosion, costs 55 MP)
    moderator.apply('ultimate');

    runner.assertEqual(p4.hp, 160 - 20, 'Mage takes 20 HP penalty');
    runner.assertEqual(p4.mp, 110 - 55, 'Mage loses 55 MP from failed cast');
    runner.assert(logs.some(l => l.includes('MISPRONOUNCED')), 'Log contains MISPRONOUNCED');
  });

  runner.test('Out-of-Character (OOC): 1st Offense is Warning Only; 2nd Offense applies -25 HP', () => {
    const { state, moderator, logs } = createTestEnv();
    const p2 = state.getEntity('p2'); // Brawler: 210 HP

    state.violationTargetId = 'p2';
    state.violationType = 'ooc';

    // First offense
    moderator.apply();
    runner.assertEqual(p2.hp, 210, 'First OOC offense does not reduce HP');
    runner.assertEqual(p2.oocWarned, true, 'Fighter marked as warned');
    runner.assert(logs.some(l => l.includes('first offense, warning only')), 'Log specifies first offense warning');

    // Second offense (repeat)
    moderator.apply();
    runner.assertEqual(p2.hp, 210 - 25, 'Repeat OOC offense incurs -25 HP penalty');
    runner.assert(logs.some(l => l.includes('(repeat offense) — -25 HP')), 'Log specifies repeat offense penalty');
  });

  runner.test('Stutter / Hesitation: Downgraded to Basic Attack (0 MP)', () => {
    const { state, moderator, combat, logs } = createTestEnv();
    const p3 = state.getEntity('p3'); // Archer: 80 MP
    const p1 = state.getEntity('p1'); // Warrior: 200 HP

    state.violationTargetId = 'p3';
    state.violationType = 'stutter';
    moderator.apply();

    runner.assertEqual(p3.forcedBasic, true, 'Archer marked for forced Basic Attack');

    // Archer attempts to cast Ultimate (85 DMG, 50 MP)
    state.selectedAttacker = 'p3';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'ultimate';
    combat.execute();

    runner.assertEqual(p1.hp, 200, 'Defender takes NO damage because non-Basic attack was blocked');
    runner.assert(logs.some(l => l.includes('downgraded to a Basic Attack this turn')), 'Combat engine blocks non-Basic');

    // Now Archer executes Basic Attack as mandated
    state.selectedSkill = 'basic';
    p3.mp = 50; // set below max to verify 0 MP rule
    combat.execute();

    // Archer Basic deals 35 DMG; forcedBasic gives 0 MP regen!
    runner.assertEqual(p1.hp, 200 - 35, 'Basic attack lands for 35 DMG');
    runner.assertEqual(p3.mp, 50, 'Hesitation forced Basic gives 0 MP regen (rulebook: 0 MP)');
    runner.assertEqual(p3.forcedBasic, false, 'forcedBasic cleared after turn');
  });

  runner.test('Safety Breach: Immediate Match Forfeit', () => {
    const { state, moderator, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior

    state.violationTargetId = 'p1';
    state.violationType = 'safety-breach';
    moderator.apply();

    runner.assertEqual(p1.forfeited, true, 'Warrior marked as forfeited');
    runner.assertEqual(p1.hp, 0, 'HP set to 0');
    runner.assertEqual(p1.mp, 0, 'MP set to 0');
    runner.assert(logs.some(l => l.includes('immediate forfeiture')), 'Log confirms match forfeiture');

    // Forfeited fighter cannot act
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';
    combat.execute();
    runner.assert(logs.some(l => l.includes('has forfeited and cannot act')), 'Forfeited fighter blocked from acting');
  });

  runner.test('CRITICAL RULE: Boss Dragon Penalties (Dragon is NOT exempt)', () => {
    const { state, moderator, logs } = createTestEnv();
    const boss = state.boss; // 400 HP, 120 MP

    // 1. Boss Execution Fail: -40 HP
    state.violationTargetId = 'boss';
    state.violationType = 'execution-fail';
    moderator.apply();
    runner.assertEqual(boss.hp, 360, 'Boss Dragon takes -40 HP penalty for Execution Fail');

    // 2. Boss Tongue Twister: failed Ultimate (Inferno Breath, 50 MP)
    state.violationType = 'tongue-twister';
    moderator.apply('ultimate');
    runner.assertEqual(boss.hp, 340, 'Boss Dragon takes -20 HP penalty for Tongue Twister');
    runner.assertEqual(boss.mp, 120 - 50, 'Boss Dragon loses 50 MP on failed Ultimate');

    // 3. Boss OOC: 1st warning, then -25 HP
    state.violationType = 'ooc';
    moderator.apply();
    runner.assertEqual(boss.hp, 340, 'Boss Dragon receives verbal warning on 1st OOC');
    runner.assertEqual(boss.oocWarned, true, 'Boss Dragon oocWarned is true');

    moderator.apply();
    runner.assertEqual(boss.hp, 315, 'Boss Dragon penalized -25 HP on repeat OOC');

    // 4. Boss Stutter: forced Basic
    state.violationType = 'stutter';
    moderator.apply();
    runner.assertEqual(boss.forcedBasic, true, 'Boss Dragon forced into Basic attack');

    // 5. Boss Safety Breach: Forfeit
    state.violationType = 'safety-breach';
    moderator.apply();
    runner.assertEqual(boss.forfeited, true, 'Boss Dragon forfeited');
    runner.assertEqual(boss.hp, 0, 'Boss Dragon HP reduced to 0');
    runner.assertEqual(boss.mp, 0, 'Boss Dragon MP reduced to 0');
  });
}
