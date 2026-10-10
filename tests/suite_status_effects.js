import { createTestEnv } from './test_helpers.js';

export function runStatusEffectsTests(runner) {
  runner.suite('3. Status Effects (Stun, Shatter, Blind, Burn)');

  runner.test('1d6 Status Roll Mechanics: Odd = Fail, Even = Success', () => {
    const { state, combat } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior
    const p2 = state.getEntity('p2'); // Brawler

    // Odd roll (1, 3, 5) -> Fails
    state.pendingStatusRoll = { effect: 'stun', targetId: 'p2' };
    combat.resolveStatusRoll(3);
    runner.assertEqual(p2.statusStun, false, 'Odd roll (3) must fail status application');
    runner.assertEqual(state.pendingStatusRoll, null, 'Pending roll cleared after resolution');

    // Even roll (2, 4, 6) -> Succeeds
    state.pendingStatusRoll = { effect: 'stun', targetId: 'p2' };
    combat.resolveStatusRoll(4);
    runner.assertEqual(p2.statusStun, true, 'Even roll (4) must successfully apply status');
    runner.assertEqual(state.pendingStatusRoll, null, 'Pending roll cleared');
  });

  runner.test('Stun: Target completely loses their entire next turn', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior
    const p2 = state.getEntity('p2'); // Brawler

    p2.statusStun = true;
    state.selectedAttacker = 'p2';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'basic';

    combat.execute();

    runner.assertEqual(p2.statusStun, false, 'Stun status consumed and cleared');
    runner.assertEqual(p1.hp, 200, 'Defender takes NO damage because stunned fighter lost their turn');
    runner.assert(logs.some(l => l.includes('is Stunned and loses their turn!')), 'Log notes stunned turn lost');
    runner.assertEqual(state.selectedAttacker, 'p1', 'Turn passes back to defender');
  });

  runner.test('Shatter: Target guard broken, cannot Counter on next turn', () => {
    const { state, combat, logs } = createTestEnv();
    const p2 = state.getEntity('p2'); // Brawler
    const p1 = state.getEntity('p1'); // Warrior (has counter)

    p1.statusShatter = true;
    state.selectedAttacker = 'p2';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'basic'; // 30 DMG
    state.selectedCounterOpt = 'counter';

    const p1CountersBefore = [...p1.countersChecked];
    combat.execute();

    runner.assertEqual(p1.hp, 200 - 30, 'Full 30 damage lands despite counter attempt');
    runner.assertEqual(p1.statusShatter, false, 'Shatter flag cleared after turn');
    runner.assertDeepEqual(p1.countersChecked, p1CountersBefore, 'Counters not consumed when shattered');
    runner.assert(logs.some(l => l.includes('Shattered! Counter is disabled this turn')), 'Log confirms shatter disabled counter');
  });

  runner.test('Blind: Target vision impaired, next attack deals 50% damage', () => {
    const { state, combat, logs } = createTestEnv();
    const p3 = state.getEntity('p3'); // Archer
    const p1 = state.getEntity('p1'); // Warrior (200 HP)

    p3.statusBlind = true;
    state.selectedAttacker = 'p3';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'ultimate'; // 85 DMG

    combat.execute();

    // 85 * 0.5 = 42.5 -> Math.round is 43
    runner.assertEqual(p1.hp, 200 - 43, 'Damage halved by blind (43 dealt)');
    runner.assertEqual(p3.statusBlind, false, 'Blind flag cleared after attack');
    runner.assert(logs.some(l => l.includes('(Blinded: -50% DMG)')), 'Log records blinded penalty');
  });

  runner.test('Burn: Target scorched, takes 15 DMG at start of their next turn', () => {
    const { state, combat, logs } = createTestEnv();
    const p4 = state.getEntity('p4'); // Mage
    const p1 = state.getEntity('p1'); // Warrior

    p4.statusBurn = true;
    p4.hp = 160;
    state.selectedAttacker = 'p4';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'basic'; // 30 DMG

    combat.execute();

    // Mage should have taken 15 burn damage at start of turn
    runner.assertEqual(p4.hp, 160 - 15, 'Mage takes 15 burn damage at start of turn');
    runner.assertEqual(p4.statusBurn, false, 'Burn flag cleared');
    runner.assertEqual(p1.hp, 200 - 30, 'Mage still executes attack after burn tick');
    runner.assert(logs.some(l => l.includes('takes 15 Burn DMG at the start of their turn')), 'Log notes burn damage');
  });

  runner.test('Boss Dragon inflicts Stun with Primary (Dragon Roar) and Burn with Ultimate (Inferno Breath)', () => {
    const { state, combat } = createTestEnv();
    const boss = state.boss;
    const p1 = state.getEntity('p1');

    // Primary: Dragon Roar (30 DMG + Stun roll)
    state.selectedAttacker = 'boss';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'primary';
    combat.execute();

    runner.assertEqual(state.pendingStatusRoll?.effect, 'stun', 'Dragon Primary queues Stun roll');
    runner.assertEqual(state.pendingStatusRoll?.targetId, 'p1', 'Target is p1');

    combat.resolveStatusRoll(6); // even -> success
    runner.assertEqual(p1.statusStun, true, 'Warrior is stunned by Dragon Roar');

    // Clear stun for next test
    p1.statusStun = false;

    // Ultimate: Inferno Breath (80 DMG + Burn roll)
    state.selectedAttacker = 'boss';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'ultimate';
    combat.execute();

    runner.assertEqual(state.pendingStatusRoll?.effect, 'burn', 'Dragon Ultimate queues Burn roll');
    combat.resolveStatusRoll(2); // even -> success
    runner.assertEqual(p1.statusBurn, true, 'Warrior is burned by Inferno Breath');
  });
}
