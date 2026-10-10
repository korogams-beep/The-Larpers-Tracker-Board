import { GameState } from '../js/state/GameState.js';
import { CombatEngine } from '../js/engine/CombatEngine.js';
import { ModeratorEngine } from '../js/engine/ModeratorEngine.js';

export function createTestEnv() {
  const state = new GameState();
  const logs = [];
  const history = [];

  const logFn = (msg) => logs.push(msg);
  const pushHistoryFn = () => history.push(state.snapshot());

  const combat = new CombatEngine(state, logFn, pushHistoryFn);
  const moderator = new ModeratorEngine(state, logFn, pushHistoryFn);

  return { state, combat, moderator, logs, history };
}

export class TestRunner {
  constructor() {
    this.results = [];
    this.currentSuite = '';
  }

  suite(name) {
    this.currentSuite = name;
  }

  test(name, fn) {
    const startTime = performance.now();
    try {
      fn();
      const duration = (performance.now() - startTime).toFixed(2);
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: true,
        duration: `${duration}ms`,
        error: null
      });
    } catch (err) {
      const duration = (performance.now() - startTime).toFixed(2);
      this.results.push({
        suite: this.currentSuite,
        name,
        passed: false,
        duration: `${duration}ms`,
        error: err.stack || err.message
      });
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message || ''} | Expected: ${expected}, Got: ${actual}`);
    }
  }

  assertDeepEqual(actual, expected, message) {
    const aStr = JSON.stringify(actual);
    const eStr = JSON.stringify(expected);
    if (aStr !== eStr) {
      throw new Error(`Assertion failed: ${message || ''} | Expected: ${eStr}, Got: ${aStr}`);
    }
  }
}
