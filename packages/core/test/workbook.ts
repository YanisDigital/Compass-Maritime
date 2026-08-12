import { fromExcelSerial, packedToDegrees } from '../src/index.js';

/**
 * The worked example carried in `Refrences/NavCAlExcel.xls`, sheet `SUN & STAR CALC.`,
 * column C. Every expected value below is read straight out of that sheet.
 */
export const WORKBOOK_EXAMPLE = {
  /** Excel serial `C3` and day fraction `C4` — 04:44:02 UTC. */
  utc: fromExcelSerial(42617, 0.19724537037037),
  position: {
    latitude: -packedToDegrees(35.093), // C5/D5 — 35° 09.3′ S
    longitude: packedToDegrees(151.292), // C6/D6 — 151° 29.2′ E
  },
  variation: 13, // C7/D7 — 13° E
  gyroBearing: 307.4, // C8
  gyroCourse: 27, // C9
  magneticCourse: 17, // C10
};

/** Sun results, workbook cells C13, C15, C14, C30–C32, C17, C18, C19, C20, C21. */
export const WORKBOOK_SUN_EXPECTED = {
  gha: packedToDegrees(251.16), // 251° 16.0′
  dec: packedToDegrees(7.0159), // N 7° 01.6′
  lha: packedToDegrees(42.4521), // 42° 45.2′ W
  A: 0.762, // N23, rounded to three decimals by the sheet
  B: 0.182, // N24, likewise
  C: 0.944, // N25 — the sum of the two *rounded* values

  /**
   * The sheet holds two azimuths for this observation and they disagree by 0.02°:
   *
   *   `C102` = 307.641305  — the spherical formula, computed at full precision
   *   `P27`  = 307.661     — the ABC formula, computed from A and B after each has
   *                          been rounded to three decimals the way the printed
   *                          azimuth tables give them
   *
   * `C17` reports the second, so the workbook's Compass Error Book line reads 0.3° E.
   * Carried at full precision the same observation gives 0.2° E. The application uses
   * the accurate value; both are asserted below so the difference stays documented.
   */
  trueBearingDirect: 307.641305, // C102
  trueBearingFromRoundedTables: 307.661, // P27 → C17

  gyroError: { degrees: 0.2, name: 'E' },
  trueCourse: 27.2,
  totalError: { degrees: 10.2, name: 'E' },
  deviation: { degrees: 2.8, name: 'W' },

  /** What the sheet itself prints, from its table-rounded bearing. */
  workbookBookLine: {
    gyroError: { degrees: 0.3, name: 'E' },
    trueCourse: 27.3,
    totalError: { degrees: 10.3, name: 'E' },
    deviation: { degrees: 2.7, name: 'W' },
  },
};

/** Star results for Altair at the same instant, workbook cells N16–N20 and N13. */
export const WORKBOOK_STAR_EXPECTED = {
  star: 'Altair',
  ghaAries: packedToDegrees(54.4512), // 54° 45.1′
  sha: packedToDegrees(62.0596), // 62° 05.9′
  lhaStar: packedToDegrees(268.2028), // 268° 20.3′
  dec: packedToDegrees(8.5508), // N 8° 55.1′
  azimuth: 83.6296, // N13
};
