# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A gyro/magnetic compass error calculator for navigational officers. Given ship's position,
UTC time, and an observed bearing of the Sun, Moon, a planet, or a navigational star, it
computes true bearing (by azimuth or amplitude), gyro error, true course, total compass
error, and deviation — the values needed to fill a line of the ship's Standard Compass Error
Book. Nothing is stored by the app; the officer transcribes the result onto paper.

It ships as **one self-contained HTML file** (`release/compass-error.html`, ~220 kB). No
server, no install, no network call — it runs from `file://`.

## Commands

```bash
npm install              # once, from repo root (npm workspaces: packages/* + apps/*)
npm run dev               # Vite dev server for apps/web, at http://localhost:5173
npm test                  # runs test in every workspace (packages/core + apps/web)
npm run typecheck         # tsc --noEmit in every workspace
npm run build              # writes release/compass-error.html (the only build output)
```

Run a single test file or pattern with Vitest directly, from the relevant workspace:

```bash
cd packages/core && npx vitest run test/goldenSun.test.ts
cd packages/core && npx vitest run -t "amplitude"
cd apps/web && npx vitest run src/form.test.ts
```

`npm run build` is not `vite build` — it's `node scripts/build-single-file.mjs`, which runs
Vite (writing `apps/web/dist-single/`) and then inlines every script, stylesheet, and icon
into one HTML document, copied to `release/compass-error.html`. The script fails loudly if
any external `src=`/`href=` survives inlining — that check is what guarantees the file still
works from `file://`. There is no separate PWA/installable build; that path was removed.

## Architecture

**`packages/core`** — all astronomy and all compass arithmetic, pure TypeScript, zero DOM
dependency (only external dependency: `astronomy-engine`). This is where correctness is
proved; `apps/web` contains no calculation logic of its own, only formatting and forms.

- `angle.ts` — degrees/minutes conversion, `norm360`/`norm180` wrapping, East/West sign
  convention (`eastWest()`/`signEastWest()`: **East is positive**), and the Compass-Error-Book
  formatting functions (`formatBearing`, `formatDeclination`, `formatHourAngle`, etc.).
- `time.ts` — Julian date/century helpers, plus `fromExcelSerial`/`toExcelSerial` used only
  by the golden tests to reproduce the reference workbook's date encoding.
- `catalog/stars.ts` — 57 navigational stars + Polaris, as mean ecliptic coordinates (λ, β)
  at J2000.0 with proper-motion rates, transcribed from the reference workbook.
- `ephemeris/starReduction.ts` — ports the workbook's own star-reduction algorithm (proper
  motion → aberration → precession → nutation → RA/Dec/SHA). Used in production for stars.
- `ephemeris/sunLowPrecision.ts` — ports the workbook's low-precision solar series. **Not
  used in production** — kept only so tests can prove it agrees with `astronomy-engine`.
- `ephemeris/index.ts` — `apparentPlace(body, utc, position)` is the one production entry
  point for celestial positions. Stars go through `starReduction.ts`; Sun/Moon/planets go
  through `astronomy-engine` (topocentric, so Moon parallax is included).
- `azimuth.ts` / `amplitude.ts` — the two bearing methods. `azimuth.ts` also computes the
  A/B/C values from the printed azimuth tables (`abcWorking`) as a cross-check display, kept
  at full precision (see "Deliberate departures" below).
- `compassError.ts` — `calculateCompassError(input) → CompassErrorResult` is **the single
  function the UI calls**. Wires ephemeris → azimuth/amplitude → gyro error → true course →
  total error → deviation, wrapping every bearing difference to ±180° (`norm180`).
- `index.ts` — the package's public surface; everything else is an implementation detail
  reached only through here.

**`apps/web`** — React + Vite UI, two screens (Calculate, Settings) driven entirely by
`calculateCompassError`. `form.ts` parses/validates raw text-field state into the core's
`CompassErrorInput`; `screens/Calculate.tsx` renders the result and a collapsible "working"
panel (GHA/Dec/LHA/altitude/A-B-C) so an officer can check the answer against printed tables
by hand.

**`Refrences/NavCAlExcel.xls`** — the Excel workbook this application replaces; the source
of every formula ported above. `packages/core/test/workbook.ts` hardcodes every value the
golden tests need from it, so the suite runs without opening the file.

### Deliberate departures from the reference workbook

Each is covered by a test — see `packages/core/test/` for the specifics:

1. **`Enif`'s ecliptic latitude** was `222.0999` in the sheet (not a valid latitude); corrected
   to `22.0999` in `catalog/stars.ts`.
2. **Amplitude's NE quadrant** — the sheet's `90 + amplitude` is backwards for northerly
   declination; corrected to `90 − amplitude` in `amplitude.ts` (matches the sheet's own ABC
   formula for the same quadrant).
3. **Bearing differences wrap to ±180°** (`norm180`), where the sheet subtracts directly —
   avoids e.g. a true 001°/gyro 359° difference reading as 358° W instead of 2° E.
4. **A and B are carried at full floating-point precision** in `abcWorking`, rather than
   rounded to three decimals before summing (as the printed tables and the sheet do). This
   is a ~0.02° effect on the worked example; the unrounded result agrees with the sheet's own
   unrounded spherical formula to six decimal places.

### Sign/unit conventions to preserve

- East is positive throughout the core (`EastWestAngle.signed`); `North` is positive for
  latitude/declination. Get this backwards and every downstream error flips sign.
- Angles cross UI/core boundaries as **signed decimal degrees**, not the workbook's packed
  `DD.MMm` form (`packedToDegrees`/`degreesToPacked` exist only for the golden tests).
- `calculateCompassError`'s later fields (`trueCourse`, `totalError`, `deviation`) are
  progressively optional — each is only computed if the corresponding course/variation input
  was supplied, so the function also serves an officer who only wants the gyro error.
