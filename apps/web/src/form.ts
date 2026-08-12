import type { BodyRef, CompassErrorInput, Method, SolarSystemBody } from '@compass/core';
import { fromDegreesMinutes } from '@compass/core';

export type BodyChoice = SolarSystemBody | 'star';

export interface FormState {
  date: string;
  time: string;
  latDeg: string;
  latMin: string;
  latNS: 'N' | 'S';
  lonDeg: string;
  lonMin: string;
  lonEW: 'E' | 'W';
  bodyKind: BodyChoice;
  starName: string;
  method: Method;
  gyroBearing: string;
  gyroCourse: string;
  magneticCourse: string;
  variation: string;
  variationEW: 'E' | 'W';
}

export type FormErrors = Partial<Record<keyof FormState, string>>;

export const BODY_LABELS: Record<BodyChoice, string> = {
  sun: 'Sun',
  moon: 'Moon',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  star: 'Star',
};

/** Pad the parts of a UTC instant into the strings the date and time inputs want. */
export function utcToFields(utc: Date): { date: string; time: string } {
  const pad = (n: number, width = 2) => String(n).padStart(width, '0');
  return {
    date: `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`,
    time: `${pad(utc.getUTCHours())}:${pad(utc.getUTCMinutes())}:${pad(utc.getUTCSeconds())}`,
  };
}

export function initialForm(defaults?: { variation?: string; variationEW?: 'E' | 'W' }): FormState {
  const now = utcToFields(new Date());
  return {
    ...now,
    latDeg: '',
    latMin: '',
    latNS: 'N',
    lonDeg: '',
    lonMin: '',
    lonEW: 'E',
    bodyKind: 'sun',
    starName: 'Altair',
    method: 'azimuth',
    gyroBearing: '',
    gyroCourse: '',
    magneticCourse: '',
    variation: defaults?.variation ?? '',
    variationEW: defaults?.variationEW ?? 'E',
  };
}

const isBlank = (value: string): boolean => value.trim() === '';

function parseNumber(value: string): number | undefined {
  if (isBlank(value)) return undefined;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export interface ParsedForm {
  input?: CompassErrorInput;
  errors: FormErrors;
}

/**
 * Turn the typed fields into the one input object the core takes, reporting anything
 * that would make the calculation meaningless. Fields left blank are simply absent —
 * an officer taking only a gyro error should not have to invent a magnetic course.
 */
export function parseForm(form: FormState): ParsedForm {
  const errors: FormErrors = {};

  const utc = new Date(`${form.date}T${form.time || '00:00:00'}Z`);
  if (isBlank(form.date) || Number.isNaN(utc.getTime())) errors.date = 'Enter a valid UTC date and time.';

  const latDeg = parseNumber(form.latDeg);
  const latMin = parseNumber(form.latMin) ?? 0;
  if (latDeg === undefined) errors.latDeg = 'Latitude is required.';
  else if (latDeg < 0 || latDeg > 90) errors.latDeg = 'Degrees must be 0–90.';
  if (latMin < 0 || latMin >= 60) errors.latMin = 'Minutes must be 0–59.9.';
  if (latDeg === 90 && latMin > 0) errors.latMin = 'Latitude cannot exceed 90°.';

  const lonDeg = parseNumber(form.lonDeg);
  const lonMin = parseNumber(form.lonMin) ?? 0;
  if (lonDeg === undefined) errors.lonDeg = 'Longitude is required.';
  else if (lonDeg < 0 || lonDeg > 180) errors.lonDeg = 'Degrees must be 0–180.';
  if (lonMin < 0 || lonMin >= 60) errors.lonMin = 'Minutes must be 0–59.9.';
  if (lonDeg === 180 && lonMin > 0) errors.lonMin = 'Longitude cannot exceed 180°.';

  const gyroBearing = parseNumber(form.gyroBearing);
  if (gyroBearing === undefined) errors.gyroBearing = 'Gyro bearing is required.';
  else if (gyroBearing < 0 || gyroBearing > 360) errors.gyroBearing = 'Bearing must be 000–360.';

  const gyroCourse = parseNumber(form.gyroCourse);
  if (gyroCourse !== undefined && (gyroCourse < 0 || gyroCourse > 360))
    errors.gyroCourse = 'Course must be 000–360.';

  const magneticCourse = parseNumber(form.magneticCourse);
  if (magneticCourse !== undefined && (magneticCourse < 0 || magneticCourse > 360))
    errors.magneticCourse = 'Course must be 000–360.';
  if (magneticCourse !== undefined && gyroCourse === undefined)
    errors.gyroCourse = "The ship's head by gyro is needed to work the total error.";

  const variationValue = parseNumber(form.variation);
  if (variationValue !== undefined && (variationValue < 0 || variationValue > 180))
    errors.variation = 'Variation must be 0–180.';
  if (variationValue !== undefined && magneticCourse === undefined)
    errors.magneticCourse = 'The magnetic course is needed to work the deviation.';

  if (form.bodyKind === 'star' && isBlank(form.starName)) errors.starName = 'Choose a star.';

  if (Object.keys(errors).length > 0 || latDeg === undefined || lonDeg === undefined || gyroBearing === undefined) {
    return { errors };
  }

  const body: BodyRef =
    form.bodyKind === 'star' ? { kind: 'star', name: form.starName } : { kind: form.bodyKind };

  return {
    errors,
    input: {
      utc,
      position: {
        latitude: fromDegreesMinutes(latDeg, latMin, form.latNS === 'S'),
        longitude: fromDegreesMinutes(lonDeg, lonMin, form.lonEW === 'W'),
      },
      body,
      method: form.method,
      gyroBearing,
      gyroCourse,
      magneticCourse,
      variation:
        variationValue === undefined
          ? undefined
          : form.variationEW === 'W'
            ? -variationValue
            : variationValue,
    },
  };
}
