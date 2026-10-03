# Game QA checks

The game checks use Node's built-in test runner and do not need a browser or an
extra package:

```powershell
node --test tests/game-data.test.mjs tests/game-ui.test.mjs tests/game-art.test.mjs tests/gameplay-feedback.test.mjs
```

`game-data.test.mjs` validates the 28-level, seven-act campaign, its seven Boss stages,
the stage-20-to-21 and stage-24-to-25 save-migration boundaries, and
the spring, polarity, timed-relay, rift-weaver, gravity, time-freeze, delayed-echo,
star-whale, world-fold, kite-tether, reverse-page, fold-warden, and progressive
constellation-relay data contracts. It also covers continuous weight balance,
foreground/background lane switching, recorded-trajectory bridges, the three-cycle
sky-paper-dragon fight, scale lenses, comet rails, lantern shadows, the Scorewing
Maestro's captured-shard volleys, the six-tide patrol schema, all six event definitions, and
the repeating endless-upgrade cadence while keeping the rush duration at 90 seconds.
`game-ui.test.mjs` checks the offline HTML shell, seven-act route presentation,
responsive touch CSS, the expanded night-watch HUD and event-choice surfaces, and
discovery-only bestiary shell. `game-art.test.mjs` checks the sprite and background
manifests, including the stage-scoped art-v11 atlases. `gameplay-feedback.test.mjs` drives the deterministic
`window.__STARSPROUT_TEST__` hook to cover save migration, goal gating, live
mechanics, Boss dispatch, touch-input behavior, hero modules, repair-zone
objectives, multi-route reactor charging, the six late-game enemy behaviors,
bestiary discovery persistence, stages 21–28, the act 7 growth/rail/shadow/volley
QA controls, and all six night-watch tasks:
action-specific relays, branching escort, falling-seed rescue, action-specific
three-column repair, multi-type meteor counters, and the dawn-warden siege. The
same deterministic hook verifies scheduled patrol events, seeded endless events,
and continued upgrade offers after the first upgrade-round cycle.

The legacy starter-template fixture in `rendered-html.test.mjs` is intentionally
excluded from the game test script.
