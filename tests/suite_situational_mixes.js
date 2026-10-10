import { createTestEnv } from './test_helpers.js';

export function runSituationalMixesTests(runner) {
  runner.suite('6. Situational Mixes & Edge Cases');

  runner.test('Consumable Turn-Lock: Drinking Potion/Elixir locks turn and blocks attack', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior: 200 HP, 60 MP

    p1.hp = 100;
    // Potion (+50 HP)
    p1.hp = Math.min(p1.hp + 50, p1.maxHp);
    p1.hasPotion = false;
    p1.turnLocked = true;

    runner.assertEqual(p1.hp, 150, 'Warrior healed to 150 HP');
    runner.assertEqual(p1.hasPotion, false, 'Potion spent');
    runner.assertEqual(p1.turnLocked, true, 'Turn lock active');

    // Attempt to attack while turn locked
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';
    combat.execute();

    runner.assert(logs.some(l => l.includes('already used a Potion/Elixir this turn and cannot attack')), 'Attack blocked due to turn lock');

    // Turn lock cleared on next turn
    p1.turnLocked = false;
    combat.execute();
    runner.assertEqual(state.getEntity('p2').hp, 210 - 25, 'Warrior attacks normally after turn lock cleared');
  });

  runner.test('Mix: Blinded Attacker vs Dodging Defender (Double 50% Reduction)', () => {
    const { state, combat } = createTestEnv();
    const p2 = state.getEntity('p2'); // Brawler: Basic 30 DMG
    const p1 = state.getEntity('p1'); // Warrior: 200 HP

    p2.statusBlind = true; // Blinded: -50% DMG
    state.selectedAttacker = 'p2';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'dodge'; // Dodge on Basic: -50% DMG

    combat.execute();

    // Base 30 DMG -> Dodged: Math.round(30 * 0.5) = 15 -> Blinded: Math.round(15 * 0.5) = 8 DMG!
    runner.assertEqual(p1.hp, 200 - 8, 'Warrior takes only 8 damage from blinded dodged attack');
    runner.assertEqual(p2.statusBlind, false, 'Attacker blind cleared after attack');
  });

  runner.test('Mix: Blinded Attacker vs Mage Domain Expansion (Counter Absorption)', () => {
    const { state, combat } = createTestEnv();
    const p3 = state.getEntity('p3'); // Archer: Ultimate 85 DMG
    const p4 = state.getEntity('p4'); // Mage: 160 HP, absorbs 30 DMG

    p3.statusBlind = true;
    state.selectedAttacker = 'p3';
    state.selectedDefender = 'p4';
    state.selectedSkill = 'ultimate';
    state.selectedCounterOpt = 'counter'; // Absorbs 30 DMG

    combat.execute();

    // Base 85 DMG -> Absorbed: 85 - 30 = 55 -> Blinded: Math.round(55 * 0.5) = 28 DMG taken
    runner.assertEqual(p4.hp, 160 - 28, 'Mage takes 28 DMG after absorb and blind stack');
    runner.assertEqual(p3.statusBlind, false, 'Blind cleared');
  });

  runner.test('Mix: Shattered Defender can still Dodge Basic Attacks (Shatter only disables Counter)', () => {
    const { state, combat } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior: Basic 25 DMG
    const p2 = state.getEntity('p2'); // Brawler: 210 HP

    p2.statusShatter = true;
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'dodge';

    combat.execute();

    // 25 * 0.5 = 12.5 -> Math.round is 13
    runner.assertEqual(p2.hp, 210 - 13, 'Shattered defender successfully dodges Basic attack for 13 DMG');
  });

  runner.test('Mix: Stunned & Burned Fighter at Turn Start', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1');
    const p2 = state.getEntity('p2');

    // Fighter is stunned and burned
    p1.statusStun = true;
    p1.statusBurn = true;
    p1.hp = 100;

    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';

    combat.execute();

    // When stunned, Stun check resolves immediately, clearing stun and skipping turn.
    runner.assertEqual(p1.statusStun, false, 'Stun status cleared');
    runner.assert(logs.some(l => l.includes('is Stunned and loses their turn!')), 'Turn skipped due to Stun');
    runner.assertEqual(state.selectedAttacker, 'p2', 'Turn passed to p2');
  });

  runner.test('Last Ditch Effort: Blocked outside of Champion vs Boss Dragon duel', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior
    const p2 = state.getEntity('p2'); // Brawler

    p1.hp = 0; // Downed
    state.championDuelActive = false; // Not in final duel
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'ultimate';

    combat.execute();

    runner.assert(logs.some(l => l.includes('is downed and out of the fight')), 'Last Ditch rejected outside Champion duel');
    runner.assertEqual(p2.hp, 210, 'Defender takes no damage');
  });

  runner.test('Last Ditch Effort: Champion at 0 HP defeats Boss Dragon -> Champion Wins!', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // Champion (Warrior)
    const boss = state.boss;

    state.championDuelActive = true;
    p1.hp = 0; // Champion at 0 HP
    boss.hp = 50; // Boss within kill range of Bankai (65 DMG)

    // Champion must use Ultimate
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'boss';
    state.selectedSkill = 'ultimate';

    combat.execute();

    runner.assertEqual(boss.hp, 0, 'Boss Dragon HP reduced to 0');
    runner.assertEqual(p1.lastDitchUsed, true, 'Last Ditch marked as used');
    runner.assert(logs.some(l => l.includes("Last Ditch Effort brings down the Boss Dragon! Battered but victorious — Player 1 wins the duel!")), 'Champion wins via Last Ditch');
  });

  runner.test('Last Ditch Effort: Champion cannot use Basic or Primary at 0 HP', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1');

    state.championDuelActive = true;
    p1.hp = 0;
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'boss';

    state.selectedSkill = 'basic';
    combat.execute();
    runner.assert(logs.some(l => l.includes('At 0 HP, only the Ultimate can be used')), 'Basic attack blocked at 0 HP');

    state.selectedSkill = 'primary';
    combat.execute();
    runner.assert(logs.some(l => l.includes('At 0 HP, only the Ultimate can be used')), 'Primary attack blocked at 0 HP');
  });

  runner.test('Last Ditch Effort: Cannot be used more than once', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1');
    const boss = state.boss;

    state.championDuelActive = true;
    p1.hp = 0;
    boss.hp = 200; // Survives hit

    state.selectedAttacker = 'p1';
    state.selectedDefender = 'boss';
    state.selectedSkill = 'ultimate';
    combat.execute();

    runner.assertEqual(p1.lastDitchUsed, true, 'First Last Ditch spent');

    // Second attempt at 0 HP
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'boss';
    state.selectedSkill = 'ultimate';
    combat.execute();

    runner.assert(logs.some(l => l.includes('already used their one Last Ditch Effort and cannot act again at 0 HP')), 'Second Last Ditch blocked');
  });

  runner.test('Last Ditch Effort: Boss Dragon at 0 HP defeats Champion -> Both Have Fallen!', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1'); // Champion
    const boss = state.boss;

    state.championDuelActive = true;
    boss.hp = 0; // Boss at 0 HP
    p1.hp = 70; // Champion within kill range of Inferno Breath (80 DMG)

    state.selectedAttacker = 'boss';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'ultimate';

    combat.execute();

    runner.assertEqual(p1.hp, 0, 'Champion HP reduced to 0');
    runner.assert(logs.some(l => l.includes('Both Boss Dragon and Player 1 have fallen!')), 'Log notes mutual defeat');
  });

  runner.test('State Snapshots & Undo/Restore Integrity', () => {
    const { state, combat } = createTestEnv();
    const p1 = state.getEntity('p1');
    const p2 = state.getEntity('p2');

    // Snapshot initial state
    const snap = state.snapshot();

    // Apply multiple modifications
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'primary';
    combat.execute();

    runner.assertEqual(p1.mp, 40, 'Warrior MP changed');
    runner.assertEqual(p2.hp, 165, 'Brawler HP changed');

    // Restore from snapshot
    state.restore(snap);

    runner.assertEqual(p1.mp, 60, 'Warrior MP restored');
    runner.assertEqual(p2.hp, 210, 'Brawler HP restored');
    runner.assertEqual(state.selectedAttacker, snap.selectedAttacker, 'Attacker selection restored');
    runner.assertEqual(state.selectedDefender, snap.selectedDefender, 'Defender selection restored');
  });

  runner.test('Comprehensive Full Tournament Simulation (End-to-End Match)', () => {
    const { state, combat, moderator, logs } = createTestEnv();

    // 1. Bracket Generation
    state.generateBracket();
    runner.assertEqual(state.bracket.leaves.length, 4, 'Bracket has 4 leaves');

    // 2. Semifinal Match 1: Round 1 Modifier Active (+10 DMG)
    state.round1Active = true;
    const p1 = state.getEntity('p1'); // Warrior
    const p2 = state.getEntity('p2'); // Brawler

    // Turn 1: Warrior uses Primary (45 + 10 = 55 DMG) vs Brawler Counter (Ultra Instinct: -50%)
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'primary';
    state.selectedCounterOpt = 'counter';
    combat.execute();

    // 55 * 0.5 = 27.5 -> 28 DMG taken
    runner.assertEqual(p2.hp, 210 - 28, 'Brawler takes 28 DMG from countered Primary with Round 1 modifier');

    // Turn 2: Brawler stutters! Moderator applies Hesitation downgrade
    state.violationTargetId = 'p2';
    state.violationType = 'stutter';
    moderator.apply();
    runner.assertEqual(p2.forcedBasic, true, 'Brawler is forced to Basic attack');

    // Brawler executes forced Basic attack (30 + 10 = 40 DMG, 0 MP) on Warrior
    state.selectedAttacker = 'p2';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'none';
    combat.execute();
    runner.assertEqual(p1.hp, 200 - 40, 'Warrior takes 40 DMG');
    runner.assertEqual(p2.forcedBasic, false, 'Forced basic cleared');

    // Turn 3: Warrior uses Ultimate (Bankai: 65 + 10 = 75 DMG + Stun roll)
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'ultimate';
    combat.execute();
    runner.assertEqual(p2.hp, 182 - 75, 'Brawler takes 75 DMG from Bankai');
    combat.resolveStatusRoll(4); // Even -> Stun succeeds!
    runner.assertEqual(p2.statusStun, true, 'Brawler is stunned');

    // Turn 4: Brawler turn is skipped due to stun
    state.selectedAttacker = 'p2';
    state.selectedDefender = 'p1';
    combat.execute();
    runner.assertEqual(p2.statusStun, false, 'Stun clears and turn is lost');

    // Warrior wins match, picked as finalist
    state.pickBracketWinner('finalA', 'p1');
    state.pickBracketWinner('finalB', 'p4'); // Mage wins semifinal 2
    state.pickBracketWinner('champion', 'p1'); // Warrior becomes tournament champion

    runner.assertEqual(state.bracket.champion, 'p1', 'Warrior is tournament Champion');

    // 3. Round 2: FULL RESTORE
    state.round1Active = false;
    state.fullRestoreRound2();
    runner.assertEqual(p1.hp, 200, 'Champion Warrior HP restored to max for boss phase');
    runner.assertEqual(p1.mp, 60, 'Champion Warrior MP restored to max');

    // 4. Boss Phase: Roll 1d6 for Boss Phase modifier
    // Roll 2: Dragon gains +10 ATK
    state.boss.atkBuff = 10;

    // 5. Champion enters Boss Dragon Duel
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'boss';
    state.championDuelActive = true;

    // Champion attacks Dragon with Primary (45 DMG)
    state.selectedSkill = 'primary';
    combat.execute();
    runner.assertEqual(state.boss.hp, 400 - 45, 'Boss Dragon takes 45 DMG (355 HP remaining)');

    // Boss Dragon attacks Champion with Tail Swipe (40 base + 10 buff = 50 DMG)
    state.selectedSkill = 'basic';
    combat.execute();
    runner.assertEqual(p1.hp, 200 - 50, 'Champion takes 50 DMG (150 HP remaining)');

    // Duel continues until exciting climax!
    runner.assert(logs.length >= 8, 'Full tournament generates comprehensive combat logs');
    runner.assert(logs.some(l => l.includes('Player 1 used Primary on Player 2')), 'Semifinal logged');
    runner.assert(logs.some(l => l.includes('Boss Dragon used Basic on Player 1')), 'Boss duel logged');
  });

  runner.test('Targeting a Downed or Forfeited Defender is strictly blocked', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1');
    const p2 = state.getEntity('p2');

    // Defender is downed (0 HP)
    p2.hp = 0;
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';
    combat.execute();

    runner.assert(logs.some(l => l.includes('is already downed and cannot be targeted')), 'Blocked targeting downed defender');

    // Defender is forfeited
    p2.hp = 200;
    p2.forfeited = true;
    combat.execute();

    runner.assert(logs.some(l => l.includes('has forfeited and cannot be targeted')), 'Blocked targeting forfeited defender');
  });

  runner.test('Auto-Swap avoids making a defeated defender the next attacker', () => {
    const { state, combat } = createTestEnv();
    const p1 = state.getEntity('p1'); // Warrior: Ultimate 65 DMG
    const p2 = state.getEntity('p2'); // Brawler: 50 HP (killable)

    p2.hp = 50;
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'ultimate';

    combat.execute();

    runner.assertEqual(p2.hp, 0, 'Brawler is defeated');
    runner.assertEqual(state.selectedAttacker, 'p1', 'Auto-swap did not set the defeated defender as attacker');
  });

  runner.test('Champion Full Reset on entering Boss Dragon Duel (New Fight stats)', () => {
    const { state } = createTestEnv();
    const p1 = state.getEntity('p1'); // Champion

    // Champion battered from semifinals: 30 HP, 10 MP, no potions, all counters used, burned, round 1 active
    p1.hp = 30;
    p1.mp = 10;
    p1.hasPotion = false;
    p1.hasElixir = false;
    p1.countersChecked = [true, true];
    p1.statusBurn = true;
    p1.turnLocked = true;
    p1.lastDitchUsed = true;
    state.round1Active = true;

    // Send Champion to face Boss Dragon
    state.prepareChampionForBossDuel('p1');

    runner.assertEqual(p1.hp, 200, 'Champion HP restored to full Max HP (200)');
    runner.assertEqual(p1.mp, 60, 'Champion MP restored to full Max MP (60)');
    runner.assertEqual(p1.hasPotion, true, 'Health Potion renewed');
    runner.assertEqual(p1.hasElixir, true, 'Mana Elixir renewed');
    runner.assertDeepEqual(p1.countersChecked, [false, false], 'All Counters renewed');
    runner.assertEqual(p1.turnLocked, false, 'Turn lock cleared');
    runner.assertEqual(p1.statusBurn, false, 'Burn status cleared');
    runner.assertEqual(p1.lastDitchUsed, false, 'Last Ditch refreshed for boss fight');
    runner.assertEqual(state.round1Active, false, 'Round 1 modifier cleared for boss duel');
    runner.assertEqual(state.championDuelActive, true, 'Champion duel mode locked');
    runner.assertEqual(state.selectedAttacker, 'p1', 'Champion set as attacker');
    runner.assertEqual(state.selectedDefender, 'boss', 'Boss set as defender');
  });

  runner.test('Stun turn skip satisfies and clears Hesitation (Stutter) penalty', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1');

    p1.statusStun = true;
    p1.forcedBasic = true; // Hesitation penalty
    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';

    combat.execute();

    runner.assertEqual(p1.statusStun, false, 'Stun consumed');
    runner.assertEqual(p1.forcedBasic, false, 'Hesitation cleared by the lost turn');
    runner.assert(logs.some(l => l.includes('is Stunned and loses their turn!')), 'Turn lost to stun');
  });
}
