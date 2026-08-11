import { formatBearing, formatDeclination, formatLatitude, formatLongitude } from '@compass/core';
import type { EastWestAngle } from '@compass/core';
import type { ObservationRecord } from '../observation';

/** Column order of the Standard Compass Error Book. */
export const BOOK_COLUMNS = [
  'Date',
  'UTC',
  'Latitude',
  'Longitude',
  'Body',
  'Method',
  'Gyro Brg',
  'True Brg',
  'Gyro Error',
  'Gyro Co',
  'True Co',
  'Magnetic Co',
  'Total Error',
  'Variation',
  'Deviation',
  'Ship',
  'Observer',
] as const;

const error = (angle?: EastWestAngle): string =>
  angle ? `${angle.degrees.toFixed(1)} ${angle.name}` : '';

const course = (value?: number): string => (value === undefined ? '' : formatBearing(value));

export function toBookRow(record: ObservationRecord): string[] {
  const utc = new Date(record.utc);
  return [
    utc.toISOString().slice(0, 10),
    utc.toISOString().slice(11, 19),
    formatLatitude(record.latitude),
    formatLongitude(record.longitude),
    record.body,
    record.method === 'amplitude' ? 'Amplitude' : 'Azimuth',
    formatBearing(record.gyroBearing),
    formatBearing(record.trueBearing),
    error(record.gyroError),
    course(record.gyroCourse),
    course(record.trueCourse),
    course(record.magneticCourse),
    error(record.totalError),
    error(record.variation),
    error(record.deviation),
    record.ship ?? '',
    record.observer ?? '',
  ];
}

/** Extra columns an officer may want when checking the working, appended after the book. */
export const WORKING_COLUMNS = ['GHA', 'Dec', 'LHA', 'Calc Alt'] as const;

export const toWorkingRow = (record: ObservationRecord): string[] => [
  record.gha.toFixed(4),
  formatDeclination(record.dec),
  record.lha.toFixed(4),
  record.altitude.toFixed(2),
];

function escapeCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(records: ObservationRecord[], includeWorking = true): string {
  const header = includeWorking ? [...BOOK_COLUMNS, ...WORKING_COLUMNS] : [...BOOK_COLUMNS];
  const rows = records.map((record) =>
    includeWorking ? [...toBookRow(record), ...toWorkingRow(record)] : toBookRow(record),
  );
  return [header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/** A BOM so that Excel opens the degree and minute marks as UTF-8. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
