import { describe, expect, it } from 'vitest';
import { initialForm, parseForm, utcToFields, type FormState } from './form';

const filled = (patch: Partial<FormState> = {}): FormState => ({
  ...initialForm(),
  date: '2016-09-04',
  time: '04:44:02',
  latDeg: '35',
  latMin: '9.3',
  latNS: 'S',
  lonDeg: '151',
  lonMin: '29.2',
  lonEW: 'E',
  gyroBearing: '307.4',
  ...patch,
});

describe('parseForm', () => {
  it('builds the core input from what was typed', () => {
    const { input, errors } = parseForm(filled({ gyroCourse: '27', magneticCourse: '17', variation: '13' }));
    expect(errors).toEqual({});
    expect(input!.utc.toISOString()).toBe('2016-09-04T04:44:02.000Z');
    expect(input!.position.latitude).toBeCloseTo(-35.155, 10);
    expect(input!.position.longitude).toBeCloseTo(151.4866667, 6);
    expect(input!.variation).toBe(13);
  });

  it('signs westerly variation negative', () => {
    const { input } = parseForm(
      filled({ gyroCourse: '27', magneticCourse: '17', variation: '13', variationEW: 'W' }),
    );
    expect(input!.variation).toBe(-13);
  });

  it('accepts a comma as the decimal separator', () => {
    const { input } = parseForm(filled({ latMin: '9,3' }));
    expect(input!.position.latitude).toBeCloseTo(-35.155, 10);
  });

  it('leaves optional readings absent rather than guessing at zero', () => {
    const { input, errors } = parseForm(filled());
    expect(errors).toEqual({});
    expect(input!.gyroCourse).toBeUndefined();
    expect(input!.magneticCourse).toBeUndefined();
    expect(input!.variation).toBeUndefined();
  });

  it('asks for the gyro course before it will work a total error', () => {
    const { input, errors } = parseForm(filled({ magneticCourse: '17' }));
    expect(input).toBeUndefined();
    expect(errors.gyroCourse).toMatch(/head by gyro/);
  });

  it('asks for the magnetic course before it will work a deviation', () => {
    const { errors } = parseForm(filled({ gyroCourse: '27', variation: '13' }));
    expect(errors.magneticCourse).toMatch(/magnetic course/);
  });

  it('rejects positions outside the globe', () => {
    expect(parseForm(filled({ latDeg: '91' })).errors.latDeg).toBeDefined();
    expect(parseForm(filled({ latDeg: '90', latMin: '0.1' })).errors.latMin).toBeDefined();
    expect(parseForm(filled({ lonDeg: '181' })).errors.lonDeg).toBeDefined();
    expect(parseForm(filled({ lonMin: '60' })).errors.lonMin).toBeDefined();
  });

  it('rejects bearings outside the compass card', () => {
    expect(parseForm(filled({ gyroBearing: '361' })).errors.gyroBearing).toBeDefined();
    expect(parseForm(filled({ gyroBearing: '' })).errors.gyroBearing).toBeDefined();
    expect(parseForm(filled({ gyroBearing: 'abc' })).errors.gyroBearing).toBeDefined();
  });

  it('treats a blank minutes field as zero', () => {
    const { input } = parseForm(filled({ latMin: '' }));
    expect(input!.position.latitude).toBe(-35);
  });

  it('rejects an unparseable date', () => {
    expect(parseForm(filled({ date: '' })).errors.date).toBeDefined();
  });
});

describe('utcToFields', () => {
  it('pads the parts the date and time inputs expect', () => {
    expect(utcToFields(new Date('2026-01-05T04:07:09Z'))).toEqual({
      date: '2026-01-05',
      time: '04:07:09',
    });
  });
});
