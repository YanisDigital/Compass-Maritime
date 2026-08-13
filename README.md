# Compass Error Calculator

[![Build and deploy](https://github.com/YanisDigital/Compass-Maritime/actions/workflows/deploy.yml/badge.svg)](https://github.com/YanisDigital/Compass-Maritime/actions/workflows/deploy.yml)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue.svg)](LICENSE)

**One HTML file that tells a ship's officer how far wrong the ship's compasses are, by
measuring them against the sun.**

No install, no server, no account, no network. Download one file, double-click it, and it
works — including in the middle of an ocean with no connectivity.

### ➜ [Open the live demo](https://yanisdigital.github.io/Compass-Maritime/)

<!-- Screenshot goes here: ![The Calculate screen](docs/screenshot.png) -->

---

## Why a ship needs this

If you have never been on a bridge, the problem is easy to miss: **a ship cannot trust its
own compasses.**

There are two of them, and they lie in different ways.

- The **gyro compass** is a spinning mass that seeks true north. It is mechanical, so it
  drifts, and the drift changes with latitude, speed and how long it has been running.
- The **magnetic compass** seeks *magnetic* north, which is not true north — the difference
  is called **variation** and is printed on the chart. Worse, the ship is a few thousand
  tonnes of steel, and that steel bends the magnetic field around the compass itself. That
  second error is called **deviation**, and it changes as the ship turns.

On land you could check a compass against a known landmark. Mid-ocean there is nothing to look
at. The only reference that cannot be wrong is the sky.

So this is what watch officers do, at least once every watch:

1. Sight the sun through an **azimuth mirror** mounted on the compass repeater, and read off
   the bearing the compass *thinks* the sun is on.
2. Note the ship's position and the exact time.
3. Work out where the sun **actually** was, from those two facts.
4. The difference between the two is the compass error.

Step 3 is the hard part. It is spherical trigonometry over the sun's position in the sky, and
that position itself has to be computed for the exact second of the sight. Traditionally it is
done with the *Nautical Almanac*, a book of printed azimuth tables and a few minutes of pencil
work — or, increasingly, with a spreadsheet that somebody's chief officer wrote years ago and
everybody copies from ship to ship.

**This app is that pencil work, done in about a second.** The result is copied by hand into the
*Standard Compass Error Book*, the paper record kept on every bridge.

---

## What it does

You give it:

| | |
|---|---|
| Date and time | UTC, to the second |
| Ship's position | latitude and longitude |
| Which body you sighted | Sun, Moon, Venus, Mars, Jupiter, Saturn, or any of the 57 navigational stars and Polaris |
| The bearing you read | off the gyro compass repeater |
| *Optionally* | the ship's heading by gyro and by magnetic compass, and the chart variation |

It gives back:

| | |
|---|---|
| **True bearing** | where the body actually was |
| **Gyro error** | how wrong the gyro compass is, in degrees East or West |
| **True course** | the ship's real heading |
| **Compass error** | how wrong the magnetic compass is in total |
| **Deviation** | the part of that caused by the ship's own steel |

A worked example, taken from the spreadsheet this replaces:

> 4 September 2016 at 04:44:02 UTC, position 35° 09.3′ S, 151° 29.2′ E.
> The sun bears **307.4°** on the gyro repeater. The ship's head is 027° by gyro and 017° by
> magnetic. The chart gives 13° E of variation.
>
> → The sun was truly on **307.6°**. The gyro reads **0.2° East**. True course **027.2°**.
> Compass error **10.2° East**, of which **2.8° West** is deviation.

It also shows its working — GHA, declination, local hour angle, calculated altitude and the
A/B/C quantities from the printed azimuth tables — so that the answer can be checked against
the book by hand rather than taken on trust.

Nothing is stored. The Compass Error Book is paper, and the officer writes the line into it.

---

## Try it

**[Open the live demo](https://yanisdigital.github.io/Compass-Maritime/)** — or download
**[`release/compass-error.html`](release/compass-error.html)** and open it from your own disk.

They are the same 224 kB file. It *is* the application: every script, style and icon is inlined
into the document, so it runs from a USB stick, an email attachment or a shared drive, on a
phone or a desktop, with the network unplugged. Nothing to install, and no administrator rights
needed — bridge computers are often locked down, and there is no internet at sea.

The demo is rebuilt from source on every push, and cannot be published unless the type check
and the whole test suite pass first, so what you are looking at is never stale.

---

## Notes on building it

The interesting parts were not the trigonometry.

**Everything had to fit in one file that opens from `file://`.** Browsers refuse to load
external module scripts out of a local file, so the build inlines the whole bundle into the
HTML and then *fails* if any external `src=` or `href=` survives. That check is the only reason
the promise "double-click it and it works" can be made honestly.

**The mathematics is separated from the interface so that it can be proved.** All astronomy and
all compass arithmetic live in a dependency-light TypeScript package with no DOM access at all;
the interface calls exactly one function and formats what comes back. That boundary is what
makes **351 tests** possible without a browser in sight.

**The source spreadsheet turned out to have three errors.** Porting somebody else's formulas is
not transcription — every one had to be checked:

- One star, *Enif*, was stored with an ecliptic latitude of `222.0999`. A latitude cannot
  exceed 90°; the value should be `22.0999`. As written it put the star on the wrong side of
  the equator.
- The amplitude formula had a quadrant reversed, contradicting the same spreadsheet's own
  azimuth formula two columns away.
- Bearing differences were subtracted directly, so a true bearing of 001° against a compass
  reading 359° came out as 358° West instead of 2° East.

**Correctness is demonstrated rather than asserted.** The suite reproduces the original
spreadsheet's own worked example to the arcminute, and independently cross-checks the ported
star-reduction algorithm against a modern ephemeris — all 58 stars, at four dates spread across
a year — to within two arcminutes. Where this application deliberately disagrees with the
spreadsheet, a test pins the disagreement and explains why.

**The design comes from the instrument it replaces**, not from a UI kit. Brass on ink is the
palette of a ship's binnacle; figures are set in monospace because the almanac's ruled tables
are where they come from and columns of degrees have to align; and there is a red-on-black
night mode because bridges run dark and an officer's night vision takes twenty minutes to
recover. The headline reading is a magnified slice of the compass card showing the true and the
observed bearings together, so that the *direction* of the error is visible and not only its
size.

Built with TypeScript, React, Vite and Vitest. The only runtime dependency doing real work is
[`astronomy-engine`](https://github.com/cosinekitty/astronomy).

---

## Running it yourself

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

The build writes `release/compass-error.html` and nothing else.

```
packages/core     All the astronomy and all the compass arithmetic. No DOM, no framework.
                  This is where the tests live.
apps/web          React + Vite. The user interface, and nothing else.
release           The built HTML file.
scripts           The single-file build.
```

---

## Licence

[MIT](LICENSE).

`astronomy-engine` is MIT-licensed, and its notice travels with the bundled output.

---

## A note on use

This is a tool for checking compasses. It is not a substitute for the *Nautical Almanac* as a
vessel's official source, it is not approved or type-certified by any authority, and the officer
of the watch remains responsible for the entry made in the book.
