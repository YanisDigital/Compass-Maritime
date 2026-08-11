import type { CompassErrorInput, CompassErrorResult, EastWestAngle, Method } from '@compass/core';
import { bodyLabel } from './form';

/** One line of the Compass Error Book, as it is stored on the device. */
export interface ObservationRecord {
  id: string;
  savedAt: number;
  /** Instant of observation, ISO 8601 in UTC. */
  utc: string;
  latitude: number;
  longitude: number;
  body: string;
  method: Method;
  gyroBearing: number;
  trueBearing: number;
  gyroError: EastWestAngle;
  gyroCourse?: number;
  trueCourse?: number;
  magneticCourse?: number;
  totalError?: EastWestAngle;
  variation?: EastWestAngle;
  deviation?: EastWestAngle;
  gha: number;
  dec: number;
  lha: number;
  altitude: number;
  ship?: string;
  observer?: string;
  remarks?: string;
}

export function toRecord(
  input: CompassErrorInput,
  result: CompassErrorResult,
  meta: { ship?: string; observer?: string },
): ObservationRecord {
  return {
    id: crypto.randomUUID(),
    savedAt: Date.now(),
    utc: input.utc.toISOString(),
    latitude: input.position.latitude,
    longitude: input.position.longitude,
    body: bodyLabel(input.body),
    method: input.method,
    gyroBearing: input.gyroBearing,
    trueBearing: result.trueBearing,
    gyroError: result.gyroError,
    gyroCourse: input.gyroCourse,
    trueCourse: result.trueCourse,
    magneticCourse: input.magneticCourse,
    totalError: result.totalError,
    variation: result.variation,
    deviation: result.deviation,
    gha: result.celestial.gha,
    dec: result.celestial.dec,
    lha: result.celestial.lha,
    altitude: result.celestial.altitude,
    ship: meta.ship?.trim() || undefined,
    observer: meta.observer?.trim() || undefined,
  };
}
