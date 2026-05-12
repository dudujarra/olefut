# SPEC-176: E2E Page-Error Gate (shared Playwright fixture)

> **Bloco 3 / safety net.** Extends SPEC-164 — closes the audit gap "E2E specs
> never inspect runtime console / pageerror output, so DOM-correctness bugs
> ship silently".

---

## Why

SPEC-164 added six Playwright specs that assert *visible* DOM content
(`expect(text.length).toBeGreaterThan(...)`, `await expect(element).toBeVisible()`,
etc). Every spec passed even when the page logged a fatal React warning —
the test framework never looked at the browser's console.

Concrete case found in the brutal audit (BUG-084): `StandingsView` used
`<Tooltip><th>...</th></Tooltip>`, which renders `<span><th>...</th></span>`
inside `<tr>`. React emits a `validateDOMNesting` warning in dev and a
hydration mismatch in production. All E2E tests still went green. **A
hydration bug shipped through the safety net.**

Mandamento Akita #6 demands a regression test that would have caught the
bug. Without a page-error gate in E2E, the gate doesn't exist at the
integration level.

---

## What this spec ships

A single shared fixture: `tests/e2e/_fixtures.js`.

It re-exports `test` (and `expect`) from `@playwright/test` with one
addition: every test gets an auto-installed listener for:

- `page.on('pageerror', ...)` — uncaught JS exceptions inside the page.
- `page.on('console', msg => msg.type() === 'error')` — anything logged at
  `console.error` level (including React warnings).

When the test body finishes, the fixture inspects what it captured. Any
message that survives the whitelist filter fails the test with a clear
multi-line error showing exactly which pageerrors / console.errors were
seen.

If the test already failed for another reason (`testInfo.status === 'failed'`
or `'timedOut'`), the fixture stays silent — the original stack trace is
more useful than a secondary error.

### Whitelist

Patterns we ignore (regex, case-insensitive):

| Pattern | Why ignored |
|---------|-------------|
| `ResizeObserver` | Browser-level noise unrelated to app code (`ResizeObserver loop limit exceeded`). |
| `favicon` | 404 noise on `/favicon.ico` in dev. |
| `^[vite]` | Dev-only HMR chatter. |
| `Download the React DevTools` | Dev-only banner. |

Anything else, including `Warning: validateDOMNesting(...)`,
hydration errors, network failures, unhandled promise rejections — fails
the test.

---

## Adoption

Specs migrate by changing **one import line**:

```diff
- import { test, expect } from '@playwright/test';
+ import { test, expect } from './_fixtures.js';
```

Six existing specs converted in this PR:

- `tests/e2e/start-team-select.spec.js`
- `tests/e2e/advance-week-standings.spec.js`
- `tests/e2e/save-reload-roundtrip.spec.js`
- `tests/e2e/sidebar-nav-no-crash.spec.js`
- `tests/e2e/responsive-mobile.spec.js`
- `tests/e2e/tutorial-completable.spec.js`

No production code touched. No new dependencies. No tests are skipped.

---

## Harness (Akita Regra 0)

The fixture itself **is** the harness — it asserts at test-end and fails
loudly. There is no separate harness file because the assertion runs on
every E2E test that imports the fixture, automatically.

For local verification:

```bash
npm run test:e2e | tail -10   # all six specs green
```

To prove the gate works, temporarily revert the StandingsView fix and run
`tests/e2e/advance-week-standings.spec.js`. It should now fail with a
`SPEC-176 page-error gate` message listing the validateDOMNesting warning.

---

## Out of scope

- **Replacing every console call**. The fixture only catches `console.error`,
  not `console.warn` / `console.log` / `console.info`. React's hydration
  errors are emitted at `error` level — that's the bar.
- **Opt-in per-test**. If a future test intentionally provokes a page error
  (e.g. error-boundary smoke), it can either (a) import the raw
  `@playwright/test` `test` symbol or (b) extend the whitelist. We defer
  that until there's a real use case.
- **Network-failure capture**. `page.on('requestfailed')` is intentionally
  not wired in — too noisy for dev (every CDN fallback would fail tests).

---

## Mapping

| Mandamento brutal | Coverage |
|-------------------|----------|
| #5 (PR must have spec + harness) | spec = this file; harness = `_fixtures.js`. |
| Akita #6 (bug → ticket + fix + test) | BUG-084 covers it; this spec ensures *future* DOM-nesting / hydration bugs trip an integration-level gate too. |

Owner: Dudu. Created: 2026-05-12.
