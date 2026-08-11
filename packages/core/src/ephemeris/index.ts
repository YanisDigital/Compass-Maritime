import * as Astronomy from 'astronomy-engine';
import { norm360 } from '../angle.js';
import { findStar } from '../catalog/stars.js';
import { julianCenturiesJ2000 } from '../time.js';
import type { BodyRef, Position, SolarSystemBody } from '../types.js';
import { reduceStar } from './starReduction.js';

export { reduceStar, ghaAriesLowPrecision } from './starReduction.js';
export { sunLowPrecision } from './sunLowPrecision.js';
export type { StarPlace } from './starReduction.js';
export type { SunPlace } from './sunLowPrecision.js';

const ENGINE_BODY: Record<SolarSystemBody, Astronomy.Body> = {
  sun: Astronomy.Body.Sun,
  moon: Astronomy.Body.Moon,
  venus: Astronomy.Body.Venus,
  mars: Astronomy.Body.Mars,
  jupiter: Astronomy.Body.Jupiter,
  saturn: Astronomy.Body.Saturn,
};

/** Apparent place of the observed body, referred to Greenwich. */
export interface ApparentPlace {
  gha: number;
  dec: number;
  sha?: number;
  ghaAries?: number;
}

/**
 * Greenwich hour angle of Aries — apparent sidereal time at Greenwich, in degrees.
 * This replaces the workbook's own series with the engine's, which carries full nutation.
 */
export function ghaAries(utc: Date): number {
  return norm360(Astronomy.SiderealTime(utc) * 15);
}

export function apparentPlace(body: BodyRef, utc: Date, position: Position): ApparentPlace {
  const aries = ghaAries(utc);

  if (body.kind === 'star') {
    const star = findStar(body.name);
    if (!star) throw new Error(`Unknown star: ${body.name}`);
    const place = reduceStar(star, julianCenturiesJ2000(utc));
    return {
      gha: norm360(aries + place.sha),
      dec: place.dec,
      sha: place.sha,
      ghaAries: aries,
    };
  }

  // Topocentric so that the Moon's parallax — up to about a degree — is accounted for.
  const observer = new Astronomy.Observer(position.latitude, position.longitude, 0);
  const equatorial = Astronomy.Equator(ENGINE_BODY[body.kind], utc, observer, true, true);

  return {
    gha: norm360(aries - equatorial.ra * 15),
    dec: equatorial.dec,
  };
}
