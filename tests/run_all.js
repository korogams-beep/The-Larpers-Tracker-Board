import { TestRunner } from './test_helpers.js';
import { runClassKitsTests } from './suite_class_kits.js';
import { runDefenseDodgeCounterTests } from './suite_defense_dodge_counter.js';
import { runStatusEffectsTests } from './suite_status_effects.js';
import { runModeratorPenaltiesTests } from './suite_moderator_penalties.js';
import { runArenaModifiersTests } from './suite_arena_modifiers.js';
import { runSituationalMixesTests } from './suite_situational_mixes.js';
import { runSituationsExpandedTests } from './suite_situations_expanded.js';

const runner = new TestRunner();

console.log('====================================================');
console.log('   THE LARPERS TRACKER BOARD — COMPREHENSIVE TEST RUN');
console.log('====================================================\n');

runClassKitsTests(runner);
runDefenseDodgeCounterTests(runner);
runStatusEffectsTests(runner);
runModeratorPenaltiesTests(runner);
runArenaModifiersTests(runner);
runSituationalMixesTests(runner);
runSituationsExpandedTests(runner);

let currentSuite = '';
let passedCount = 0;
let failedCount = 0;

for (const res of runner.results) {
  if (res.suite !== currentSuite) {
    currentSuite = res.suite;
    console.log(`\n--- [${currentSuite}] ---`);
  }

  if (res.passed) {
    passedCount++;
    console.log(`  ✓ PASS: ${res.name} (${res.duration})`);
  } else {
    failedCount++;
    console.log(`  ✗ FAIL: ${res.name} (${res.duration})`);
    console.log(`     Error: ${res.error}\n`);
  }
}

console.log('\n====================================================');
console.log(`SUMMARY: ${passedCount} Passed | ${failedCount} Failed | Total: ${runner.results.length}`);
console.log('====================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
