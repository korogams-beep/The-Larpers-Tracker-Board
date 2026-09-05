# The Larpers — Moderator Dashboard

Same app, same UI, same rules — just reorganized into small, testable modules
instead of one big inline `<script>`.

## Structure

```
index.html               Markup only, loads css/styles.css and js/main.js
css/styles.css           All styling (unchanged from the single-file version)
js/
  data/gameData.js       Class kits, Boss kit, Violations table — pure data
  utils/helpers.js        clamp / escapeHtml / pct / hpColor
  models/Fighter.js       Fighter base class, PlayerFighter, BossFighter
  state/GameState.js      Roster + selections + undo history (no DOM)
  engine/CombatEngine.js  Turn Action resolution rules (MP gating, Last Ditch,
                          Hesitation, dodge/counter math, defeat detection)
  engine/ModeratorEngine.js  Violations & Penalties table application
  ui/Logger.js            Combat Log DOM wrapper (append / read / restore)
  ui/CardsView.js          Fighters tab cards
  ui/StatusStripView.js    Always-visible mini HP strip
  ui/CombatView.js         Attacker/Defender/Skills/Counter panel
  ui/ModeratorView.js      Moderator tab
  ui/ArenaView.js          Arena Modifiers tab
  ui/TabNav.js             Tab switching + attention dots
  ui/App.js                Composition root: wires DOM events to engines/state
  main.js                  Boots the App on DOMContentLoaded
```

`GameState` and the two engines have no DOM references at all, so the rules
can be unit-tested in plain Node (see below) without a browser.

## Run locally

Any static file server works, since the app is plain ES modules (no bundler
needed):

```bash
npx serve .
# or
python3 -m http.server 5173
```

Then open the printed local URL. Opening `index.html` directly via
`file://` will NOT work — ES module imports require an HTTP origin.

## Deploy to Vercel

This is a static site with no build step.

```bash
npm i -g vercel   # if you don't have it
vercel            # deploy from this folder
vercel --prod     # promote to production
```

Or via the Vercel dashboard: "Add New Project" → import this folder/repo →
Framework Preset: **Other** → Build Command: *(none)* → Output Directory:
`.` → Deploy.
