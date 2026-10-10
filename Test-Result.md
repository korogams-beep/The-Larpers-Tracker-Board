# The Larpers: Rules & Tournament Tracker — Test Results & Situational Analysis

**Execution Date:** 2026-10-11  
**Runtime:** Node.js v24.19.0 (ES Modules)  
**Total Test Suites:** 7  
**Total Tests Executed:** 58  
**Passing:** 58 (100%)  
**Failing:** 0 (0%)  
**Status:** ALL TESTS PASSING  

---

## 1. Executive Summary

A comprehensive automated test suite and situational simulation harness was designed, executed, and validated against the official rulebook for **THE LARPERS: RULES & TOURNAMENT KITS** (v5).

The test harness exercises every component of the rulebook:
- All 4 player character classes (**Warrior, Brawler, Archer, Mage**) and **Boss Dragon**
- Defense mechanics: **3-Second Universal Dodge Rule** and class-specific **Counters** (verified 0 MP cost)
- **Status Effects**: 1d6 roll resolution (Odd fail, Even succeed), **Stun, Shatter, Blind, Burn**
- **Violations & Penalties**: Execution Fail, Tongue Twister, Out-of-Character (OOC), Hesitation/Stutter, Safety Breach, and the **Critical Rule on Boss Dragon Non-Exemption**
- **Arena Modifiers**: Round 1 (+10 DMG to player matches only), Round 2 (FULL RESTORE), and Boss Phase 1d6 rolls
- **Champion vs Boss Dragon Duel**: Champion receives a full reset (Max HP/MP, Potions, Counters renewed, clean slate) before entering the final duel
- **Situational Mixes**: Multi-status stacking, Blind + Dodge stacking, Shatter + Dodge interactions, Consumable turn-locks, lethal counter reflections, and **Last Ditch Effort** duels
- **Full End-to-End Match Simulation**: Complete tournament lifecycle from bracket generation to championship climax.

---

## 2. Issues Discovered & Resolved During Testing

### Issue 1: Counter Reflection Defeat Detection Bypassed
- **Root Cause:** In [`CombatEngine.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/engine/CombatEngine.js), counter reflection damage was subtracted from `attacker.hp` on line 124. However, `const prevAttackerHp = attacker.hp;` was evaluated on line 142 *after* the reflection occurred. As a result, `attackerJustDied` evaluated to `false`.
- **Fix:** Moved `prevAttackerHp` capture to immediately before counter calculations.

### Issue 2: Burn Timing & Lethal Burn Resolution
- **Root Cause:** Burn damage was only processed if a skill was selected, and did not tick if a turn was skipped due to Stun. Furthermore, if Burn damage reduced a fighter to 0 HP outside the Champion duel, the engine continued executing the attack.
- **Fix:** Enhanced [`CombatEngine.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/engine/CombatEngine.js) to process Burn during Stunned turns, and halt attack execution if a fighter succumbs to lethal burn at the start of their turn.

### Issue 3: Removal of Boss Dragon Enrage Passive
- **Root Cause:** Code previously contained `passiveThreshold: 200` (+10 DMG) from legacy drafts.
- **Fix:** Completely removed the enrage passive from data, combat engine, views, badges, and tests.

### Issue 4: Round 1 Modifier Scoped Strictly to Players
- **Root Cause:** Round 1 modifier (+10 DMG) was applying to Boss Dragon attacks if Round 1 was toggled.
- **Fix:** Scoped Round 1 bonus in [`CombatEngine.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/engine/CombatEngine.js) and [`CombatView.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/CombatView.js) so it only applies in Player matches and never to Boss Dragon or during the Champion Duel.

### Issue 5: Champion Full Restore for Boss Dragon Duel
- **Root Cause:** Sending the Champion to fight the Boss Dragon did not restore the Champion's resources after grueling semifinals.
- **Fix:** Implemented `prepareChampionForBossDuel()` in [`GameState.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/state/GameState.js) and [`App.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/App.js). When entering the final duel, the Champion receives full Max HP, full Max MP, renewed Potions & Counters, cleared statuses, cleared Round 1 bonus, and clean duel lock.

### Issue 6: Downed/Forfeited Fighters and Auto-Swap Protection
- **Root Cause:** Attacks could target downed defenders, downed players could drink potions, and auto-swap placed dead defenders into the attacker role.
- **Fix:** Added validation in [`CombatEngine.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/engine/CombatEngine.js) blocking attacks on downed/forfeited targets, disabled potion buttons for downed/forfeited players in [`CardsView.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/CardsView.js) and [`StatusStripView.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/StatusStripView.js), and prevented auto-swapping to defeated combatants.

---

## 3. Test Suite Breakdown & Verification Details

### Suite 1: Class Kits & Base Stats (7 Tests)
| Test Case | Description | Result | Execution Time |
|---|---|---|---|
| **Warrior Base Stats & Skills** | HP: 200, MP: 60, Counters: 2. Getsuga (25 DMG, +5 MP), Getsuga Tensho (45 DMG, -20 MP), Bankai (65 DMG, -40 MP, Stun), Full Counter (-50%, reflects 10) | **PASS** | 0.54ms |
| **Brawler Base Stats & Skills** | HP: 210, MP: 40, Counters: 3. Ora (30 DMG, +5 MP), Ora Ora Ora (35 DMG, -10 MP), Serious Punch (80 DMG, -25 MP, Shatter), Ultra Instinct (-50%) | **PASS** | 0.10ms |
| **Archer Base Stats & Skills** | HP: 180, MP: 80, Counters: 2. Spirit Gun (35 DMG, +5 MP), Shadow Clone (50 DMG, -25 MP, Blind), Unlimited Blade Works (85 DMG, -50 MP), Substitution Jutsu (-50%) | **PASS** | 0.11ms |
| **Mage Base Stats & Skills** | HP: 160, MP: 110, Counters: 2. Thunderbolt (30 DMG, +5 MP), Kamehameha (50 DMG, -30 MP, Burn), Megumin's Explosion (85 DMG, -55 MP), Domain Expansion (absorbs 30) | **PASS** | 0.08ms |
| **Boss Dragon Stats & Skills** | HP: 400, MP: 120, Counters: 0. Tail Swipe (40 DMG, 0 MP), Dragon Roar (30 DMG, -35 MP, Stun), Inferno Breath (80 DMG, -50 MP, Burn) | **PASS** | 0.13ms |
| **Basic Attack MP Regen & Clamping** | Basic attacks replenish +5 MP; MP is correctly capped at max MP | **PASS** | 0.56ms |
| **MP Gating** | Insufficient MP blocks Primary and Ultimate; prevents negative MP balance | **PASS** | 0.08ms |

---

### Suite 2: Defense — 3-Second Dodge & Counters (10 Tests)
| Test Case | Description | Result | Execution Time |
|---|---|---|---|
| **Dodge vs Basic Attack** | 3-Second Dodge halves Basic Attack damage (`Math.round(dmg * 0.5)`). Costs 0 MP, 0 counters | **PASS** | 0.10ms |
| **Dodge vs Primary Attack** | Dodge rule specifically fails against Primary skills; lands at 100% full damage | **PASS** | 0.18ms |
| **Dodge vs Ultimate Attack** | Dodge rule specifically fails against Ultimate skills; lands at 100% full damage | **PASS** | 0.18ms |
| **Warrior Full Counter** | Halves incoming damage (-50%) and reflects 10 DMG back to attacker | **PASS** | 0.10ms |
| **Lethal Counter Reflection** | Reflection damage properly downs attacker when attacker HP <= 10 | **PASS** | 0.14ms |
| **Brawler Ultra Instinct** | Halves incoming damage (-50%) and consumes 1 counter slot | **PASS** | 0.21ms |
| **Archer Substitution Jutsu** | Halves incoming damage (-50%) and consumes 1 counter slot | **PASS** | 0.17ms |
| **Mage Domain Expansion** | Absorbs flat 30 DMG. Attacks <= 30 deal 0 damage. Attacks > 30 deal `DMG - 30` | **PASS** | 0.21ms |
| **Counter Exhaustion** | When all class counters are spent, Counter option fails and full damage lands | **PASS** | 0.12ms |
| **Boss Dragon Counter Check** | Boss Dragon has 0 counters; cannot use counter mechanics | **PASS** | 0.07ms |

---

### Suite 3: Status Effects (6 Tests)
| Test Case | Description | Result | Execution Time |
|---|---|---|---|
| **1d6 Status Roll Mechanics** | Odd rolls (1, 3, 5) fail status infliction; Even rolls (2, 4, 6) succeed | **PASS** | 0.11ms |
| **Stun Effect** | Target completely loses their entire next turn; Stun clears and turn swaps | **PASS** | 0.09ms |
| **Shatter Effect** | Target's guard is broken; cannot use Counter skills on next turn; clears after turn | **PASS** | 0.08ms |
| **Blind Effect** | Target's vision is impaired; next attack deals half (50%) damage; clears after attack | **PASS** | 0.06ms |
| **Burn Effect** | Target scorched; takes 15 DMG at the start of their next turn; clears after tick | **PASS** | 0.08ms |
| **Boss Dragon Status Skills** | Dragon Roar queues Stun roll; Inferno Breath queues Burn roll | **PASS** | 0.11ms |

---

### Suite 4: Violations, Penalties & Moderator Guidelines (6 Tests)
| Test Case | Description | Result | Execution Time |
|---|---|---|---|
| **Execution Fail Penalty** | Sound/gesture/prop failure enforces immediate -40 HP penalty | **PASS** | 0.13ms |
| **Tongue Twister Penalty** | Mispronunciation enforces -20 HP penalty and consumes attempted skill MP | **PASS** | 0.06ms |
| **Out-of-Character (OOC)** | 1st offense issues verbal warning (0 HP penalty); 2nd offense enforces -25 HP | **PASS** | 0.09ms |
| **Stutter / Hesitation** | Pausing >3s or >10s turn timer forces Basic Attack (0 MP cost, 0 MP regen) | **PASS** | 0.09ms |
| **Safety Breach Penalty** | Reckless swinging or contact triggers immediate match forfeiture (HP/MP set to 0) | **PASS** | 0.08ms |
| **CRITICAL RULE: Boss Penalties** | Boss Dragon is NOT exempt: takes Execution Fail, Tongue Twister, OOC, Stutter, Forfeit | **PASS** | 0.12ms |

---

### Suite 5: Arena Modifiers & Boss Phase (5 Tests)
| Test Case | Description | Result | Execution Time |
|---|---|---|---|
| **Round 1 Arena Modifier** | +10 Damage added to player attacks while active; toggling off restores normal DMG | **PASS** | 0.07ms |
| **Round 2 FULL RESTORE** | All players reset to Max HP/MP; Potions & Counters renewed; Statuses cleared; Disciplinary OOC records preserved | **PASS** | 0.14ms |
| **Boss Phase 1d6 Roll** | Physical roll 1-3 grants Boss Dragon +10 ATK; roll 4-6 grants Champion +10 ATK | **PASS** | 0.03ms |
| **Boss Damage Consistency** | Boss Dragon deals base 40 DMG across all HP ranges (Enrage passive removed) | **PASS** | 0.07ms |
| **Round 1 Scoped to Players** | Round 1 modifier applies strictly to player matches and NEVER to Boss Dragon | **PASS** | 0.06ms |

---

### Suite 6: Situational Mixes & Edge Cases (16 Tests)
| Test Case | Description | Result | Execution Time |
|---|---|---|---|
| **Consumable Turn-Lock** | Drinking Potion (+50 HP) or Elixir (+40 MP) locks turn; attacking on same turn blocked | **PASS** | 0.08ms |
| **Blind + Dodge Stacking** | Blind attacker (-50%) vs Dodging defender (-50%): stacked reduction (30 -> 15 -> 8 DMG) | **PASS** | 0.06ms |
| **Blind + Counter Stacking** | Blind attacker vs Mage Domain Expansion: absorbs 30, then halves remaining DMG | **PASS** | 0.05ms |
| **Shatter + Dodge Interaction** | Shattered defender cannot counter, but CAN successfully dodge Basic attacks | **PASS** | 0.04ms |
| **Stun + Burn Turn Start** | Stunned and Burned fighter takes 15 Burn DMG at start of turn and loses turn | **PASS** | 0.07ms |
| **Last Ditch Effort: Outside Duel** | At 0 HP outside Champion vs Dragon duel, actions are blocked ("downed and out") | **PASS** | 0.04ms |
| **Last Ditch Effort: Champion Win** | Champion at 0 HP defeats Boss Dragon using Ultimate -> Champion wins the duel! | **PASS** | 0.07ms |
| **Last Ditch Effort: Ultimate Only** | At 0 HP in duel, selecting Basic or Primary attack is strictly blocked | **PASS** | 0.04ms |
| **Last Ditch Effort: Single Use** | Last Ditch Effort is strictly once-per-match; second attempt at 0 HP is blocked | **PASS** | 0.06ms |
| **Last Ditch Effort: Mutual Fall** | Boss Dragon at 0 HP defeats Champion with Ultimate -> "Both have fallen!" | **PASS** | 0.06ms |
| **State Snapshots & Undo** | Deep JSON snapshots preserve complete fighter stats, counters, buffs, and restore cleanly | **PASS** | 0.11ms |
| **End-to-End Match Simulation** | Full bracket semifinal, hesitation penalty, stun roll, round 2 restore, boss phase duel | **PASS** | 0.39ms |
| **Downed/Forfeited Targeting** | Targeting a downed (0 HP) or forfeited defender is strictly blocked | **PASS** | 0.07ms |
| **Auto-Swap on Defeat** | Defeating a defender does not auto-swap the defeated fighter into the attacker slot | **PASS** | 0.05ms |
| **Champion Boss Duel Reset** | Champion entering Boss Duel receives full Max HP/MP, Potions, Counters, cleared statuses | **PASS** | 0.08ms |
| **Stun Clears Hesitation** | Stun turn skip satisfies and clears Hesitation (Stutter) penalty | **PASS** | 0.06ms |

---

### Suite 7: Deep Situations Matrix & Complex Mixes (8 Tests)
| Test Case | Description | Result | Execution Time |
|---|---|---|---|
| **Dodge Matrix across All Classes** | Tested all 5 combatants (Warrior, Brawler, Archer, Mage, Dragon) across Basic, Primary, Ultimate | **PASS** | 1.03ms |
| **Counter Matrix vs Boss Dragon** | Tested all 4 player defense mechanisms against Dragon Tail Swipe (40 base DMG) | **PASS** | 0.29ms |
| **Counter 0 MP Verification** | Verified all class Counters cost 0 MP and never consume defender MP | **PASS** | 0.18ms |
| **Lethal Burn at Start of Turn** | Fighter at 10 HP with Burn dies at turn start; cannot launch attack; turn passes | **PASS** | 0.09ms |
| **Simultaneous Stun & Burn** | Burn ticks (15 DMG), Burn clears, Stun clears, turn passes | **PASS** | 0.06ms |
| **Lethal Moderator Penalty** | Penalty reducing HP from 30 to 0 triggers "defeated by penalty!" log | **PASS** | 0.08ms |
| **Bracket Stage Derivation** | Progression through Semifinals (Round 1), Final (Round 2), Tournament Complete | **PASS** | 0.16ms |
| **Battle History Archiving** | Filing Battle 1, incrementing to Battle 2, ignoring empty logs on reset | **PASS** | 0.13ms |

---

## 4. Comprehensive Situational Matrices

### Matrix A: 3-Second Dodge vs All Class Skills

| Attacker Class | Skill Used | Base DMG | Defender Action | Actual Damage Taken | Expected Rulebook Behavior | Status |
|---|---|---|---|---|---|---|
| **Warrior** | Basic (Getsuga) | 25 | Dodge | **13** | Halved (Math.round(25 * 0.5)) | **PASS** |
| **Warrior** | Primary (Getsuga Tensho) | 45 | Dodge | **45** | Full damage (Dodge invalid) | **PASS** |
| **Warrior** | Ultimate (Bankai) | 65 | Dodge | **65** | Full damage (Dodge invalid) | **PASS** |
| **Brawler** | Basic (Ora) | 30 | Dodge | **15** | Halved (Math.round(30 * 0.5)) | **PASS** |
| **Brawler** | Primary (Ora Ora Ora) | 35 | Dodge | **35** | Full damage (Dodge invalid) | **PASS** |
| **Brawler** | Ultimate (Serious Punch) | 80 | Dodge | **80** | Full damage (Dodge invalid) | **PASS** |
| **Archer** | Basic (Spirit Gun) | 35 | Dodge | **18** | Halved (Math.round(35 * 0.5)) | **PASS** |
| **Archer** | Primary (Shadow Clone) | 50 | Dodge | **50** | Full damage (Dodge invalid) | **PASS** |
| **Archer** | Ultimate (Blade Works) | 85 | Dodge | **85** | Full damage (Dodge invalid) | **PASS** |
| **Mage** | Basic (Thunderbolt) | 30 | Dodge | **15** | Halved (Math.round(30 * 0.5)) | **PASS** |
| **Mage** | Primary (Kamehameha) | 50 | Dodge | **50** | Full damage (Dodge invalid) | **PASS** |
| **Mage** | Ultimate (Explosion) | 85 | Dodge | **85** | Full damage (Dodge invalid) | **PASS** |
| **Boss Dragon** | Basic (Tail Swipe) | 40 | Dodge | **20** | Halved (Math.round(40 * 0.5)) | **PASS** |
| **Boss Dragon** | Primary (Dragon Roar) | 30 | Dodge | **30** | Full damage (Dodge invalid) | **PASS** |
| **Boss Dragon** | Ultimate (Inferno Breath) | 80 | Dodge | **80** | Full damage (Dodge invalid) | **PASS** |

---

### Matrix B: Player Counters vs Boss Dragon (40 Base DMG)

| Defender Class | Counter Skill | Mechanic | Counter Cost | Damage Taken | Boss Damage Taken | Remaining Counters |
|---|---|---|---|---|---|---|
| **Warrior** | Full Counter | -50% DMG, reflect 10 | 0 MP, 1 slot | **20 DMG** | **10 DMG** | 1 / 2 |
| **Brawler** | Ultra Instinct | -50% DMG | 0 MP, 1 slot | **20 DMG** | 0 DMG | 2 / 3 |
| **Archer** | Substitution Jutsu | -50% DMG | 0 MP, 1 slot | **20 DMG** | 0 DMG | 1 / 2 |
| **Mage** | Domain Expansion | Flat 30 DMG Absorb | 0 MP, 1 slot | **10 DMG** | 0 DMG | 1 / 2 |

---

### Matrix C: Status Effect Interactions & Combinations

| Situation Mix | Interacting Mechanics | Sequence of Events | Outcome | Rulebook Compliance |
|---|---|---|---|---|
| **Blinded + Dodged Basic** | Blind (-50%) + Dodge (-50%) | Base 30 DMG -> Dodge halves to 15 -> Blind halves to 8 | **8 DMG taken** | Double reduction stacks correctly |
| **Blinded + Mage Domain** | Blind (-50%) + Absorb (30) | Base 85 DMG -> Absorbed to 55 -> Blind halves to 28 | **28 DMG taken** | Defense absorption precedes blind reduction |
| **Shattered Defender** | Shatter + Dodge vs Basic | Shatter disables Counter; Defender uses Dodge | **Halved DMG lands** | Shatter only breaks guard (Counters), not Dodge |
| **Stunned & Burned** | Stun + Burn at Turn Start | Turn starts -> 15 Burn DMG taken -> Stun skips turn | **15 DMG taken, turn lost** | Both status effects resolve cleanly |
| **Lethal Burn** | Burn with HP <= 15 | Turn starts -> 15 Burn DMG -> HP reaches 0 | **Fighter downed, turn passes** | Attack never executes |

---

### Matrix D: Last Ditch Effort Scenarios (Champion vs Boss Dragon)

| Scenario | Attacker HP | Target HP | Skill Used | Duel Active? | Outcome |
|---|---|---|---|---|---|
| **Downed in Semifinal** | 0 HP | 100 HP | Ultimate | No | **Blocked:** Downed fighters cannot act outside final duel |
| **Non-Ultimate in Duel** | 0 HP | 50 HP | Basic / Primary | Yes | **Blocked:** At 0 HP, only Ultimate is allowed |
| **Champion Lethal Ult** | 0 HP | 50 HP | Ultimate (65 DMG) | Yes | **Champion Victory:** Defeats Dragon, Champion wins even at 0 HP |
| **Champion Non-Lethal Ult** | 0 HP | 200 HP | Ultimate (65 DMG) | Yes | **Dragon Survives:** Last Ditch spent; Champion cannot act again at 0 HP |
| **Boss Dragon Lethal Ult** | 0 HP | 70 HP | Ultimate (80 DMG) | Yes | **Mutual Fall:** "Both have fallen!" |

---

## 5. End-to-End Tournament Simulation Walkthrough

A complete multi-round tournament was simulated from start to finish:

```
[Bracket Generation] -> 4 Players Shuffled (Warrior, Brawler, Archer, Mage)
        │
[Round 1 Semifinals] -> Arena Modifier Active: +10 Damage to all attacks
        ├─ Warrior vs Brawler:
        │   ├─ Turn 1: Warrior Primary (45 + 10 = 55) vs Ultra Instinct (-50%) -> 28 DMG taken
        │   ├─ Penalty: Brawler stutters -> Moderator Hesitation penalty enforces Basic Attack
        │   ├─ Turn 2: Brawler forced Basic (30 + 10 = 40 DMG, 0 MP) -> 40 DMG taken by Warrior
        │   ├─ Turn 3: Warrior Ultimate (Bankai: 75 DMG) -> Brawler hit for 75 DMG
        │   └─ Status Roll: GM rolls 4 (Even) -> Brawler is STUNNED -> Turn 4 lost!
        │
[Round 2 Finals]     -> Arena Modifier: FULL RESTORE
        │               All players reset to Max HP & MP, Potions & Counters renew
        │
[Boss Phase Prep]    -> Champion Warrior selected; Boss Phase 1d6 rolled (Roll 2 -> Dragon +10 ATK)
        │
[Boss Dragon Duel]   -> Champion Duel Active (Final Duel lock)
        ├─ Champion Primary (Getsuga Tensho: 45 DMG) -> Boss HP 400 -> 355
        ├─ Dragon Tail Swipe (40 base + 10 buff = 50 DMG) -> Champion HP 200 -> 150
        └─ Duel resolves through tactical consumables, status effects, and final victory!
```

---

## 6. How to Run the Tests

To run the automated test suite locally:

```bash
# Using npm
npm test

# Or directly with Node.js
node tests/run_all.js
```

All 54 tests run synchronously in milliseconds with zero dependencies.
