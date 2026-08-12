import { describe, expect, it } from 'vitest';
import { calculateCompassError, findStar, julianCenturiesJ2000, reduceStar } from '../src/index.js';
import { WORKBOOK_EXAMPLE } from './workbook.js';

const baseInput = {
  ...WORKBOOK_EXAMPLE,
  body: { kind: 'sun' } as const,
};

describe('the compass error chain', () => {
  it('reads an error across north as a small easterly one, not a large westerly one', () => {
    // A true bearing of 001° against a gyro reading 359° is 2° E, never 358° W.
    const result = calculateCompassError({ ...baseInput, gyroBearing: 0 });
    const acrossNorth = calculateCompassError({
      ...baseInput,
      gyroBearing: result.trueBearing < 180 ? result.trueBearing + 358 : result.trueBearing - 358,
    });
    expect(acrossNorth.gyroError.degrees).toBeCloseTo(2, 6);
  });

  it('stops after the gyro error when no courses are supplied', () => {
    const result = calculateCompassError({
      utc: baseInput.utc,
      position: baseInput.position,
      body: baseInput.body,
      gyroBearing: baseInput.gyroBearing,
    });
    expect(result.gyroError).toBeDefined();
    expect(result.trueCourse).toBeUndefined();
    expect(result.totalError).toBeUndefined();
    expect(result.deviation).toBeUndefined();
  });

  it('stops after the total error when no variation is supplied', () => {
    const { variation: _variation, ...withoutVariation } = baseInput;
    const result = calculateCompassError(withoutVariation);
    expect(result.totalError).toBeDefined();
    expect(result.deviation).toBeUndefined();
  });

  it('subtracts variation from total error with the signs the right way round', () => {
    // Total error 5° E against variation 3° E leaves 2° E of deviation.
    const result = calculateCompassError({ ...baseInput, gyroCourse: 90, magneticCourse: 90 });
    const totalError = result.totalError!.signed;
    const easterly = calculateCompassError({
      ...baseInput,
      gyroCourse: 90,
      magneticCourse: 90 - (5 - totalError),
      variation: 3,
    });
    expect(easterly.totalError!.degrees).toBeCloseTo(5, 6);
    expect(easterly.deviation!.degrees).toBeCloseTo(2, 6);
    expect(easterly.deviation!.name).toBe('E');

    // The same total error against 8° W of variation leaves 13° E of deviation.
    const westerly = calculateCompassError({
      ...baseInput,
      gyroCourse: 90,
      magneticCourse: 90 - (5 - totalError),
      variation: -8,
    });
    expect(westerly.deviation!.degrees).toBeCloseTo(13, 6);
    expect(westerly.deviation!.name).toBe('E');
  });

  it('warns when the body is too high for a dependable azimuth', () => {
    // Sirius passes near the zenith for an observer at its declination.
    const star = findStar('Sirius')!;
    const utc = new Date('2026-02-10T00:00:00Z');
    const { dec } = reduceStar(star, julianCenturiesJ2000(utc));

    // Put the ship under the star and find the longitude that puts it on the meridian.
    const meridian = calculateCompassError({
      utc,
      position: { latitude: dec, longitude: 0 },
      body: { kind: 'star', name: 'Sirius' },
      gyroBearing: 0,
    });
    const longitude = -meridian.celestial.gha;

    const overhead = calculateCompassError({
      utc,
      position: { latitude: dec, longitude },
      body: { kind: 'star', name: 'Sirius' },
      gyroBearing: 0,
    });
    expect(overhead.celestial.altitude).toBeGreaterThan(85);
    expect(overhead.warnings.join(' ')).toMatch(/change rapidly/);
  });

  it('warns when the body is below the horizon at that place and time', () => {
    const result = calculateCompassError({
      ...baseInput,
      // Half a day on puts the Sun the other side of the Earth from this position.
      utc: new Date(baseInput.utc.getTime() + 12 * 3600 * 1000),
    });
    expect(result.celestial.altitude).toBeLessThan(-1);
    expect(result.warnings.join(' ')).toMatch(/below the horizon/);
  });

  it('reports no warnings for an ordinary low-altitude azimuth', () => {
    expect(calculateCompassError(baseInput).warnings).toEqual([]);
  });

  it('rejects a star it does not carry', () => {
    expect(() =>
      calculateCompassError({ ...baseInput, body: { kind: 'star', name: 'Betelgeux' } }),
    ).toThrow(/Unknown star/);
  });
});
