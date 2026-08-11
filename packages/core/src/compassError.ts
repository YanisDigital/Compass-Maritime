import { eastWest, norm180, norm360 } from './angle.js';
import { amplitudeBearing } from './amplitude.js';
import { abcWorking, calculatedAltitude, localHourAngle, trueAzimuth } from './azimuth.js';
import { apparentPlace } from './ephemeris/index.js';
import type { CompassErrorInput, CompassErrorResult, Working } from './types.js';

/** Above this altitude an azimuth changes too quickly with time to be a reliable check. */
const HIGH_ALTITUDE_WARNING = 60;

/** An amplitude is only valid while the body is close to the visible horizon. */
const AMPLITUDE_ALTITUDE_LIMIT = 2;

/**
 * The whole calculation an officer performs at the start of a watch, in one call.
 *
 * The chain follows `SUN & STAR CALC.` rows 17–43 of the reference workbook, with every
 * bearing difference wrapped to ±180° so that observations spanning north — a true
 * bearing of 001° against a gyro bearing of 359°, say — give 2° E rather than 358° W.
 */
export function calculateCompassError(input: CompassErrorInput): CompassErrorResult {
  const { utc, position, body, method, gyroBearing } = input;
  const warnings: string[] = [];

  const place = apparentPlace(body, utc, position);
  const lha = localHourAngle(place.gha, position.longitude);
  const altitude = calculatedAltitude(position.latitude, place.dec, lha);

  let trueBearing: number;
  let working: Working;

  if (method === 'amplitude') {
    const result = amplitudeBearing(position.latitude, place.dec, lha);
    trueBearing = result.trueBearing;
    working = result.working;
    if (Math.abs(altitude) > AMPLITUDE_ALTITUDE_LIMIT) {
      warnings.push(
        `Calculated altitude is ${altitude.toFixed(1)}°. Amplitude applies with the body on the horizon; use the azimuth method.`,
      );
    }
  } else {
    trueBearing = trueAzimuth(position.latitude, place.dec, lha);
    working = abcWorking(position.latitude, place.dec, lha);
    if (altitude > HIGH_ALTITUDE_WARNING) {
      warnings.push(
        `Calculated altitude is ${altitude.toFixed(1)}°. Azimuths of bodies this high change rapidly — check the time of observation.`,
      );
    }
    if (altitude < -1) {
      warnings.push(
        `Calculated altitude is ${altitude.toFixed(1)}°. The body is below the horizon at this time and position.`,
      );
    }
  }

  const gyroError = eastWest(norm180(trueBearing - gyroBearing));

  const result: CompassErrorResult = {
    trueBearing,
    celestial: {
      gha: place.gha,
      dec: place.dec,
      lha,
      altitude,
      sha: place.sha,
      ghaAries: place.ghaAries,
    },
    working,
    gyroError,
    warnings,
  };

  if (input.gyroCourse === undefined) return result;

  result.trueCourse = norm360(input.gyroCourse + gyroError.signed);

  if (input.magneticCourse === undefined) return result;

  const totalError = eastWest(norm180(result.trueCourse - input.magneticCourse));
  result.totalError = totalError;

  if (input.variation === undefined) return result;

  const variation = eastWest(input.variation);
  result.variation = variation;
  result.deviation = eastWest(norm180(totalError.signed - variation.signed));

  return result;
}
