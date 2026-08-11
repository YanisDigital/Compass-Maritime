import * as Astronomy from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import { DEG, julianCenturiesJ2000, norm180, norm360, reduceStar, STAR_CATALOG, toDeg } from '../src/index.js';
import type { StarCatalogEntry } from '../src/index.js';

/**
 * The workbook's star reduction is an approximation: linearised precession, a two-term
 * nutation and a first-order aberration. This checks it against astronomy-engine's full
 * treatment, star by star, across a span of dates.
 *
 * Both sides start from the same catalog entry and apply proper motion identically, so
 * what is measured here is the quality of the precession/nutation/aberration chain and
 * nothing else. It cannot detect a bad catalog row: feed both sides the same wrong
 * ecliptic latitude and they agree on the same wrong star. Catalog integrity is covered
 * separately — by the range check in `goldenStar.test.ts` and by the Enif case below.
 */

/** Obliquity of the ecliptic at J2000.0, degrees (IAU 2006). */
const OBLIQUITY_J2000 = 23.4392794;

/** Mean place of date, expressed in equatorial coordinates referred to J2000's equinox. */
function meanEquatorialJ2000(star: StarCatalogEntry, T: number): { ra: number; dec: number } {
  const lambda = (star.lambda0 + T * star.dLambda) * DEG;
  const beta = (star.beta0 + T * star.dBeta) * DEG;
  const eps = OBLIQUITY_J2000 * DEG;

  const x = Math.cos(beta) * Math.cos(lambda);
  const y = Math.cos(eps) * Math.cos(beta) * Math.sin(lambda) - Math.sin(eps) * Math.sin(beta);
  const z = Math.sin(eps) * Math.cos(beta) * Math.sin(lambda) + Math.cos(eps) * Math.sin(beta);

  return { ra: norm360(toDeg(Math.atan2(y, x))), dec: toDeg(Math.asin(z)) };
}

/** Angular separation between two equatorial positions, in minutes of arc. */
function separationArcmin(a: { ra: number; dec: number }, b: { ra: number; dec: number }): number {
  const cosSep =
    Math.sin(a.dec * DEG) * Math.sin(b.dec * DEG) +
    Math.cos(a.dec * DEG) * Math.cos(b.dec * DEG) * Math.cos((a.ra - b.ra) * DEG);
  return toDeg(Math.acos(Math.max(-1, Math.min(1, cosSep)))) * 60;
}

describe("the workbook's Enif entry", () => {
  const enif = STAR_CATALOG.find((s) => s.name === 'Enif')!;

  /**
   * ε Pegasi at J2000.0: right ascension 21h 44m 11s, declination +09° 52′.
   * Reducing the corrected catalog row has to land there; reducing the sheet's row
   * as written cannot, because 222.0999 is not an angle a latitude can take.
   */
  const ENIF_J2000 = { ra: 326.046, dec: 9.875 };

  it('lands on ε Pegasi once the ecliptic latitude is corrected', () => {
    expect(enif.beta0).toBeCloseTo(22.0999, 4);
    const place = meanEquatorialJ2000(enif, 0);
    expect(separationArcmin(place, ENIF_J2000)).toBeLessThan(2);
  });

  it('lands nowhere near it with the value the sheet carries', () => {
    const asWritten = { ...enif, beta0: 222.0999 };
    const place = meanEquatorialJ2000(asWritten, 0);
    expect(separationArcmin(place, ENIF_J2000)).toBeGreaterThan(60 * 60);

    // The declination comes out the wrong side of the equator, so the error would be
    // obvious to the officer as well — but only after the sight had been worked.
    expect(reduceStar(asWritten, 0).dec).toBeLessThan(0);
    expect(reduceStar(enif, 0).dec).toBeGreaterThan(0);
  });
});

const DATES = [
  new Date('2000-01-01T12:00:00Z'),
  new Date('2016-09-04T04:44:02Z'),
  new Date('2026-03-21T18:00:00Z'),
  new Date('2035-11-11T06:30:00Z'),
];

/** The workbook's approximations are good to about this much; the almanac prints to 0.1′. */
const SEPARATION_LIMIT_ARCMIN = 2;

describe('the ported star reduction against astronomy-engine', () => {
  for (const date of DATES) {
    describe(date.toISOString().slice(0, 10), () => {
      const T = julianCenturiesJ2000(date);
      const observer = new Astronomy.Observer(0, 0, 0);

      for (const star of STAR_CATALOG) {
        it(star.name, () => {
          const mean = meanEquatorialJ2000(star, T);
          Astronomy.DefineStar(Astronomy.Body.Star1, mean.ra / 15, mean.dec, 1000);
          const reference = Astronomy.Equator(Astronomy.Body.Star1, date, observer, true, true);

          const ours = reduceStar(star, T);
          const separation = separationArcmin(ours, {
            ra: norm360(reference.ra * 15),
            dec: reference.dec,
          });

          expect(separation).toBeLessThan(SEPARATION_LIMIT_ARCMIN);
          expect(Math.abs(ours.dec - reference.dec) * 60).toBeLessThan(SEPARATION_LIMIT_ARCMIN);

          // Sidereal hour angle is the quantity the almanac tabulates. Near the pole a
          // given separation spans a large hour angle, so scale the limit by cos(dec).
          const shaReference = norm360(-reference.ra * 15);
          const shaLimit = SEPARATION_LIMIT_ARCMIN / Math.max(0.02, Math.cos(reference.dec * DEG));
          expect(Math.abs(norm180(ours.sha - shaReference)) * 60).toBeLessThan(shaLimit);
        });
      }
    });
  }
});
