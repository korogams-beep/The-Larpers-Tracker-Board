// Static rulebook data: class kits, boss kit, and moderator violation table.
// Pure data only — no logic lives here.

export const CLASS_DATA = {
  Warrior: {
    hp: 200, mp: 60, counters: 2,
    skills: {
      basic: { mp: 5, dmg: 25 },
      primary: { mp: -20, dmg: 45 },
      ultimate: { mp: -40, dmg: 65, status: 'stun' }
    },
    counter: { mp: 0, type: 'reduce', reduce: 0.5, reflect: 10 }
  },
  Brawler: {
    hp: 210, mp: 40, counters: 3,
    skills: {
      basic: { mp: 5, dmg: 30 },
      primary: { mp: -10, dmg: 35 },
      ultimate: { mp: -25, dmg: 80, status: 'shatter' }
    },
    counter: { mp: 0, type: 'reduce', reduce: 0.5 }
  },
  Archer: {
    hp: 180, mp: 80, counters: 2,
    skills: {
      basic: { mp: 5, dmg: 35 },
      primary: { mp: -25, dmg: 50, status: 'blind' },
      ultimate: { mp: -50, dmg: 85 }
    },
    counter: { mp: 0, type: 'reduce', reduce: 0.5 }
  },
  Mage: {
    hp: 160, mp: 110, counters: 2,
    skills: {
      basic: { mp: 5, dmg: 30 },
      primary: { mp: -30, dmg: 50, status: 'burn' },
      ultimate: { mp: -55, dmg: 85 }
    },
    counter: { mp: 0, type: 'absorb', absorb: 30 }
  }
};

export const BOSS_DATA = {
  hp: 400, mp: 120, counters: 0,
  skills: {
    basic: { mp: 0, dmg: 40 },
    primary: { mp: -35, dmg: 30, status: 'stun' },
    ultimate: { mp: -50, dmg: 80, status: 'burn' }
  },
  passiveThreshold: 200,
  passiveBonus: 10
};

// Status effects: a skill tagged with `status` gives the Game Master a
// physical 1d6 to roll after the hit lands. Odd = fails, Even = succeeds.
// On success, the tagged status is applied to whoever was HIT (the
// defender of that turn) and plays out on their next relevant turn.
export const STATUS_EFFECTS = {
  stun:    { label: 'Stun',    badge: 'STUNNED',   description: 'Target completely loses their next turn.' },
  shatter: { label: 'Shatter', badge: 'SHATTERED', description: "Target's guard is broken — no Counter on their next turn." },
  blind:   { label: 'Blind',   badge: 'BLINDED',   description: "Target's next attack deals half (50%) damage." },
  burn:    { label: 'Burn',    badge: 'BURNED',    description: 'Target takes 15 DMG at the start of their next turn.' }
};

// Maps a status key to the boolean flag that carries it on a Fighter.
export const STATUS_FIELD = {
  stun: 'statusStun',
  shatter: 'statusShatter',
  blind: 'statusBlind',
  burn: 'statusBurn'
};

export const VIOLATIONS = {
  'execution-fail': { label: 'Execution Fail', call: 'EXECUTION FAIL', hpPenalty: 40 },
  'tongue-twister': { label: 'Tongue Twister', call: 'MISPRONOUNCED', hpPenalty: 20, consumesMp: true },
  'ooc':            { label: 'Out-of-Character', call: 'OOC WARNING', hpPenalty: 25, warnFirst: true },
  'stutter':        { label: 'Stutter / Hesitation', call: 'HESITATION', downgrade: true },
  'safety-breach':  { label: 'Safety Breach', call: 'SAFETY BREACH', forfeit: true }
};

export const SKILL_LABEL = { basic: 'Basic', primary: 'Primary', ultimate: 'Ultimate' };

export const CLASS_NAMES = Object.keys(CLASS_DATA);
