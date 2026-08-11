/**
 * The 57 navigational stars plus Polaris, as mean ecliptic coordinates of J2000.0
 * with proper motion expressed as change per Julian century.
 *
 * Transcribed from `Refrences/NavCAlExcel.xls`, sheet `SUN & STAR CALC.`,
 * columns P (name), R (λ₀), S (dλ/dT), U (β₀), V (dβ/dT), rows 65–122.
 *
 * Two deliberate departures from the workbook:
 *   - Column T of the sheet is transcribed nowhere here: no formula in the workbook
 *     ever references it.
 *   - `Enif` carries β₀ = 222.0999 in the sheet, which is not a latitude. The value is
 *     22.0999; the leading `2` is a typing slip. Corrected below and covered by
 *     `test/starCrossCheck.test.ts`.
 */
export interface StarCatalogEntry {
  /** Position in the workbook's list, which is also the code shown on the Star Finder sheet. */
  code: number;
  name: string;
  /** Mean ecliptic longitude at J2000.0, degrees. */
  lambda0: number;
  /** Change in ecliptic longitude, degrees per Julian century. */
  dLambda: number;
  /** Mean ecliptic latitude at J2000.0, degrees. */
  beta0: number;
  /** Change in ecliptic latitude, degrees per Julian century. */
  dBeta: number;
}

export const STAR_CATALOG: readonly StarCatalogEntry[] = [
  { code: 1, name: 'Acamar', lambda0: 23.2723, dLambda: -0.00152, beta0: -53.7402, dBeta: 0.00112 },
  { code: 2, name: 'Achernar', lambda0: 345.3117, dLambda: 0.00285, beta0: -59.3783, dBeta: -0.00275 },
  { code: 3, name: 'Acrux', lambda0: 221.8701, dLambda: -0.00047, beta0: -52.8787, dBeta: -0.0007 },
  { code: 4, name: 'Adhara', lambda0: 110.763, dLambda: 0.00025, beta0: -51.3602, dBeta: 0.0001 },
  { code: 5, name: 'Aldebaran', lambda0: 69.7892, dLambda: 0.00104, beta0: -5.4674, dBeta: -0.0055 },
  { code: 6, name: 'Alioth', lambda0: 158.9334, dLambda: 0.00417, beta0: 54.3188, dBeta: 0.00194 },
  { code: 7, name: 'Alkaid', lambda0: 176.9331, dLambda: -0.0043, beta0: 54.388, dBeta: -0.0023 },
  { code: 8, name: 'Al Nair', lambda0: 315.907, dLambda: 0.00184, beta0: -32.9133, dBeta: -0.00536 },
  { code: 9, name: 'Alnilam', lambda0: 83.4636, dLambda: -0.00002, beta0: -24.5064, dBeta: -0.00007 },
  { code: 10, name: 'Alphard', lambda0: 147.2792, dLambda: -0.00074, beta0: -22.3825, dBeta: 0.00067 },
  { code: 11, name: 'Alphecca', lambda0: 222.2959, dLambda: 0.00568, beta0: 44.3236, dBeta: -0.00118 },
  { code: 12, name: 'Alpheratz', lambda0: 14.3085, dLambda: 0.00162, beta0: 25.6804, dBeta: -0.00575 },
  { code: 13, name: 'Altair', lambda0: 301.7765, dLambda: 0.01939, beta0: 29.3035, dBeta: 0.00733 },
  { code: 14, name: 'Ankaa', lambda0: 345.4938, dLambda: -0.001, beta0: -40.6331, dBeta: -0.01237 },
  { code: 15, name: 'Antares', lambda0: 249.7623, dLambda: -0.00007, beta0: -4.5699, dBeta: -0.00061 },
  { code: 16, name: 'Arcturus', lambda0: 204.2337, dLambda: -0.00768, beta0: 30.7363, dBeta: -0.06288 },
  { code: 17, name: 'Atria', lambda0: 260.8962, dLambda: 0.00123, beta0: -46.1513, dBeta: -0.00075 },
  { code: 18, name: 'Avior', lambda0: 173.1294, dLambda: -0.0025, beta0: -72.6798, dBeta: -0.00013 },
  { code: 19, name: 'Bellatrix', lambda0: 80.9464, dLambda: -0.00032, beta0: -16.8161, dBeta: -0.00037 },
  { code: 20, name: 'Betelgeuse', lambda0: 88.7547, dLambda: 0.0008, beta0: -16.027, dBeta: 0.00026 },
  { code: 21, name: 'Canopus', lambda0: 104.9614, dLambda: 0.00308, beta0: -75.8239, dBeta: 0.00076 },
  { code: 22, name: 'Capella', lambda0: 81.8579, dLambda: 0.00126, beta0: 22.8643, dBeta: -0.01191 },
  { code: 23, name: 'Deneb', lambda0: 335.3293, dLambda: 0.00029, beta0: 59.9061, dBeta: -0.00002 },
  { code: 24, name: 'Denebola', lambda0: 171.6176, dLambda: -0.01153, beta0: 12.2669, dBeta: -0.00849 },
  { code: 25, name: 'Diphda', lambda0: 2.5835, dLambda: 0.00673, beta0: -20.7836, dBeta: -0.00191 },
  { code: 26, name: 'Dubhe', lambda0: 135.1975, dLambda: -0.00239, beta0: 49.6802, dBeta: -0.00343 },
  { code: 27, name: 'Elnath', lambda0: 82.575, dLambda: 0.00037, beta0: 5.3851, dBeta: -0.00491 },
  { code: 28, name: 'Eltanin', lambda0: 267.9687, dLambda: -0.0008, beta0: 74.9223, dBeta: -0.00055 },
  // β₀ reads 222.0999 in the workbook; see the note at the top of this file.
  { code: 29, name: 'Enif', lambda0: 331.885, dLambda: 0.0009, beta0: 22.0999, dBeta: -0.00029 },
  { code: 30, name: 'Fomalhaut', lambda0: 333.8604, dLambda: 0.00716, beta0: -21.1357, dBeta: -0.00802 },
  { code: 31, name: 'Gacrux', lambda0: 216.7397, dLambda: 0.00737, beta0: -47.8312, dBeta: -0.00543 },
  { code: 32, name: 'Gienah', lambda0: 190.7256, dLambda: -0.00449, beta0: -14.5009, dBeta: -0.00128 },
  { code: 33, name: 'Hadar', lambda0: 233.7925, dLambda: -0.00036, beta0: -44.1375, dBeta: -0.00076 },
  { code: 34, name: 'Hamal', lambda0: 37.6625, dLambda: 0.00364, beta0: 9.9651, dBeta: -0.00569 },
  { code: 35, name: 'Kaus Australis', lambda0: 275.0787, dLambda: -0.00106, beta0: -11.0519, dBeta: -0.00346 },
  { code: 36, name: 'Kochab', lambda0: 133.3195, dLambda: -0.00112, beta0: 72.9876, dBeta: -0.00088 },
  { code: 37, name: 'Markab', lambda0: 353.4857, dLambda: 0.00125, beta0: 19.406, dBeta: -0.00182 },
  { code: 38, name: 'Menkar', lambda0: 44.3201, dLambda: -0.00091, beta0: -12.5856, dBeta: -0.00197 },
  { code: 39, name: 'Menkent', lambda0: 222.3086, dLambda: -0.00873, beta0: -22.08, dBeta: -0.01871 },
  { code: 40, name: 'Miaplacidus', lambda0: 211.9692, dLambda: -0.01254, beta0: -72.2357, dBeta: -0.00329 },
  { code: 41, name: 'Mirfak', lambda0: 62.081, dLambda: 0.00051, beta0: 30.1255, dBeta: -0.00084 },
  { code: 42, name: 'Nunki', lambda0: 282.3853, dLambda: 0.00026, beta0: -3.4495, dBeta: -0.00156 },
  { code: 43, name: 'Peacock', lambda0: 293.8176, dLambda: -0.00041, beta0: -36.2677, dBeta: -0.00244 },
  { code: 44, name: 'Pollux', lambda0: 113.2156, dLambda: -0.017, beta0: 6.6842, dBeta: -0.00436 },
  { code: 45, name: 'Procyon', lambda0: 115.7855, dLambda: -0.01504, beta0: -16.0196, dBeta: -0.03143 },
  { code: 46, name: 'Rasalhague', lambda0: 262.4487, dLambda: 0.00459, beta0: 35.8352, dBeta: -0.00609 },
  { code: 47, name: 'Regulus', lambda0: 149.8292, dLambda: -0.00648, beta0: 0.4649, dBeta: -0.00222 },
  { code: 48, name: 'Rigel', lambda0: 76.8295, dLambda: -0.00003, beta0: -31.1228, dBeta: -0.00007 },
  { code: 49, name: 'Rigil Kentaurus', lambda0: 239.4793, dLambda: -0.13521, beta0: -42.5959, dBeta: -0.02399 },
  { code: 50, name: 'Sabik', lambda0: 257.9696, dLambda: 0.00084, beta0: 7.1978, dBeta: 0.00275 },
  { code: 51, name: 'Schedar', lambda0: 37.7838, dLambda: 0.00105, beta0: 46.6222, dBeta: -0.00157 },
  { code: 52, name: 'Shaula', lambda0: 264.5858, dLambda: 0.00007, beta0: -13.7884, dBeta: -0.00079 },
  { code: 53, name: 'Sirius', lambda0: 104.0816, dLambda: -0.01524, beta0: -39.6053, dBeta: -0.03492 },
  { code: 54, name: 'Spica', lambda0: 203.8414, dLambda: -0.00075, beta0: -2.0545, dBeta: -0.00118 },
  { code: 55, name: 'Suhail', lambda0: 161.1877, dLambda: -0.00116, beta0: -55.8708, dBeta: 0.00011 },
  { code: 56, name: 'Vega', lambda0: 285.3164, dLambda: 0.01403, beta0: 61.7328, dBeta: 0.00709 },
  { code: 57, name: 'Zubenelgenubi', lambda0: 225.0827, dLambda: -0.00226, beta0: 0.333, dBeta: -0.00267 },
  { code: 58, name: 'Polaris', lambda0: 88.5676, dLambda: 0.00098, beta0: 66.1014, dBeta: -0.00118 },
];

/** Spellings used by the workbook, so an officer can search by either. */
const ALIASES: Record<string, string> = {
  betelguese: 'Betelgeuse',
  'k aust': 'Kaus Australis',
  'kaus aust': 'Kaus Australis',
  'rigil kent': 'Rigil Kentaurus',
  zebenelgenubi: 'Zubenelgenubi',
};

const BY_NAME = new Map<string, StarCatalogEntry>(
  STAR_CATALOG.map((s) => [s.name.toLowerCase(), s]),
);

export function findStar(name: string): StarCatalogEntry | undefined {
  const key = name.trim().toLowerCase();
  return BY_NAME.get(ALIASES[key]?.toLowerCase() ?? key);
}

export function starByCode(code: number): StarCatalogEntry | undefined {
  return STAR_CATALOG.find((s) => s.code === code);
}
