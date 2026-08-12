# Compass Error Calculator

Works the **gyro compass error** and the **magnetic compass deviation** from an observed
bearing of the Sun, Moon, a planet or a navigational star, and produces the values needed to
fill a line of the ship's *Standard Compass Error Book*.

It ships as **one HTML file**. Copy it anywhere — a USB stick, an email attachment, the
ship's shared drive — and double-click it. No install, no server, no administrator rights,
and no network call at any point.

---

## What it does

Given the ship's position, the UTC time of the observation and the bearing read off the gyro
repeater, it computes:

| | |
|---|---|
| **True bearing** | the body's azimuth, from the position and the time of the sight |
| **Gyro error** | degrees East or West |
| **True course** | ship's head by gyro, corrected for the gyro error |
| **Total (compass) error** | true course against the magnetic compass course |
| **Deviation** | total error less the chart variation |

The working — GHA, declination, LHA, calculated altitude and the A/B/C quantities of the
azimuth tables — is shown alongside, so the result can be checked against the printed tables
by hand.

There is one method and no method chooser. Azimuth is what is actually worked on the bridge:
a bearing off the azimuth mirror, the ship's position and the time. Amplitude was offered at
first and removed — it is only valid with the body on the horizon, so it is available twice a
day, and a chooser between the two invites the wrong one being picked.

Nothing is stored. The Compass Error Book is kept on paper, so the application works the
observation and shows it; the officer writes it into the book.

**Bodies:** Sun, Moon, Venus, Mars, Jupiter, Saturn, the 57 navigational stars and Polaris.

---

## Using it

Open `release/compass-error.html`. That is the whole application.

---

## Working on it

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

```bash
npm run build
```

The build writes `release/compass-error.html`, about 220 kB, with every script, style and
icon inlined. Inline module scripts run from `file://` while external ones do not, which is
why the whole application has to end up inside the single document; the build fails if any
external reference survives.

There is no update mechanism — reissue the file to update it.

---

## How it is put together

```
packages/core     Pure TypeScript. All of the astronomy and all of the compass arithmetic.
                  No DOM, no framework. This is where the tests live.
apps/web          React + Vite. The user interface, and nothing else.
release           The built HTML file, ready to hand to somebody.
scripts           The single-file build.
Refrences         The spreadsheet the formulas were taken from.
```

The interface never does astronomy. It calls one function —
`calculateCompassError(input)` — and formats what comes back. Keeping that in its own
package is what allows the mathematics to be tested on its own, without a browser.

The tests in `packages/core/test/workbook.ts` quote every value from the spreadsheet that
they depend on, so the suite runs without opening it.

> This repository is private. It carries a third-party navigation spreadsheet in
> `Refrences/`; check its provenance before making the repository public.

### Where the numbers come from

- **Sun, Moon and planets** — [`astronomy-engine`](https://github.com/cosinekitty/astronomy),
  computed topocentrically so the Moon's parallax is accounted for.
- **Stars** — a catalog of 57 navigational stars plus Polaris as mean ecliptic coordinates of
  J2000.0 with proper motion, reduced through aberration, precession and nutation. Both the
  catalog and the reduction are ported from the reference workbook and are checked against
  `astronomy-engine` for every star at four dates spread across a year.

### Deliberate departures from the reference workbook

`Refrences/NavCAlExcel.xls` is the spreadsheet this replaces. Three things were changed rather
than reproduced, each covered by a test:

1. **`Enif`'s ecliptic latitude** is `222.0999` in the sheet. That is not an angle a latitude
   can take; the value is `22.0999`. Corrected.
2. **Bearing differences are wrapped to ±180°.** The sheet subtracts directly, so a true
   bearing of 001° against a gyro reading of 359° comes out as 358° W instead of 2° E.
3. **A and B are carried at full precision.** The sheet rounds each to three decimals before
   summing them, as the printed azimuth tables do. On the sheet's own worked example that
   shifts the answer by 0.02°, which is enough to move the reported gyro error from 0.2° E to
   0.3° E. The sheet's unrounded spherical calculation agrees with this application to six
   decimal places.

---

## A note on use

This works the compasses. It is not a substitute for the Nautical Almanac as the ship's
official source, and the officer of the watch remains responsible for the entry made in the
book.
