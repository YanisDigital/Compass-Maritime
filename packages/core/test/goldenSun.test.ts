import { describe, expect, it } from 'vitest';
import {
  apparentPlace,
  calculateCompassError,
  dayFraction,
  julianCenturies1900,
  sunLowPrecision,
  toDeg,
  toRad,
} from '../src/index.js';
import { WORKBOOK_EXAMPLE, WORKBOOK_SUN_EXPECTED } from './workbook.js';

/** One minute of arc, in degrees — the tolerance the almanac itself is printed to. */
const ARCMIN = 1 / 60;

describe("the workbook's worked Sun example", () => {
  const result = calculateCompassError({
    ...WORKBOOK_EXAMPLE,
    body: { kind: 'sun' },
  });

  it('places the Sun where the workbook places it', () => {
    expect(result.celestial.gha).toBeCloseTo(WORKBOOK_SUN_EXPECTED.gha, 2);
    expect(Math.abs(result.celestial.gha - WORKBOOK_SUN_EXPECTED.gha)).toBeLessThan(ARCMIN);
    expect(Math.abs(result.celestial.dec - WORKBOOK_SUN_EXPECTED.dec)).toBeLessThan(ARCMIN);
    expect(Math.abs(result.celestial.lha - WORKBOOK_SUN_EXPECTED.lha)).toBeLessThan(ARCMIN);
  });

  it('reproduces the A and B quantities of the azimuth tables', () => {
    expect(result.working.A.value).toBeCloseTo(WORKBOOK_SUN_EXPECTED.A, 3);
    expect(result.working.B.value).toBeCloseTo(WORKBOOK_SUN_EXPECTED.B, 3);
    expect(result.working.A.name).toBe('N');
    expect(result.working.B.name).toBe('N');
    expect(result.working.C.name).toBe('N');
  });

  it("matches the workbook's own spherical azimuth", () => {
    expect(result.trueBearing).toBeCloseTo(WORKBOOK_SUN_EXPECTED.trueBearingDirect, 2);
  });

  it('carries C at full precision rather than summing rounded table values', () => {
    const { A, B, C, azimuthByABC } = result.working;

    // Unrounded, A + B falls a thousandth short of the sheet's 0.944.
    expect(C.value).toBeCloseTo(A.value + B.value, 12);
    expect(C.value).toBeLessThan(WORKBOOK_SUN_EXPECTED.C);

    // The ABC azimuth then agrees with the spherical one, as it should — the two are
    // algebraically identical.
    expect(azimuthByABC).toBeCloseTo(result.trueBearing, 6);

    // Rounding A and B to three decimals first, as the printed tables do, reproduces
    // the sheet's published bearing exactly. That is the whole of the 0.02° difference.
    const round3 = (x: number) => Math.round(x * 1000) / 1000;
    const roundedC = round3(round3(A.value) + round3(B.value));
    expect(roundedC).toBeCloseTo(WORKBOOK_SUN_EXPECTED.C, 6);
    const fromTables =
      270 + Math.abs(toDeg(Math.atan(roundedC * Math.cos(toRad(WORKBOOK_EXAMPLE.position.latitude)))));
    expect(fromTables).toBeCloseTo(WORKBOOK_SUN_EXPECTED.trueBearingFromRoundedTables, 3);
  });

  it('fills the Compass Error Book line', () => {
    expect(result.gyroError.degrees).toBeCloseTo(WORKBOOK_SUN_EXPECTED.gyroError.degrees, 1);
    expect(result.gyroError.name).toBe(WORKBOOK_SUN_EXPECTED.gyroError.name);
    expect(result.trueCourse).toBeCloseTo(WORKBOOK_SUN_EXPECTED.trueCourse, 1);
    expect(result.totalError?.degrees).toBeCloseTo(WORKBOOK_SUN_EXPECTED.totalError.degrees, 1);
    expect(result.totalError?.name).toBe(WORKBOOK_SUN_EXPECTED.totalError.name);
    expect(result.deviation?.degrees).toBeCloseTo(WORKBOOK_SUN_EXPECTED.deviation.degrees, 1);
    expect(result.deviation?.name).toBe(WORKBOOK_SUN_EXPECTED.deviation.name);
  });

  it("differs from the sheet's printed line by exactly the table rounding", () => {
    const book = WORKBOOK_SUN_EXPECTED.workbookBookLine;
    const fromTables = calculateCompassError({
      ...WORKBOOK_EXAMPLE,
      body: { kind: 'sun' },
        // Shift the gyro bearing by the rounding artifact to land on the sheet's answer.
      gyroBearing:
        WORKBOOK_EXAMPLE.gyroBearing +
        (WORKBOOK_SUN_EXPECTED.trueBearingDirect - WORKBOOK_SUN_EXPECTED.trueBearingFromRoundedTables),
    });
    expect(fromTables.gyroError.degrees).toBeCloseTo(book.gyroError.degrees, 1);
    expect(fromTables.trueCourse).toBeCloseTo(book.trueCourse, 1);
    expect(fromTables.totalError?.degrees).toBeCloseTo(book.totalError.degrees, 1);
    expect(fromTables.deviation?.degrees).toBeCloseTo(book.deviation.degrees, 1);
  });
});

describe("the workbook's own solar series", () => {
  it('agrees with astronomy-engine to within a minute of arc', () => {
    const { utc, position } = WORKBOOK_EXAMPLE;
    const low = sunLowPrecision(julianCenturies1900(utc), dayFraction(utc));
    const engine = apparentPlace({ kind: 'sun' }, utc, position);

    expect(Math.abs(low.gha - engine.gha)).toBeLessThan(ARCMIN);
    expect(Math.abs(low.dec - engine.dec)).toBeLessThan(ARCMIN);
  });
});
