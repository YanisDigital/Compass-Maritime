import {
  calculateCompassError,
  formatBearing,
  formatDeclination,
  formatEastWest,
  formatHourAngle,
  STAR_CATALOG,
} from '@compass/core';
import type { CompassErrorResult } from '@compass/core';
import { useMemo, useState } from 'react';
import { AngleField, NumberField, Readout, Row, Segmented } from '../components/Fields';
import { BODY_LABELS, parseForm, utcToFields, type BodyChoice, type FormState } from '../form';
import { toRecord } from '../observation';
import type { Settings } from '../settings';
import { saveObservation } from '../storage/db';

const BODY_OPTIONS = (Object.keys(BODY_LABELS) as BodyChoice[]).map((value) => ({
  value,
  label: BODY_LABELS[value],
}));

const METHOD_OPTIONS = [
  { value: 'azimuth' as const, label: 'Azimuth' },
  { value: 'amplitude' as const, label: 'Amplitude' },
];

interface Props {
  settings: Settings;
  /** Held by the App so that a trip to the Log tab does not discard what was typed. */
  form: FormState;
  onForm: (next: (current: FormState) => FormState) => void;
  saved: boolean;
  onSavedChange: (saved: boolean) => void;
  onSaved: () => void;
}

export function Calculate({ settings, form, onForm, saved, onSavedChange, onSaved }: Props) {
  const set = (patch: Partial<FormState>) => {
    onForm((current) => ({ ...current, ...patch }));
    onSavedChange(false);
  };

  const { input, errors } = useMemo(() => parseForm(form), [form]);

  const { result, failure } = useMemo((): { result?: CompassErrorResult; failure?: string } => {
    if (!input) return {};
    try {
      return { result: calculateCompassError(input) };
    } catch (thrown) {
      return { failure: thrown instanceof Error ? thrown.message : String(thrown) };
    }
  }, [input]);

  const [saveError, setSaveError] = useState<string>();

  async function save() {
    if (!input || !result) return;
    try {
      await saveObservation(toRecord(input, result, { ship: settings.ship, observer: settings.observer }));
      setSaveError(undefined);
      onSavedChange(true);
      onSaved();
    } catch {
      // Opening the page straight from a file gives it no storage of its own. The
      // calculation still stands; only the log is unavailable.
      setSaveError(
        'This copy cannot keep a log — the browser gives no storage to a page opened directly from a file. Write the result into the book, or use an installed copy.',
      );
    }
  }

  return (
    <>
      <section className="card">
        <h2>Time of observation (UTC)</h2>
        <div className="grid two">
          <div className="field">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(event) => set({ date: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="time">Time</label>
            <input
              id="time"
              type="time"
              step={1}
              value={form.time}
              onChange={(event) => set({ time: event.target.value })}
            />
          </div>
        </div>
        <div className="btn-row end" style={{ marginTop: 10 }}>
          <button type="button" className="btn small" onClick={() => set(utcToFields(new Date()))}>
            Now
          </button>
        </div>
        {errors.date ? <p className="note error">{errors.date}</p> : null}
      </section>

      <section className="card">
        <h2>Ship's position</h2>
        <div className="grid">
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

      <section className="card">
        <h2>Body observed</h2>
        <Segmented
          value={form.bodyKind}
          options={BODY_OPTIONS}
          onChange={(bodyKind) => set({ bodyKind })}
          compact
        />
        {form.bodyKind === 'star' ? (
          <div className="field" style={{ marginTop: 10 }}>
            <label htmlFor="star">Star</label>
            <select
              id="star"
              value={form.starName}
              onChange={(event) => set({ starName: event.target.value })}
            >
              {STAR_CATALOG.map((star) => (
                <option key={star.code} value={star.name}>
                  {star.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div style={{ marginTop: 10 }}>
          <Segmented
            label="Method"
            value={form.method}
            options={METHOD_OPTIONS}
            onChange={(method) => set({ method })}
          />
        </div>
      </section>

      <section className="card">
        <h2>Compass readings</h2>
        <div className="grid two">
          <NumberField
            label="Gyro bearing"
            unit="°"
            value={form.gyroBearing}
            onChange={(gyroBearing) => set({ gyroBearing })}
            error={errors.gyroBearing}
          />
          <NumberField
            label="Ship's head by gyro"
            unit="°"
            value={form.gyroCourse}
            onChange={(gyroCourse) => set({ gyroCourse })}
            error={errors.gyroCourse}
          />
          <NumberField
            label="Ship's head by magnetic"
            unit="°"
            value={form.magneticCourse}
            onChange={(magneticCourse) => set({ magneticCourse })}
            error={errors.magneticCourse}
          />
          <div className="field">
            <span className="legend">Variation (chart)</span>
            <div className="angle" style={{ gridTemplateColumns: '1fr auto' }}>
              <span className="unit" data-unit="°">
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label="Variation"
                  value={form.variation}
                  onChange={(event) => set({ variation: event.target.value })}
                />
              </span>
              <div className="segmented compact" role="group" aria-label="Variation east or west">
                {(['E', 'W'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={form.variationEW === option}
                    onClick={() => set({ variationEW: option })}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            {errors.variation ? <span className="note error">{errors.variation}</span> : null}
          </div>
        </div>
        <p className="muted" style={{ fontSize: '0.8rem', margin: '10px 0 0' }}>
          Leave the courses blank to work the gyro error alone.
        </p>
      </section>

      {failure ? <p className="note error">{failure}</p> : null}

      {result ? (
        <ResultCard
          result={result}
          saved={saved}
          onSave={save}
          saveError={saveError}
          isStar={form.bodyKind === 'star'}
        />
      ) : (
        <section className="card">
          <p className="empty" style={{ padding: 20 }}>
            Enter the position, the time and the gyro bearing to work the error.
          </p>
        </section>
      )}
    </>
  );
}

function ResultCard({
  result,
  saved,
  onSave,
  saveError,
  isStar,
}: {
  result: CompassErrorResult;
  saved: boolean;
  onSave: () => void;
  saveError?: string;
  isStar: boolean;
}) {
  const { celestial, working } = result;

  return (
    <section className="card result">
      <h2>Result</h2>

      {result.warnings.map((warning) => (
        <p className="note warn" key={warning}>
          {warning}
        </p>
      ))}

      <div className="headline">
        <Readout label="True bearing" value={formatBearing(result.trueBearing)} />
        <Readout label="Gyro error" value={formatEastWest(result.gyroError)} />
      </div>

      {result.trueCourse !== undefined ? (
        <div className="rows">
          <Row label="True course" value={formatBearing(result.trueCourse)} strong />
          {result.totalError ? (
            <Row label="Total (compass) error" value={formatEastWest(result.totalError)} strong />
          ) : null}
          {result.variation ? <Row label="Variation" value={formatEastWest(result.variation)} /> : null}
          {result.deviation ? (
            <Row label="Deviation" value={formatEastWest(result.deviation)} strong />
          ) : null}
        </div>
      ) : null}

      <details className="working">
        <summary>Working</summary>
        <div className="rows" style={{ marginTop: 8 }}>
          {isStar && celestial.ghaAries !== undefined ? (
            <Row label="GHA Aries" value={formatHourAngle(celestial.ghaAries)} />
          ) : null}
          {isStar && celestial.sha !== undefined ? (
            <Row label="SHA" value={formatHourAngle(celestial.sha)} />
          ) : null}
          <Row label="GHA" value={formatHourAngle(celestial.gha)} />
          <Row label="Declination" value={formatDeclination(celestial.dec)} />
          <Row
            label="LHA"
            value={`${formatHourAngle(celestial.lha)} ${celestial.lha > 180 ? 'E' : 'W'}`}
          />
          <Row label="Calculated altitude" value={`${celestial.altitude.toFixed(1)}°`} />
          {working.method === 'azimuth' ? (
            <>
              <Row label="A" value={`${working.A.value.toFixed(3)} ${working.A.name}`} />
              <Row label="B" value={`${working.B.value.toFixed(3)} ${working.B.name}`} />
              <Row label="C" value={`${working.C.value.toFixed(3)} ${working.C.name}`} />
            </>
          ) : (
            <>
              <Row label="Amplitude" value={`${working.amplitude.toFixed(1)}°`} />
              <Row
                label="Quadrant"
                value={`${working.quadrant} (${working.risingSetting === 'E' ? 'rising' : 'setting'})`}
              />
            </>
          )}
        </div>
      </details>

      {saveError ? <p className="note warn">{saveError}</p> : null}

      <div className="btn-row end" style={{ marginTop: 14 }}>
        <button type="button" className="btn primary" onClick={onSave} disabled={Boolean(saveError)}>
          {saved ? 'Saved ✓' : 'Save to log'}
        </button>
      </div>
    </section>
  );
}
