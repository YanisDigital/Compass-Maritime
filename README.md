# Compass Error Calculator

Works the **gyro compass error** and the **magnetic compass deviation** from an observed
bearing of the Sun, Moon, a planet or a navigational star, and produces the values needed to
fill a line of the ship's *Standard Compass Error Book*.

Runs on a bridge PC and on a phone, and works **entirely offline** — there is no server, no
account and no network call at any point.

---

## What it does

Given the ship's position, the UTC time of the observation and the bearing read off the gyro
repeater, it computes:

| | |
|---|---|
| **True bearing** | by azimuth at any altitude, or by amplitude with the body on the horizon |
| **Gyro error** | degrees East or West |
| **True course** | ship's head by gyro, corrected for the gyro error |
| **Total (compass) error** | true course against the magnetic compass course |
| **Deviation** | total error less the chart variation |

The working — GHA, declination, LHA, calculated altitude and the A/B/C quantities of the
azimuth tables — is shown alongside, so the result can be checked against the printed tables
by hand.

Every observation can be saved to a log held on the device and exported as CSV or printed in
Compass Error Book column order.

**Bodies:** Sun, Moon, Venus, Mars, Jupiter, Saturn, the 57 navigational stars and Polaris.

---

## Getting started

```bash
npm install
```

```bash
npm run dev
```

Then open <http://localhost:5173>.

```bash
npm test
```

---

## How it is put together

```
packages/core     Pure TypeScript. All of the astronomy and all of the compass arithmetic.
                  No DOM, no framework. This is where the tests live.
apps/web          React + Vite progressive web app — the only user interface there is.
src-tauri         Windows desktop shell. Wraps the built web bundle in a native window.
capacitor.config  Android and iOS shells. Wrap the same bundle.
release           The single-file build, ready to hand to somebody.
scripts           Icon generation and the single-file build.
```

`Refrences/NavCAlExcel.xls` — the spreadsheet the formulas were taken from — is kept out of
this repository and held locally. The tests in `packages/core/test/workbook.ts` quote every
value from it that they depend on, so the suite runs without it.

The interface never does astronomy. It calls one function —
`calculateCompassError(input)` — and formats what comes back. Every delivery target runs the
same core, so there is one implementation of the mathematics and one set of tests over it.

### Where the numbers come from

- **Sun, Moon and planets** — [`astronomy-engine`](https://github.com/cosinekitty/astronomy),
  computed topocentrically so the Moon's parallax is accounted for.
- **Stars** — a catalog of 57 navigational stars plus Polaris as mean ecliptic coordinates of
  J2000.0 with proper motion, reduced through aberration, precession and nutation. Both the
  catalog and the reduction are ported from the reference workbook and are checked against
  `astronomy-engine` for every star at four dates spread across a year.

### Deliberate departures from the reference workbook

`Refrences/NavCAlExcel.xls` is the spreadsheet this replaces. Four things were changed rather
than reproduced, each covered by a test:

1. **`Enif`'s ecliptic latitude** is `222.0999` in the sheet. That is not an angle a latitude
   can take; the value is `22.0999`. Corrected.
2. **The amplitude formula** maps the NE quadrant to `90 + amplitude`. A body with northerly
   declination rises *north* of East, so it is `90 − amplitude` — which is what the sheet's own
   ABC azimuth formula uses for the same quadrant. Corrected.
3. **Bearing differences are wrapped to ±180°.** The sheet subtracts directly, so a true
   bearing of 001° against a gyro reading of 359° comes out as 358° W instead of 2° E.
4. **A and B are carried at full precision.** The sheet rounds each to three decimals before
   summing them, as the printed azimuth tables do. On the sheet's own worked example that
   shifts the answer by 0.02°, which is enough to move the reported gyro error from 0.2° E to
   0.3° E. The sheet's unrounded spherical calculation agrees with this application to six
   decimal places.

---

## Building

### Single file — the simplest thing to hand to somebody

```bash
npm run build:single
```

Produces `release/compass-error.html`, about 230 kB, with every script, style and icon
inlined. Copy it anywhere — a USB stick, an email attachment, the ship's shared
drive — and double-click it. No install, no server, no Node, no administrator rights.

Verified in Chromium opened straight from `file://`: the calculation, the saved log and the
CSV export all work, and the log survives a reload. Firefox and Safari apply their own rules
to local files and have not been tested; if the log does not stick there, the calculations
still do.

There is no service worker in this build and no update mechanism — reissue the file to
update it.

### Progressive web app

```bash
npm run build
```

The bundle lands in `apps/web/dist`, precached by a service worker. Served over HTTPS it
installs to the home screen on Android and iOS and to the desktop on Windows — no app store
and no administrator rights needed, which matters on a locked-down bridge PC.

### Windows desktop

Needs [Rust](https://rustup.rs/) and the Visual Studio Build Tools with the MSVC and Windows
SDK components. Then:

```bash
npm run tauri:build
```

Produces an `.msi` and an NSIS installer under `src-tauri/target/release/bundle`.

### Android

Needs Android Studio with the SDK. One-time:

```bash
npm run android:add
```

Thereafter:

```bash
npm run android:sync && npm run android:open
```

### iOS

Needs a Mac with Xcode. `npm run ios:add`, then `npm run ios:sync`.

---

## Not in this version

Deviation card per ship, celestial sight reduction (intercept and position lines), and the
Star Finder module. The star catalog and reduction the Star Finder needs are already in
`packages/core`.

---

## A note on use

This works the compasses. It is not a substitute for the Nautical Almanac as the ship's
official source, and the officer of the watch remains responsible for the entry made in the
book.
