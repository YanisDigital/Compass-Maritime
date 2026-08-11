import { describe, expect, it } from 'vitest';
import {
  degreesToPacked,
  eastWest,
  formatBearing,
  formatDeclination,
  formatDegreesMinutes,
  formatHourAngle,
  formatLatitude,
  formatLongitude,
  fromDegreesMinutes,
  fromExcelSerial,
  norm180,
  norm360,
  packedToDegrees,
  signEastWest,
  toDegreesMinutes,
  toExcelSerial,
} from '../src/index.js';

describe('angle wrapping', () => {
  it('brings any angle into 0–360', () => {
    expect(norm360(370)).toBeCloseTo(10, 12);
    expect(norm360(-10)).toBeCloseTo(350, 12);
    expect(norm360(-730)).toBeCloseTo(350, 12);
    expect(norm360(0)).toBe(0);
  });

  it('brings any difference into ±180', () => {
    expect(norm180(190)).toBeCloseTo(-170, 12);
    expect(norm180(-190)).toBeCloseTo(170, 12);
    expect(norm180(180)).toBeCloseTo(180, 12);
    expect(norm180(-180)).toBeCloseTo(180, 12);
  });
});

describe('degrees and decimal minutes', () => {
  it('round-trips exactly', () => {
    for (const value of [0, 7.0266, -35.155, 151.4867, 89.9999]) {
      const dm = toDegreesMinutes(value);
      expect(fromDegreesMinutes(dm.degrees, dm.minutes, dm.negative)).toBeCloseTo(value, 10);
    }
  });

  it('never prints sixty minutes', () => {
    expect(formatDegreesMinutes(7.999999, 2)).toBe('08° 00.0′');
    expect(formatLatitude(-89.99999)).toBe('90° 00.0′ S');
  });
});

describe("the workbook's packed DD.MMm form", () => {
  it('unpacks the way the sheet does', () => {
    expect(packedToDegrees(35.093)).toBeCloseTo(35 + 9.3 / 60, 10);
    expect(packedToDegrees(151.292)).toBeCloseTo(151 + 29.2 / 60, 10);
    expect(packedToDegrees(-35.093)).toBeCloseTo(-(35 + 9.3 / 60), 10);
  });

  it('round-trips', () => {
    for (const packed of [35.093, 151.292, 251.16, 7.0159, -42.4521]) {
      expect(degreesToPacked(packedToDegrees(packed))).toBeCloseTo(packed, 10);
    }
  });
});

describe('East and West angles', () => {
  it('treats East as positive', () => {
    expect(eastWest(2.7)).toEqual({ degrees: 2.7, name: 'E', signed: 2.7 });
    expect(eastWest(-2.7)).toEqual({ degrees: 2.7, name: 'W', signed: -2.7 });
    expect(eastWest(0).name).toBe('E');
  });

  it('rebuilds the signed value from the name', () => {
    expect(signEastWest(2.7, 'W')).toBe(-2.7);
    expect(signEastWest(2.7, 'E')).toBe(2.7);
  });
});

describe('Excel serial dates', () => {
  it('round-trips the workbook example', () => {
    // Serial 42617 is the 248th day of 2016, a leap year: 4 September.
    const utc = fromExcelSerial(42617, 0.19724537037037);
    expect(utc.toISOString()).toBe('2016-09-04T04:44:02.000Z');
    expect(toExcelSerial(utc)).toBeCloseTo(42617.19724537037, 8);
  });
});

describe('formatting for the Compass Error Book', () => {
  it('writes positions the way a navigator writes them', () => {
    expect(formatLatitude(-35.155)).toBe('35° 09.3′ S');
    expect(formatLongitude(151.4866667)).toBe('151° 29.2′ E');
    expect(formatLongitude(-1.5)).toBe('001° 30.0′ W');
  });

  it('writes declination, hour angle and bearings in the almanac forms', () => {
    expect(formatDeclination(7.0266)).toBe('N 07° 01.6′');
    expect(formatDeclination(-7.0266)).toBe('S 07° 01.6′');
    expect(formatHourAngle(251.2667)).toBe('251° 16.0′');
    expect(formatHourAngle(42.7533)).toBe('042° 45.2′');
    expect(formatBearing(7.6)).toBe('007.6°');
    expect(formatBearing(307.64)).toBe('307.6°');
  });
});
