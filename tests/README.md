# Game QA checks

The game checks use Node's built-in test runner and do not need a browser or an
extra package:

```powershell
node --test tests/game-data.test.mjs tests/game-ui.test.mjs
```

`game-data.test.mjs` validates the eight-level contract. `game-ui.test.mjs`
checks the offline HTML shell, touch/reduced-motion CSS, JavaScript syntax, and
the deterministic `window.__STARSPROUT_TEST__` hook used by visual QA.

The starter-template test in `rendered-html.test.mjs` predates the game and
should be replaced or removed from the package test script before release.
