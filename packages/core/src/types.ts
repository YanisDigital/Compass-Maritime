/** Cardinal name for a latitude or a declination. */
export type NorthSouth = 'N' | 'S';

/** Cardinal name for a longitude, an hour angle, or a compass error. */
export type EastWest = 'E' | 'W';

/**
 * An angle a navigator writes as a magnitude plus a cardinal letter, e.g. `0.3 E`.
 * `signed` is the same angle with East positive and West negative, which is the
 * form all arithmetic is done in.
 */
export interface EastWestAngle {
  degrees: number;
  name: EastWest;
  signed: number;
}

/** Ship's position in signed decimal degrees: North and East positive. */
export interface Position {
  latitude: number;
  longitude: number;
}

/** The celestial bodies this application can observe. */
export type SolarSystemBody = 'sun' | 'moon' | 'venus' | 'mars' | 'jupiter' | 'saturn';

export type BodyRef = { kind: SolarSystemBody } | { kind: 'star'; name: string };

/** How the body's true bearing is obtained. */
export type Method = 'azimuth' | 'amplitude';

/** Apparent place of the observed body, in the terms a Compass Error Book uses. */
export interface CelestialPosition {
  /** Greenwich hour angle, 0–360. */
  gha: number;
  /** Declination, signed, North positive. */
  dec: number;
  /** Local hour angle, 0–360, measured westward. */
  lha: number;
  /** Calculated altitude of the body's centre, degrees. */
  altitude: number;
  /** Sidereal hour angle — stars only. */
  sha?: number;
  /** Greenwich hour angle of Aries — stars only. */
  ghaAries?: number;
}

/** A quantity from the ABC azimuth tables: a magnitude with a N/S name. */
export interface NamedValue {
  value: number;
  name: NorthSouth;
}

export interface AzimuthWorking {
  method: 'azimuth';
  A: NamedValue;
  B: NamedValue;
  C: NamedValue;
  /** Azimuth derived from C, shown so an officer can check it against the tables. */
  azimuthByABC: number;
}

export interface AmplitudeWorking {
  method: 'amplitude';
  /** Amplitude measured from the prime vertical, degrees. */
  amplitude: number;
  /** `E` while the body is east of the meridian (rising), `W` while west (setting). */
  risingSetting: EastWest;
  /** Quadrant the bearing falls in, e.g. `NW`. */
  quadrant: string;
}

export type Working = AzimuthWorking | AmplitudeWorking;

export interface CompassErrorInput {
  /** Instant of observation, UTC. */
  utc: Date;
  position: Position;
  body: BodyRef;
  method: Method;
  /** Bearing of the body read off the gyro repeater, 0–360. */
  gyroBearing: number;
  /** Ship's head by gyro compass, 0–360. Omit to compute gyro error only. */
  gyroCourse?: number;
  /** Ship's head by magnetic compass, 0–360. Required for total error and deviation. */
  magneticCourse?: number;
  /** Chart variation for the position, East positive. */
  variation?: number;
}

export interface CompassErrorResult {
  trueBearing: number;
  celestial: CelestialPosition;
  working: Working;
  gyroError: EastWestAngle;
  trueCourse?: number;
  totalError?: EastWestAngle;
  variation?: EastWestAngle;
  deviation?: EastWestAngle;
  /** Conditions worth an officer's attention, e.g. a body too high for a reliable azimuth. */
  warnings: string[];
}
