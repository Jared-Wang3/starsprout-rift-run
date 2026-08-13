# Game QA checks

The game checks use Node's built-in test runner and do not need a browser or an
extra package:

```powershell
node --test tests/game-data.test.mjs tests/game-ui.test.mjs tests/game-art.test.mjs tests/gameplay-feedback.test.mjs
```

`game-data.test.mjs` validates the 12-level campaign, its three Boss stages, and
the spring, polarity, timed-relay, and rift-weaver data contracts.
`game-ui.test.mjs` checks the offline HTML shell, responsive touch CSS, and
JavaScript syntax. `game-art.test.mjs` checks the sprite and background
manifests. `gameplay-feedback.test.mjs` drives the deterministic
`window.__STARSPROUT_TEST__` hook to cover save migration, goal gating, live
mechanics, Boss dispatch, touch-input behavior, hero modules, repair-zone
objectives, and multi-route reactor charging.

The legacy starter-template fixture in `rendered-html.test.mjs` is intentionally
excluded from the game test script.
