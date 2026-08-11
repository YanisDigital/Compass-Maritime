import { eastWest } from '@compass/core';
import { describe, expect, it } from 'vitest';
import type { ObservationRecord } from '../observation';
import { BOOK_COLUMNS, toBookRow, toCsv, WORKING_COLUMNS } from './csv';

const record: ObservationRecord = {
  id: 'a',
  savedAt: 0,
  utc: '2016-09-04T04:44:02.000Z',
  latitude: -35.155,
  longitude: 151.4866667,
  body: 'Sun',
  method: 'azimuth',
  gyroBearing: 307.4,
  trueBearing: 307.6403,
  gyroError: eastWest(0.2403),
  gyroCourse: 27,
  trueCourse: 27.2403,
  magneticCourse: 17,
  totalError: eastWest(10.2403),
  variation: eastWest(13),
  deviation: eastWest(-2.7597),
  gha: 251.27,
  dec: 7.0286,
  lha: 42.7567,
  altitude: 31.695,
  ship: 'MV Test',
  observer: '2/O Smith',
};

describe('the Compass Error Book row', () => {
  it('has one cell per column, in the book order', () => {
    const row = toBookRow(record);
    expect(row).toHaveLength(BOOK_COLUMNS.length);
    expect(row).toEqual([
      '2016-09-04',
      '04:44:02',
      '35° 09.3′ S',
      '151° 29.2′ E',
      'Sun',
      'Azimuth',
      '307.4°',
      '307.6°',
      '0.2 E',
      '027.0°',
      '027.2°',
      '017.0°',
      '10.2 E',
      '13.0 E',
      '2.8 W',
      'MV Test',
      '2/O Smith',
    ]);
  });

  it('leaves cells empty where the officer left readings out', () => {
    const partial: ObservationRecord = {
      ...record,
      gyroCourse: undefined,
      trueCourse: undefined,
      magneticCourse: undefined,
      totalError: undefined,
      variation: undefined,
      deviation: undefined,
      ship: undefined,
      observer: undefined,
    };
    const row = toBookRow(partial);
    expect(row.slice(9)).toEqual(['', '', '', '', '', '', '', '']);
  });
});

describe('CSV export', () => {
  it('carries the book columns and the working columns', () => {
    const lines = toCsv([record]).split('\r\n');
    expect(lines[0]).toBe([...BOOK_COLUMNS, ...WORKING_COLUMNS].join(','));
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('251.2700');
  });

  it('omits the working columns when asked to', () => {
    expect(toCsv([record], false).split('\r\n')[0]).toBe(BOOK_COLUMNS.join(','));
  });

  it('quotes cells that would otherwise break the row', () => {
    const awkward = { ...record, observer: 'Smith, J "Jim"' };
    expect(toCsv([awkward])).toContain('"Smith, J ""Jim"""');
  });
});
