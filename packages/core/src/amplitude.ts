import { DEG, toDeg } from './angle.js';
import { hourAngleName, quadrantalToThreeFigure } from './azimuth.js';
import type { AmplitudeWorking, NorthSouth } from './types.js';

export interface AmplitudeResult {
  trueBearing: number;
  working: AmplitudeWorking;
}

/**
 * True bearing of a body on the horizon, by amplitude (`SUN & STAR CALC.` E16:E18).
 *
 * The workbook's `E16` maps the NE quadrant to `90 + amplitude`. That is a slip: a body
 * with northerly declination rises north of East, so the bearing is `90 − amplitude`.
 * The sheet's own ABC azimuth formula in `P27` uses `90 − angle` for the same quadrant.
 * The corrected rule is used here; the other three quadrants match the sheet.
 */
export function amplitudeBearing(latitude: number, dec: number, lha: number): AmplitudeResult {
  const ratio = Math.sin(dec * DEG) / Math.cos(latitude * DEG);
  if (Math.abs(ratio) > 1) {
    throw new Error(
      'The body never reaches the horizon at this latitude — amplitude does not apply.',
    );
  }

  const amplitude = Math.abs(toDeg(Math.asin(ratio)));
  const decName: NorthSouth = dec < 0 ? 'S' : 'N';
  const risingSetting = hourAngleName(lha);
  const trueBearing = quadrantalToThreeFigure(amplitude, decName, risingSetting);

  return {
    trueBearing,
    working: {
      method: 'amplitude',
      amplitude,
      risingSetting,
      quadrant: `${decName}${risingSetting}`,
    },
  };
}
