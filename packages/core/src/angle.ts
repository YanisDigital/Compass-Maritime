import type { EastWest, EastWestAngle, NorthSouth } from './types.js';

export const DEG = Math.PI / 180;

export const toRad = (deg: number): number => deg * DEG;
export const toDeg = (rad: number): number => rad / DEG;

/** Wrap an angle into 0 ≤ x < 360. */
export function norm360(x: number): number {
  const r = x % 360;
  return r < 0 ? r + 360 : r;
}

/** Wrap an angle into −180 < x ≤ 180. Used for every bearing difference. */
export function norm180(x: number): number {
  const r = norm360(x);
  return r > 180 ? r - 360 : r;
}

/** Degrees and decimal minutes — how a navigator writes and reads every angle. */
export interface DegreesMinutes {
  degrees: number;
  minutes: number;
  negative: boolean;
}

/** Exact split. Rounding to a printable number of decimals belongs to the formatters. */
export function toDegreesMinutes(decimal: number): DegreesMinutes {
  const negative = decimal < 0;
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  return { degrees, minutes: (abs - degrees) * 60, negative };
}

export function fromDegreesMinutes(degrees: number, minutes: number, negative = false): number {
  const value = Math.abs(degrees) + Math.abs(minutes) / 60;
  return negative ? -value : value;
}

/**
 * The reference workbook packs `35° 09.3′` into the single number `35.093`.
 * Only the golden tests speak this dialect; the application never does.
 */
export function packedToDegrees(packed: number): number {
  const sign = Math.sign(packed) || 1;
  const abs = Math.abs(packed);
  const whole = Math.trunc(abs);
  return sign * (whole + (abs - whole) / 0.6);
}

export function degreesToPacked(decimal: number): number {
  const sign = Math.sign(decimal) || 1;
  const abs = Math.abs(decimal);
  const whole = Math.trunc(abs);
  return sign * (whole + (abs - whole) * 0.6);
}

/** Split a signed angle into magnitude plus East/West name. East is positive. */
export function eastWest(signed: number): EastWestAngle {
  const name: EastWest = signed < 0 ? 'W' : 'E';
  return { degrees: Math.abs(signed), name, signed };
}

/** Rebuild the signed value from a magnitude and its East/West name. */
export function signEastWest(degrees: number, name: EastWest): number {
  return name === 'W' ? -Math.abs(degrees) : Math.abs(degrees);
}

export const northSouthName = (signed: number): NorthSouth => (signed < 0 ? 'S' : 'N');

/**
 * Degrees and minutes as they are written in the book: fixed-width degrees, minutes to
 * one decimal. Rounding happens here, so `7.99999°` prints as `08° 00.0′` and never as
 * `07° 60.0′`.
 */
export function formatDegreesMinutes(decimal: number, degreeDigits: number): string {
  const dm = toDegreesMinutes(decimal);
  let degrees = dm.degrees;
  let minutes = Math.round(dm.minutes * 10) / 10;
  if (minutes >= 60) {
    minutes = 0;
    degrees += 1;
  }
  return `${String(degrees).padStart(degreeDigits, '0')}° ${minutes.toFixed(1).padStart(4, '0')}′`;
}

export const formatLatitude = (lat: number): string =>
  `${formatDegreesMinutes(Math.abs(lat), 2)} ${lat < 0 ? 'S' : 'N'}`;

export const formatLongitude = (lon: number): string =>
  `${formatDegreesMinutes(Math.abs(lon), 3)} ${lon < 0 ? 'W' : 'E'}`;

/** Declination, written the way the almanac writes it. */
export const formatDeclination = (dec: number): string =>
  `${dec < 0 ? 'S' : 'N'} ${formatDegreesMinutes(Math.abs(dec), 2)}`;

/** Hour angles are always positive and always carry degrees and minutes. */
export const formatHourAngle = (deg: number): string => formatDegreesMinutes(norm360(deg), 3);

/** Bearings and courses are three-figure notation to one decimal. */
export const formatBearing = (deg: number): string => `${norm360(deg).toFixed(1).padStart(5, '0')}°`;

export const formatEastWest = (angle: EastWestAngle): string =>
  `${angle.degrees.toFixed(1)}° ${angle.name}`;
