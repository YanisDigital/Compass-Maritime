import { DEG, norm360, toDeg } from './angle.js';
import type { AzimuthWorking, EastWest, NamedValue, NorthSouth } from './types.js';

/** Local hour angle, measured westward from the observer's meridian. */
export const localHourAngle = (gha: number, longitude: number): number => norm360(gha + longitude);

/** Calculated altitude of the body's centre (`SUN & STAR CALC.` row 99). */
export function calculatedAltitude(latitude: number, dec: number, lha: number): number {
  const sinAlt =
    Math.sin(latitude * DEG) * Math.sin(dec * DEG) +
    Math.cos(latitude * DEG) * Math.cos(dec * DEG) * Math.cos(lha * DEG);
  return toDeg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));
}

/**
 * True azimuth by the spherical formula (`SUN & STAR CALC.` rows 101–102).
 *
 * This is the authoritative value. It has no quadrant ambiguity and no singularity
 * at LHA 0 or 180, which the ABC method does.
 */
export function trueAzimuth(latitude: number, dec: number, lha: number): number {
  const altitude = calculatedAltitude(latitude, dec, lha);
  const cosAz =
    (Math.sin(dec * DEG) - Math.sin(latitude * DEG) * Math.sin(altitude * DEG)) /
    (Math.cos(altitude * DEG) * Math.cos(latitude * DEG));
  const az = toDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));
  return lha <= 180 ? 360 - az : az;
}

/** `E` while the body lies east of the observer's meridian, `W` while west. */
export const hourAngleName = (lha: number): EastWest => (lha > 180 ? 'E' : 'W');

const opposite = (name: NorthSouth): NorthSouth => (name === 'N' ? 'S' : 'N');

/**
 * The A, B and C quantities of the azimuth tables (`SUN & STAR CALC.` N23:P27).
 *
 * These are not used to produce the answer — they are shown to the officer so the
 * result can be checked against the printed tables by hand, which is how it is done
 * on the bridge.
 */
export function abcWorking(latitude: number, dec: number, lha: number): AzimuthWorking {
  const latName: NorthSouth = latitude < 0 ? 'S' : 'N';
  const decName: NorthSouth = dec < 0 ? 'S' : 'N';

  // A is named opposite to the latitude, except while the body is within 90° of the
  // observer's meridian on the far side, where it takes the latitude's own name.
  const A: NamedValue = {
    value: Math.abs(Math.tan(latitude * DEG) / Math.tan(lha * DEG)),
    name: lha < 90 || lha > 270 ? opposite(latName) : latName,
  };

  // B always takes the name of the declination.
  const B: NamedValue = {
    value: Math.abs(Math.tan(dec * DEG) / Math.sin(lha * DEG)),
    name: decName,
  };

  const signedA = A.name === 'S' ? -A.value : A.value;
  const signedB = B.name === 'S' ? -B.value : B.value;
  const signedC = signedA + signedB;

  const C: NamedValue = {
    value: A.name === B.name ? A.value + B.value : Math.abs(A.value - B.value),
    name: signedC < 0 ? 'S' : 'N',
  };

  const azimuthByABC = quadrantalToThreeFigure(
    Math.abs(toDeg(Math.atan(C.value * Math.cos(latitude * DEG)))),
    C.name,
    hourAngleName(lha),
  );

  return { A, B, C, azimuthByABC };
}

/**
 * Convert a quadrantal bearing into three-figure notation (`SUN & STAR CALC.` P27).
 *
 * `angle` is measured from the prime vertical — from East or from West toward the
 * named pole — which is the form `atan(C·cos lat)` produces.
 */
export function quadrantalToThreeFigure(
  angle: number,
  northSouth: NorthSouth,
  eastWest: EastWest,
): number {
  const quadrant = `${northSouth}${eastWest}`;
  switch (quadrant) {
    case 'NE':
      return norm360(90 - angle);
    case 'SE':
      return norm360(90 + angle);
    case 'SW':
      return norm360(270 - angle);
    default:
      return norm360(270 + angle);
  }
}
