/** Julian Date of the Unix epoch, 1970-01-01T00:00:00Z. */
const JD_UNIX_EPOCH = 2440587.5;

/** Julian Date of J2000.0, 2000-01-01T12:00:00 TT. */
const JD_J2000 = 2451545.0;

const MS_PER_DAY = 86_400_000;

export const julianDate = (utc: Date): number => utc.getTime() / MS_PER_DAY + JD_UNIX_EPOCH;

/**
 * Julian centuries since J2000.0, on the UT scale.
 *
 * The reference workbook writes this as `((serial - 1.5 + dayFraction) / 36525) - 1`
 * over an Excel serial date; that expression is algebraically identical to this one.
 */
export const julianCenturiesJ2000 = (utc: Date): number => (julianDate(utc) - JD_J2000) / 36525;

/** Julian centuries since the epoch 1900.0, which the workbook's Sun series is built on. */
export const julianCenturies1900 = (utc: Date): number => julianCenturiesJ2000(utc) + 1;

/** Fraction of the UTC day elapsed, 0 ≤ f < 1. The Sun and Aries series need it directly. */
export function dayFraction(utc: Date): number {
  return (
    (utc.getUTCHours() * 3600 + utc.getUTCMinutes() * 60 + utc.getUTCSeconds() + utc.getUTCMilliseconds() / 1000) /
    86400
  );
}

/** Excel's day 0 is 1899-12-30. Golden tests quote the workbook's serial dates verbatim. */
const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);

export function fromExcelSerial(serial: number, fraction = 0): Date {
  return new Date(EXCEL_EPOCH_MS + (Math.trunc(serial) + fraction) * MS_PER_DAY);
}

export function toExcelSerial(utc: Date): number {
  return (utc.getTime() - EXCEL_EPOCH_MS) / MS_PER_DAY;
}

/** Build a UTC instant from calendar parts, the way the Calculate screen supplies them. */
export function utcFromParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}
