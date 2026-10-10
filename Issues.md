# The Larpers Tracker Board — Issues, Edge Cases & Roadmap Log

**Document Created:** 2026-10-11  
**Last Updated:** 2026-10-11  
**Status:** Actively Maintained  

This document tracks all identified issues, rule ambiguities, mobile UX friction points, edge cases, and their verified resolutions.

---

## Priority Classification
- 🔴 **High**: Violates game rules or allows game-breaking state corruption.
- 🟡 **Medium**: Edge cases causing gameplay confusion or requiring manual GM intervention.
- 🟢 **Low / Polish**: UX enhancements, mobile usability improvements, and convenience features.

---

## 1. Active Issues & Design Notes

### [ISSUE-07] Boss Dragon MP Recovery Cap
- **Location:** [`js/data/gameData.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/data/gameData.js#L43-L52)
- **Description:** Boss Dragon has 120 MP. Primary (Dragon Roar) costs 35 MP, and Ultimate (Inferno Breath) costs 50 MP. Tail Swipe costs 0 MP and grants +0 MP (Page 4: `Basic (0 MP): Tail Swipe!`). Unlike player basic attacks which regenerate +5 MP, the Dragon has no way to regain MP. Once the Dragon spends 120 MP (e.g. 1 Ult + 2 Primaries), it is locked to Basic attacks for the rest of the fight.
- **Rulebook Context:** Page 1 states: *"Every Basic Attack regenerates +5 MP."* But Page 4 specifically lists `Basic (0 MP)`.
- **Status:** Intentional rulebook design. Follows explicit Page 4 text (0 MP). GM should be aware of this finite boss resource pool.

### [ISSUE-11] Turn Lock Requires Manual Clear Button Tap
- **Location:** [`js/ui/App.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/App.js#L175-L180)
- **Description:** When a player drinks a Potion, their turn is consumed. On their next turn, the referee taps "Clear Turn Lock" on their card or status chip to resume normal action.
- **Status:** Working as designed. The button allows the referee full manual control over when a fighter's next official turn is called in real life.

---

## 2. Resolved Issues (Changelog) ✅

| Issue ID | Priority | Description | Resolution Details | Date |
|---|---|---|---|---|
| **RESOLVED-01** | 🔴 High | Counter reflection defeat detection was bypassed due to premature `prevAttackerHp` capture | Moved `prevAttackerHp` capture before counter processing in [`CombatEngine.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/engine/CombatEngine.js#L112). Lethal reflection log now triggers properly. | 2026-10-11 |
| **RESOLVED-02** | 🔴 High | Burn damage did not tick during Stunned turns and did not abort attack on lethal burn | Enhanced [`CombatEngine.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/engine/CombatEngine.js#L50-L98) to process burn during stun and abort attack execution if fighter succumbs to lethal burn. | 2026-10-11 |
| **RESOLVED-03** | 🔴 High | Boss Dragon Enrage Passive was active in code despite being removed from rules | Removed `passiveThreshold` and `passiveBonus` across [`gameData.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/data/gameData.js), [`CombatEngine.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/engine/CombatEngine.js), [`CombatView.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/CombatView.js), [`CardsView.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/CardsView.js), and tests. | 2026-10-11 |
| **RESOLVED-04** | 🟢 Low | Verification of Counter MP consumption | Verified and test-asserted in [`suite_situations_expanded.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/tests/suite_situations_expanded.js) that all 4 class Counters cost 0 MP and do not deduct MP from defender. | 2026-10-11 |
| **RESOLVED-05** | 🔴 High | Downed (0 HP) and Forfeited players could self-revive via Potion/Elixir buttons | Added checks in [`App.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/App.js#L148), [`CardsView.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/CardsView.js), and [`StatusStripView.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/StatusStripView.js). Buttons are disabled and blocked when `hp <= 0` or `forfeited === true`. | 2026-10-11 |
| **RESOLVED-06** | 🔴 High | Floating Action Button (`#fabExecute`) bypassed pending 1d6 status rolls | Added guard in [`App.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/App.js#L131) to prevent turn execution via FAB if `state.pendingStatusRoll` is present. | 2026-10-11 |
| **RESOLVED-07** | 🔴 High | Attacking downed (`hp <= 0`) or forfeited defenders was not blocked | Added validation in [`CombatEngine.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/engine/CombatEngine.js#L33-L34) blocking attacks against already downed or forfeited defenders. | 2026-10-11 |
| **RESOLVED-08** | 🟡 Medium | `swapAttackerDefender()` automatically assigned defeated defender as next attacker | Updated [`CombatEngine.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/engine/CombatEngine.js#L199-L208) to prevent swapping to a downed/forfeited defender unless eligible for Last Ditch Effort. | 2026-10-11 |
| **RESOLVED-09** | 🟡 Medium | Round 1 modifier (+10 DMG) was incorrectly applying to Boss Dragon | Scoped Round 1 bonus in [`CombatEngine.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/engine/CombatEngine.js#L104) and [`CombatView.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/CombatView.js#L78) so it only applies in Player matches and never to Boss Dragon or during Champion Duel. | 2026-10-11 |
| **RESOLVED-10** | 🔴 High | Champion did not receive full restore when sent to fight Boss Dragon | Implemented `prepareChampionForBossDuel()` in [`GameState.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/state/GameState.js#L213) and [`App.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/App.js#L433). Champion receives full Max HP/MP, Potions, Counters, cleared statuses, cleared Round 1 bonus, and locked duel. | 2026-10-11 |
| **RESOLVED-11** | 🟡 Medium | Accidental touch on card Class dropdown instantly wiped fighter progress mid-match | Added confirmation prompt in [`App.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/App.js#L249-L257) if stats have changed, and records snapshot to undo stack. | 2026-10-11 |
| **RESOLVED-12** | 🟡 Medium | Stun turn skip left Hesitation penalty active across multiple rounds | Updated [`CombatEngine.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/engine/CombatEngine.js#L49) so Stun turn skip satisfies and clears `forcedBasic`. | 2026-10-11 |
| **RESOLVED-13** | 🟡 Medium | Lack of session persistence caused data loss on mobile browser refresh | Implemented `saveToStorage()` and `loadFromStorage()` in [`GameState.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/state/GameState.js) and [`App.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/App.js#L83). Tournament state autosaves to `localStorage`. | 2026-10-11 |
| **RESOLVED-14** | 🟢 Low | Renaming fighters on card inputs did not record undo history | Added `pushHistory()` in [`App.js`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/js/ui/App.js#L244) when a fighter name change is committed. | 2026-10-11 |
| **RESOLVED-15** | 🟢 Low | Dice button glyphs (`⚀`–`⚅`) lacked contrast in outdoor mobile conditions | Updated [`index.html`](file:///c:/Users/Gams/The-Larpers-Tracker-Board/index.html#L58-L108) dice pads with clear numeric labels (`1 ⚀`, `2 ⚁`, `3 ⚂`, `4 ⚃`, `5 ⚄`, `6 ⚅`). | 2026-10-11 |
