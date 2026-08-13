import {
  calculateCompassError,
  formatBearing,
  formatDeclination,
  formatHourAngle,
  STAR_CATALOG,
} from '@compass/core';
import type { CompassErrorResult, EastWestAngle } from '@compass/core';
import { useMemo } from 'react';
import { BearingScale } from '../components/BearingScale';
import { AngleField, Hemisphere, LedgerRow, NumberField, Segmented } from '../components/Fields';
import { BODY_LABELS, parseForm, utcToFields, type BodyChoice, type FormState } from '../form';

const BODY_OPTIONS = (Object.keys(BODY_LABELS) as BodyChoice[]).map((value) => ({
  value,
  label: BODY_LABELS[value],
}));

/**
 * Polaris heads the list rather than sitting last alphabetically: it is the star most often
 * reached for when checking a compass in northern latitudes, and the almanac keeps it apart
 * from the 57 selected stars for the same reason. The catalog itself is left in its own
 * order — this is a picker decision, not a data one.
 */
const POLARIS = STAR_CATALOG.filter((star) => star.name === 'Polaris');
const SELECTED_STARS = STAR_CATALOG.filter((star) => star.name !== 'Polaris');

/** The magnitude of an East/West angle. Its name is set separately, and larger. */
const figure = (angle: EastWestAngle) => `${angle.degrees.toFixed(1)}°`;

interface Props {
  /** Held by the App so that a trip to Settings does not discard what was typed. */
  form: FormState;
  onForm: (next: (current: FormState) => FormState) => void;
}

export function Calculate({ form, onForm }: Props) {
  const set = (patch: Partial<FormState>) => onForm((current) => ({ ...current, ...patch }));

  const { input, errors } = useMemo(() => parseForm(form), [form]);

  const { result, failure } = useMemo((): { result?: CompassErrorResult; failure?: string } => {
    if (!input) return {};
    try {
      return { result: calculateCompassError(input) };
    } catch (thrown) {
      return { failure: thrown instanceof Error ? thrown.message : String(thrown) };
    }
  }, [input]);

  const bodyName = form.bodyKind === 'star' ? form.starName : BODY_LABELS[form.bodyKind];

  return (
    <>
      {/* On a phone this wrapper dissolves so the pinned error, the controls and the full
          reading can be ordered independently; on a wide screen it is the sticky column. */}
      <div className="readout-col">
        {result ? (
          <Instrument
            result={result}
            gyroBearing={input!.gyroBearing}
            body={bodyName}
          />
        ) : (
          <section className="instrument">
            <span className="plate-label">Gyro error</span>
            <p className="instrument-empty">— · —</p>
            <p className="instrument-hint">
              {failure ?? 'Enter the position, the time and the gyro bearing.'}
            </p>
          </section>
        )}
        {result ? <Reading result={result} isStar={form.bodyKind === 'star'} /> : null}
      </div>

      <div className="controls-col">
        <section className="panel">
          <div className="panel-head">
            <h2 className="panel-title">Time of observation · UTC</h2>
            <button type="button" className="btn" onClick={() => set(utcToFields(new Date()))}>
              Now
            </button>
          </div>
          <div className="pair">
            <div className="field">
              <label className="field-label" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                className="control"
                type="date"
                value={form.date}
                onChange={(event) => set({ date: event.target.value })}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="time">
                Time
              </label>
              <input
                id="time"
                className="control"
                type="time"
                step={1}
                value={form.time}
                onChange={(event) => set({ time: event.target.value })}
              />
            </div>
          </div>
          {errors.date ? <p className="note note--bad">{errors.date}</p> : null}
        </section>

        <section className="panel">
          <h2 className="panel-title">Ship's position</h2>
          <div className="stack">
            <AngleField
              label="Latitude"
              degrees={form.latDeg}
              minutes={form.latMin}
              hemisphere={form.latNS}
              hemispheres={['N', 'S']}
              onDegrees={(latDeg) => set({ latDeg })}
              onMinutes={(latMin) => set({ latMin })}
              onHemisphere={(value) => set({ latNS: value as 'N' | 'S' })}
              error={errors.latDeg ?? errors.latMin}
            />
            <AngleField
              label="Longitude"
              degrees={form.lonDeg}
              minutes={form.lonMin}
              hemisphere={form.lonEW}
              hemispheres={['E', 'W']}
              onDegrees={(lonDeg) => set({ lonDeg })}
              onMinutes={(lonMin) => set({ lonMin })}
              onHemisphere={(value) => set({ lonEW: value as 'E' | 'W' })}
              error={errors.lonDeg ?? errors.lonMin}
            />
          </div>
        </section>

        <section className="panel">
          <h2 className="panel-title">Body observed</h2>
          <div className="stack">
            <Segmented
              value={form.bodyKind}
              options={BODY_OPTIONS}
              onChange={(bodyKind) => set({ bodyKind })}
              ariaLabel="Body observed"
              tight
            />
            {form.bodyKind === 'star' ? (
              <div className="field">
                <label className="field-label" htmlFor="star">
                  Star
                </label>
                <select
                  id="star"
                  className="control"
                  value={form.starName}
                  onChange={(event) => set({ starName: event.target.value })}
                >
                  <optgroup label="Pole star">
                    {POLARIS.map((star) => (
                      <option key={star.code} value={star.name}>
                        {star.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Navigational stars">
                    {SELECTED_STARS.map((star) => (
                      <option key={star.code} value={star.name}>
                        {star.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel">
          <h2 className="panel-title">Compass readings</h2>
          <div className="pair">
            <NumberField
              label="Gyro bearing"
              mark="°"
              value={form.gyroBearing}
              onChange={(gyroBearing) => set({ gyroBearing })}
              error={errors.gyroBearing}
            />
            <NumberField
              label="Ship's head by gyro"
              mark="°"
              value={form.gyroCourse}
              onChange={(gyroCourse) => set({ gyroCourse })}
              error={errors.gyroCourse}
            />
            <NumberField
              label="Ship's head by magnetic"
              mark="°"
              value={form.magneticCourse}
              onChange={(magneticCourse) => set({ magneticCourse })}
              error={errors.magneticCourse}
            />
            <div className="field">
              <span className="field-label">Variation from the chart</span>
              <div className="angle angle--single">
                <span className="marked" data-mark="°">
                  <input
                    className="control control--figure"
                    type="text"
                    inputMode="decimal"
                    aria-label="Variation"
                    value={form.variation}
                    onChange={(event) => set({ variation: event.target.value })}
                  />
                </span>
                <Hemisphere
                  options={['E', 'W']}
                  value={form.variationEW}
                  onChange={(value) => set({ variationEW: value as 'E' | 'W' })}
                  label="Variation east or west"
                />
              </div>
              {errors.variation ? <span className="note note--bad">{errors.variation}</span> : null}
            </div>
          </div>
          <p className="panel-note">Leave the courses blank to work the gyro error alone.</p>
        </section>
      </div>
    </>
  );
}

/** The pinned face: the error itself, and the geometry that produced it. */
function Instrument({
  result,
  gyroBearing,
  body,
}: {
  result: CompassErrorResult;
  gyroBearing: number;
  body: string;
}) {
  return (
    <section className="instrument instrument--live">
      <span className="plate-label">Gyro error</span>
      <div className="principal">
        <p className="principal-value">
          {figure(result.gyroError)}
          <span className="principal-name">{result.gyroError.name}</span>
        </p>
        {/* Altitude sits beside the body because a high one makes for a poor azimuth. */}
        <p className="principal-aside">
          <b>{body}</b>
          Alt {result.celestial.altitude.toFixed(0)}°
        </p>
      </div>

      <BearingScale trueBearing={result.trueBearing} gyroBearing={gyroBearing} />

      <div className="scale-key">
        <span className="scale-key--true">
          <i>True</i> <b>{formatBearing(result.trueBearing)}</b>
        </span>
        <span>
          <i>Gyro</i> <b>{formatBearing(gyroBearing)}</b>
        </span>
      </div>

      {result.warnings.map((warning) => (
        <p className="note note--warn" key={warning}>
          {warning}
        </p>
      ))}
    </section>
  );
}

/** The rest of the line, and the working behind it. */
function Reading({ result, isStar }: { result: CompassErrorResult; isStar: boolean }) {
  const { celestial, working } = result;

  return (
    <section className="reading">
      <span className="plate-label">Reading</span>

      {result.trueCourse !== undefined ? (
        <div className="ledger">
          <LedgerRow label="True course" value={formatBearing(result.trueCourse)} />
          {result.totalError ? (
            <LedgerRow
              label="Compass error"
              value={figure(result.totalError)}
              name={result.totalError.name}
            />
          ) : null}
          {result.variation ? (
            <LedgerRow
              label="Variation"
              value={figure(result.variation)}
              name={result.variation.name}
            />
          ) : null}
          {result.deviation ? (
            <LedgerRow
              label="Deviation"
              value={figure(result.deviation)}
              name={result.deviation.name}
              principal
            />
          ) : null}
        </div>
      ) : null}

      <details className="working">
        <summary>Working</summary>
        <div className="ledger">
          {isStar && celestial.ghaAries !== undefined ? (
            <LedgerRow label="GHA Aries" value={formatHourAngle(celestial.ghaAries)} />
          ) : null}
          {isStar && celestial.sha !== undefined ? (
            <LedgerRow label="SHA" value={formatHourAngle(celestial.sha)} />
          ) : null}
          <LedgerRow label="GHA" value={formatHourAngle(celestial.gha)} />
          <LedgerRow label="Declination" value={formatDeclination(celestial.dec)} />
          <LedgerRow
            label="LHA"
            value={formatHourAngle(celestial.lha)}
            name={celestial.lha > 180 ? 'E' : 'W'}
          />
          <LedgerRow label="Calculated altitude" value={`${celestial.altitude.toFixed(1)}°`} />
          <LedgerRow label="A" value={working.A.value.toFixed(3)} name={working.A.name} />
          <LedgerRow label="B" value={working.B.value.toFixed(3)} name={working.B.name} />
          <LedgerRow label="C" value={working.C.value.toFixed(3)} name={working.C.name} />
        </div>
      </details>
    </section>
  );
}
