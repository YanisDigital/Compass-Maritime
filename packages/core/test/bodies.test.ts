import * as Astronomy from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import {
  apparentPlace,
  calculatedAltitude,
  ghaAries,
  localHourAngle,
  norm180,
  trueAzimuth,
} from '../src/index.js';
import type { Position, SolarSystemBody } from '../src/index.js';

/**
 * Everything downstream of the ephemeris — Greenwich hour angle, local hour angle, the
 * spherical azimuth — is our own code. This checks that whole chain against
 * astronomy-engine's independent horizon transform, for every body at a spread of times
 * and positions. If our hour-angle convention or azimuth quadrant were wrong anywhere,
 * these comparisons would not close.
 */

const BODIES: SolarSystemBody[] = ['sun', 'moon', 'venus', 'mars', 'jupiter', 'saturn'];

const PLACES: Array<{ label: string; position: Position }> = [
  { label: 'Sydney approaches', position: { latitude: -35.155, longitude: 151.4867 } },
  { label: 'English Channel', position: { latitude: 50.2, longitude: -1.5 } },
  { label: 'Singapore Strait', position: { latitude: 1.2, longitude: 103.8 } },
  { label: 'North Atlantic', position: { latitude: 62.0, longitude: -30.0 } },
];

const TIMES = [
  new Date('2026-01-15T06:20:00Z'),
  new Date('2026-06-02T18:45:00Z'),
  new Date('2027-10-09T11:05:00Z'),
];

describe('hour angle and azimuth against astronomy-engine', () => {
  for (const body of BODIES) {
    for (const { label, position } of PLACES) {
      for (const utc of TIMES) {
        it(`${body} — ${label} — ${utc.toISOString()}`, () => {
          const observer = new Astronomy.Observer(position.latitude, position.longitude, 0);
          const engineBody = (body[0]!.toUpperCase() + body.slice(1)) as Astronomy.Body;
          const equatorial = Astronomy.Equator(engineBody, utc, observer, true, true);

          // Refraction is omitted, so the comparison is of geometry alone.
          const horizon = Astronomy.Horizon(utc, observer, equatorial.ra, equatorial.dec);

          const place = apparentPlace({ kind: body }, utc, position);
          const lha = localHourAngle(place.gha, position.longitude);
          const altitude = calculatedAltitude(position.latitude, place.dec, lha);

          expect(Math.abs(altitude - horizon.altitude) * 60).toBeLessThan(0.1);

          // Azimuth is ill-conditioned within a degree of the zenith; skip those.
          if (altitude < 89) {
            const azimuth = trueAzimuth(position.latitude, place.dec, lha);
            expect(Math.abs(norm180(azimuth - horizon.azimuth)) * 60).toBeLessThan(0.1);
          }
        });
      }
    }
  }
});

describe('the Moon', () => {
  const utc = new Date('2026-04-18T21:00:00Z');
  const position: Position = { latitude: -35.155, longitude: 151.4867 };

  it('is computed topocentrically, so parallax is already applied', () => {
    const observer = new Astronomy.Observer(position.latitude, position.longitude, 0);

    // Geocentric apparent place of date, for comparison.
    const geocentric = Astronomy.EquatorFromVector(
      Astronomy.RotateVector(
        Astronomy.Rotation_EQJ_EQD(utc),
        Astronomy.GeoVector(Astronomy.Body.Moon, utc, true),
      ),
    );
    const topocentric = Astronomy.Equator(Astronomy.Body.Moon, utc, observer, true, true);

    const ours = apparentPlace({ kind: 'moon' }, utc, position);
    const aries = ghaAries(utc);

    const topocentricGha = (((aries - topocentric.ra * 15) % 360) + 360) % 360;
    const geocentricGha = (((aries - geocentric.ra * 15) % 360) + 360) % 360;

    expect(Math.abs(norm180(ours.gha - topocentricGha)) * 60).toBeLessThan(0.01);
    // Parallax is worth a real amount — this is not a distinction without a difference.
    expect(Math.abs(norm180(topocentricGha - geocentricGha)) * 60).toBeGreaterThan(1);
  });
});
