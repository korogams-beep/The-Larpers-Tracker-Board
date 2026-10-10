import { createTestEnv } from './test_helpers.js';
import { CLASS_DATA, BOSS_DATA } from '../js/data/gameData.js';

export function runSituationsExpandedTests(runner) {
  runner.suite('7. Deep Situations Matrix & Edge Case Mixes');

  runner.test('Dodge Matrix: Verified across all 4 Player classes + Boss Dragon', () => {
    // Basic attacks must be halved (Math.round(base * 0.5))
    // Primary & Ultimate must NEVER be reduced by dodge (full damage)
    const fighters = [
      { id: 'p1', class: 'Warrior', basicDmg: 25, primDmg: 45, ultDmg: 65, expDodgedBasic: 13 },
      { id: 'p2', class: 'Brawler', basicDmg: 30, primDmg: 35, ultDmg: 80, expDodgedBasic: 15 },
      { id: 'p3', class: 'Archer', basicDmg: 35, primDmg: 50, ultDmg: 85, expDodgedBasic: 18 },
      { id: 'p4', class: 'Mage', basicDmg: 30, primDmg: 50, ultDmg: 85, expDodgedBasic: 15 },
      { id: 'boss', class: 'Boss Dragon', basicDmg: 40, primDmg: 30, ultDmg: 80, expDodgedBasic: 20 }
    ];

    for (const f of fighters) {
      const { state, combat } = createTestEnv();
      const targetId = f.id === 'p1' ? 'p2' : 'p1';
      const target = state.getEntity(targetId);

      // 1. Basic attack dodged
      target.hp = target.maxHp;
      state.selectedAttacker = f.id;
      state.selectedDefender = targetId;
      state.selectedSkill = 'basic';
      state.selectedCounterOpt = 'dodge';
      combat.execute();
      runner.assertEqual(target.hp, target.maxHp - f.expDodgedBasic, `${f.class} Basic dodged should deal ${f.expDodgedBasic}`);

      // 2. Primary attack dodged (FAILS to reduce)
      target.hp = target.maxHp;
      state.selectedAttacker = f.id;
      state.selectedDefender = targetId;
      state.selectedSkill = 'primary';
      state.selectedCounterOpt = 'dodge';
      combat.execute();
      runner.assertEqual(target.hp, target.maxHp - f.primDmg, `${f.class} Primary dodged must land full ${f.primDmg} DMG`);

      // 3. Ultimate attack dodged (FAILS to reduce)
      target.hp = target.maxHp;
      state.selectedAttacker = f.id;
      state.selectedDefender = targetId;
      state.selectedSkill = 'ultimate';
      state.selectedCounterOpt = 'dodge';
      combat.execute();
      runner.assertEqual(target.hp, target.maxHp - f.ultDmg, `${f.class} Ultimate dodged must land full ${f.ultDmg} DMG`);
    }
  });

  runner.test('Counter Matrix: All 4 Player classes defending against Boss Dragon', () => {
    const { state, combat } = createTestEnv();
    const boss = state.boss;

    // Tail Swipe is 40 base DMG
    // 1. Warrior Full Counter: -50% DMG (20 taken), reflects 10 DMG
    const p1 = state.getEntity('p1');
    state.selectedAttacker = 'boss';
    state.selectedDefender = 'p1';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'counter';
    boss.hp = 400;
    combat.execute();
    runner.assertEqual(p1.hp, 200 - 20, 'Warrior takes 20 DMG (-50%)');
    runner.assertEqual(boss.hp, 400 - 10, 'Boss takes 10 reflected DMG');

    // 2. Brawler Ultra Instinct: -50% DMG (20 taken)
    const p2 = state.getEntity('p2');
    state.selectedAttacker = 'boss';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'counter';
    combat.execute();
    runner.assertEqual(p2.hp, 210 - 20, 'Brawler takes 20 DMG (-50%)');

    // 3. Archer Substitution Jutsu: -50% DMG (20 taken)
    const p3 = state.getEntity('p3');
    state.selectedAttacker = 'boss';
    state.selectedDefender = 'p3';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'counter';
    combat.execute();
    runner.assertEqual(p3.hp, 180 - 20, 'Archer takes 20 DMG (-50%)');

    // 4. Mage Domain Expansion: absorbs 30 DMG (40 - 30 = 10 taken)
    const p4 = state.getEntity('p4');
    state.selectedAttacker = 'boss';
    state.selectedDefender = 'p4';
    state.selectedSkill = 'basic';
    state.selectedCounterOpt = 'counter';
    combat.execute();
    runner.assertEqual(p4.hp, 160 - 10, 'Mage takes 10 DMG (40 - 30 absorbed)');
  });

  runner.test('Verification: All Counters cost 0 MP and never consume defender MP', () => {
    const { state, combat } = createTestEnv();

    // Verify for all 4 player classes: Warrior, Brawler, Archer, Mage
    const playerIds = ['p1', 'p2', 'p3', 'p4'];
    for (const pid of playerIds) {
      const defender = state.getEntity(pid);
      const startingMp = defender.mp;

      state.selectedAttacker = 'boss';
      state.selectedDefender = pid;
      state.selectedSkill = 'basic';
      state.selectedCounterOpt = 'counter';

      combat.execute();

      runner.assertEqual(defender.mp, startingMp, `${defender.class} Counter must not consume any MP (0 MP cost)`);
    }
  });

  runner.test('Lethal Burn at Start of Turn: Knocks out fighter before attack can execute', () => {
    const { state, combat, logs } = createTestEnv();
    const p1 = state.getEntity('p1');
    const p2 = state.getEntity('p2');

    // p1 has only 10 HP, and has Burn status
    p1.hp = 10;
    p1.statusBurn = true;
    p2.hp = 210;

    state.selectedAttacker = 'p1';
    state.selectedDefender = 'p2';
    state.selectedSkill = 'basic';

    combat.execute();

    runner.assertEqual(p1.hp, 0, 'Warrior HP reduced to 0 by burn damage');
    runner.assertEqual(p2.hp, 210, 'Defender takes NO damage because attacker died at turn start');
    runner.assert(logs.some(l => l.includes('succumbed to burn damage')), 'Log notes attacker died to burn');
    runner.assertEqual(state.selectedAttacker, 'p2', 'Turn passed to defender');
  });

  runner.test('Stunned AND Burned simultaneously at Turn Start', () => {
    const { state, combat, logs } = createTestEnv();
    const p2 = state.getEntity('p2');
    const p1 = state.getEntity('p1');

    p2.hp = 100;
    p2.statusStun = true;
    p2.statusBurn = true;

    state.selectedAttacker = 'p2';
    state.selectedDefender = 'p1';

    combat.execute();

    runner.assertEqual(p2.hp, 85, 'Burn deals 15 damage at start of turn');
    runner.assertEqual(p2.statusBurn, false, 'Burn cleared');
    runner.assertEqual(p2.statusStun, false, 'Stun cleared');
    runner.assert(logs.some(l => l.includes('is Stunned and loses their turn!')), 'Turn lost to Stun');
  });

  runner.test('Lethal Moderator Penalties: Downed by Penalty message', () => {
    const { state, moderator, logs } = createTestEnv();
    const p1 = state.getEntity('p1');

    // Execution fail on 30 HP target
    p1.hp = 30;
    state.violationTargetId = 'p1';
    state.violationType = 'execution-fail'; // -40 HP
    moderator.apply();

    runner.assertEqual(p1.hp, 0, 'HP drops to 0');
    runner.assert(logs.some(l => l.includes('has been defeated by penalty!')), 'Log notes defeated by penalty');
  });

  runner.test('Bracket Progression & Derivation of Stages and Modifiers', () => {
    const { state } = createTestEnv();

    // Initial state: no bracket
    runner.assertEqual(state.bracketStage.title, 'No bracket yet');

    // Generate bracket
    state.generateBracket();
    runner.assertEqual(state.bracketStage.title, '🥊 Semifinals (Round 1)');
    runner.assert(state.bracketStage.modifier.includes('+10 Damage to all attacks'), 'Modifier mentions +10 DMG');

    // Pick Semifinal winners
    state.pickBracketWinner('finalA', state.bracket.leaves[0]);
    state.pickBracketWinner('finalB', state.bracket.leaves[2]);
    runner.assertEqual(state.bracketStage.title, '🏆 Final (Round 2)');
    runner.assert(state.bracketStage.modifier.includes('FULL RESTORE'), 'Modifier mentions FULL RESTORE');

    // Pick Champion
    state.pickBracketWinner('champion', state.bracket.leaves[0]);
    runner.assertEqual(state.bracketStage.title, '👑 Tournament Complete');
    runner.assert(state.bracketStage.modifier.includes('ready to face the Boss Dragon'), 'Champion ready for Boss');
  });

  runner.test('Battle History Archiving: Archives prior battle and increments battle number', () => {
    const { state } = createTestEnv();

    runner.assertEqual(state.battleNumber, 1, 'Initial battle number is 1');
    runner.assertEqual(state.battleHistory.length, 0, 'No history initially');

    // Attempt archive with empty log: should NOT create stray history
    state.archiveCurrentBattle('');
    runner.assertEqual(state.battleNumber, 1, 'Empty log does not advance battle number');
    runner.assertEqual(state.battleHistory.length, 0, 'Empty log is not archived');

    // Archive with combat log content
    state.archiveCurrentBattle('<div>Round 1 battle log...</div>');
    runner.assertEqual(state.battleNumber, 2, 'Battle number advances to 2');
    runner.assertEqual(state.battleHistory.length, 1, '1 archived battle');
    runner.assertEqual(state.battleHistory[0].number, 1, 'Archived as Battle 1');

    // Reset all: resets roster stats but preserves battle history
    state.resetAll();
    runner.assertEqual(state.battleHistory.length, 1, 'Battle history retained after Reset All');
  });
}
