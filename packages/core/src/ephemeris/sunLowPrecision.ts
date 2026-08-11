import { DEG, norm360, toDeg } from '../angle.js';

/**
 * The reference workbook's low-precision solar series (`SUN & STAR CALC.` rows 77–94).
 *
 * The application does not use this — `astronomy-engine` supplies the Sun in production.
 * It is kept so the golden tests can prove the two agree, which is what lets us say the
 * new application reproduces the spreadsheet the user already trusts.
 *
 * One departure from the sheet: cell `C84`'s final term reads `76*COS((270+2*J)/rad)`
 * where every sibling term multiplies by `rad`. That is a typing slip; it is corrected
 * here. The correction moves the result by well under 0.001′.
 */
export interface SunPlace {
  /** Greenwich hour angle, degrees, 0–360. */
  gha: number;
  /** Declination, degrees, North positive. */
  dec: number;
  /** Semi-diameter, degrees. */
  semiDiameter: number;
}

export function sunLowPrecision(centuries1900: number, dayFraction: number): SunPlace {
  const U = centuries1900;

  // Mean anomalies of the Sun and the perturbing planets.
  const N = 358.475 + 35999.05 * U;
  const V = 63 + 22518 * U;
  const Q = 332 + 33718 * U;
  const J = 222 + 32964 * U;
  const K = 101 + 1934 * U;
  const R = 36000.76892 * U;

  // Mean longitude with the equation of the centre.
  let L =
    279.69019 +
    R +
    (1.91945 - 0.00479 * U) * Math.sin(N * DEG) +
    0.02 * Math.sin(2 * N * DEG) +
    0.00029 * Math.sin(3 * N * DEG) +
    0.00179 * Math.cos((261 + 445267 * U) * DEG);

  // Planetary perturbations from Venus, Mars and Jupiter.
  L +=
    0.00001 *
    (134 * Math.cos((90 + V) * DEG) +
      154 * Math.cos((90 + 2 * V) * DEG) +
      69 * Math.cos((258 + 2 * V - N) * DEG) +
      43 * Math.cos((78 + 3 * V - N) * DEG) +
      28 * Math.cos((51 + 3 * V - 2 * N) * DEG) +
      57 * Math.cos((90 + Q) * DEG) +
      49 * Math.cos((306 + Q - N) * DEG) +
      200 * Math.cos((91 + J) * DEG) +
      76 * Math.cos((270 + 2 * J) * DEG));

  // Nutation in longitude.
  const s = 0.00001 * (479 * Math.cos((90 - K) * DEG) + 35 * Math.cos((295 + 2 * N) * DEG));

  const obliquity = 23.45229 - 0.01301 * U + 0.00256 * Math.cos(K * DEG);
  const w = Math.cos(L * DEG);
  const v = Math.sin(L * DEG) * Math.cos(obliquity * DEG);

  // Excel's ATAN2 takes (x, y); JavaScript's takes (y, x).
  const ra = toDeg(Math.atan2(v, w));

  const gha = norm360(15 * dayFraction * 24 + 99.6913 + R + 0.917 * s - ra);
  const dec = toDeg(Math.acos(Math.hypot(w, v))) * Math.sign(ra);
  const semiDiameter = 0.26696 + 0.00447 * Math.cos(N * DEG);

  return { gha, dec, semiDiameter };
}
