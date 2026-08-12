import { describe, expect, it } from 'vitest';
import {
  apparentPlace,
  calculateCompassError,
  dayFraction,
  findStar,
  ghaAries,
  ghaAriesLowPrecision,
  julianCenturiesJ2000,
  localHourAngle,
  reduceStar,
  STAR_CATALOG,
} from '../src/index.js';
import { WORKBOOK_EXAMPLE, WORKBOOK_STAR_EXPECTED } from './workbook.js';

const ARCMIN = 1 / 60;

describe("the workbook's worked star example — Altair", () => {
  const { utc, position } = WORKBOOK_EXAMPLE;

  it("reproduces the workbook's own GHA of Aries series", () => {
    const low = ghaAriesLowPrecision(julianCenturiesJ2000(utc), dayFraction(utc));
    expect(Math.abs(low - WORKBOOK_STAR_EXPECTED.ghaAries)).toBeLessThan(ARCMIN);
  });

  it('agrees with apparent sidereal time from astronomy-engine', () => {
    expect(Math.abs(ghaAries(utc) - WORKBOOK_STAR_EXPECTED.ghaAries)).toBeLessThan(ARCMIN);
  });

  it("places Altair where the workbook places it", () => {
    const star = findStar(WORKBOOK_STAR_EXPECTED.star);
    expect(star).toBeDefined();
    const place = reduceStar(star!, julianCenturiesJ2000(utc));
    expect(Math.abs(place.sha - WORKBOOK_STAR_EXPECTED.sha)).toBeLessThan(ARCMIN);
    expect(Math.abs(place.dec - WORKBOOK_STAR_EXPECTED.dec)).toBeLessThan(ARCMIN);
  });

  it('produces the same local hour angle and azimuth', () => {
    const place = apparentPlace({ kind: 'star', name: 'Altair' }, utc, position);
    const lha = localHourAngle(place.gha, position.longitude);
    expect(Math.abs(lha - WORKBOOK_STAR_EXPECTED.lhaStar)).toBeLessThan(2 * ARCMIN);

    const result = calculateCompassError({
      ...WORKBOOK_EXAMPLE,
      body: { kind: 'star', name: 'Altair' },
    });
    expect(result.trueBearing).toBeCloseTo(WORKBOOK_STAR_EXPECTED.azimuth, 2);
    expect(result.celestial.sha).toBeCloseTo(WORKBOOK_STAR_EXPECTED.sha, 3);
    expect(result.celestial.ghaAries).toBeDefined();
  });
});

describe('the star catalog', () => {
  it('holds all 57 navigational stars plus Polaris', () => {
    expect(STAR_CATALOG).toHaveLength(58);
    expect(new Set(STAR_CATALOG.map((s) => s.name)).size).toBe(58);
    expect(new Set(STAR_CATALOG.map((s) => s.code)).size).toBe(58);
  });

  it("finds stars by the workbook's spellings as well as the modern ones", () => {
    expect(findStar('Betelguese')?.name).toBe('Betelgeuse');
    expect(findStar('K Aust')?.name).toBe('Kaus Australis');
    expect(findStar('Rigil Kent')?.name).toBe('Rigil Kentaurus');
    expect(findStar('Zebenelgenubi')?.name).toBe('Zubenelgenubi');
    expect(findStar('  vega ')?.name).toBe('Vega');
    expect(findStar('Betelgeuse')?.name).toBe('Betelgeuse');
  });

  it('holds every ecliptic latitude within ±90°', () => {
    for (const star of STAR_CATALOG) {
      expect(Math.abs(star.beta0), `${star.name} β₀`).toBeLessThanOrEqual(90);
      expect(star.lambda0, `${star.name} λ₀`).toBeGreaterThanOrEqual(0);
      expect(star.lambda0, `${star.name} λ₀`).toBeLessThan(360);
    }
  });
});
