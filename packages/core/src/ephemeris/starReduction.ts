import { DEG, norm360, toDeg } from '../angle.js';
import type { StarCatalogEntry } from '../catalog/stars.js';

/**
 * Apparent place of a fixed star, reduced from mean ecliptic coordinates of J2000.0.
 *
 * This is a direct port of `SUN & STAR CALC.` columns Q→AX of the reference workbook:
 * proper motion, annual aberration, precession, nutation, then a rotation into
 * apparent equatorial coordinates. Cell references from the sheet are kept in the
 * comments so the two can be compared line by line.
 */
export interface StarPlace {
  /** Apparent right ascension, degrees, 0–360. */
  ra: number;
  /** Apparent declination, degrees, North positive. */
  dec: number;
  /** Sidereal hour angle, degrees, 0–360. */
  sha: number;
}

export function reduceStar(star: StarCatalogEntry, centuriesJ2000: number): StarPlace {
  const T = centuriesJ2000;

  // W, X — mean place brought forward by proper motion.
  const lambda = star.lambda0 + T * star.dLambda;
  const beta = star.beta0 + T * star.dBeta;

  // Y — the Sun's mean longitude, which the aberration terms are referred to.
  const sunLongitude = 36280.46 + 36000.77 * T;

  // AB, AC — annual aberration.
  const lambdaAb =
    lambda - (0.0057 * Math.cos((lambda - sunLongitude) * DEG)) / Math.cos(beta * DEG);
  const betaAb = beta + 0.0057 * Math.sin((lambda - sunLongitude) * DEG) * Math.sin(beta * DEG);

  // AD, AE, AF — precession in longitude, in obliquity, and the reference longitude.
  const precLongitude = 1.39697 * T + 0.000309 * T * T;
  const precObliquity = 0.0131 * T + 0.00001 * T * T;
  const precReference = 5.1236 + 0.2416 * T;

  // AG, AH — precessed ecliptic coordinates.
  const betaPrec = betaAb + precObliquity * Math.sin((lambdaAb + precReference) * DEG);
  const lambdaPrec =
    lambdaAb +
    precLongitude -
    precObliquity * Math.cos((lambdaAb + precReference) * DEG) * Math.tan(betaPrec * DEG);

  // AI–AM — nutation: longitude of the ascending node of the Moon's orbit,
  // then the true obliquity and the nutation in longitude.
  const node = norm360(36125.045 - 1934.136 * T);
  const meanObliquity = 23.4393 - 0.013 * T;
  const trueObliquity = meanObliquity + 0.0026 * Math.cos(node * DEG);
  const lambdaTrue = lambdaPrec - 0.0048 * Math.sin(node * DEG);

  // AN, AO, AP — rotate the ecliptic place onto the equator.
  const x = Math.cos(betaPrec * DEG) * Math.cos(lambdaTrue * DEG);
  const y =
    Math.cos(trueObliquity * DEG) * Math.cos(betaPrec * DEG) * Math.sin(lambdaTrue * DEG) -
    Math.sin(trueObliquity * DEG) * Math.sin(betaPrec * DEG);
  const z =
    Math.sin(trueObliquity * DEG) * Math.cos(betaPrec * DEG) * Math.sin(lambdaTrue * DEG) +
    Math.cos(trueObliquity * DEG) * Math.sin(betaPrec * DEG);

  // AQ–AS. Excel's ATAN2 takes (x, y); JavaScript's takes (y, x).
  const ra = norm360(toDeg(Math.atan2(y, x)));

  // AT — declination.
  const dec = toDeg(Math.asin(z));

  // AV–AW — sidereal hour angle, with the equation-of-the-equinoxes term.
  const sha = norm360(0.0048 * Math.sin(node * DEG) * Math.cos(trueObliquity * DEG) - ra);

  return { ra, dec, sha };
}

/**
 * Greenwich hour angle of Aries by the workbook's own series (`N75`/`N76`).
 *
 * Production code uses apparent sidereal time from `astronomy-engine` instead; this
 * exists so the golden tests can reproduce the workbook's numbers exactly.
 */
export function ghaAriesLowPrecision(centuriesJ2000: number, dayFraction: number): number {
  const T = centuriesJ2000;
  return norm360(100.464 + 36000.77 * T + 0.000388 * T * T + 15 * dayFraction * 24);
}
