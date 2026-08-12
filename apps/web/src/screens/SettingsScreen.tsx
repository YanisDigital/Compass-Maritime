import { Hemisphere, Segmented } from '../components/Fields';
import type { Settings, Theme } from '../settings';

const THEMES: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Day' },
  { value: 'dark', label: 'Dusk' },
  { value: 'night', label: 'Night' },
];

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

export function SettingsScreen({ settings, onChange }: Props) {
  return (
    <div className="settings">
      <section className="panel">
        <h2 className="panel-title">Vessel</h2>
        <div className="field">
          <label className="field-label" htmlFor="ship">
            Ship's name
          </label>
          <input
            id="ship"
            className="control"
            type="text"
            value={settings.ship}
            placeholder="MV …"
            onChange={(event) => onChange({ ship: event.target.value })}
          />
        </div>
        <p className="panel-note">
          Shown in the heading, so it is clear which ship the application is set up for.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel-title">Defaults</h2>
        <div className="field">
          <span className="field-label">Variation for this area</span>
          <div className="angle angle--single">
            <span className="marked" data-mark="°">
              <input
                className="control control--figure"
                type="text"
                inputMode="decimal"
                aria-label="Default variation"
                value={settings.defaultVariation}
                onChange={(event) => onChange({ defaultVariation: event.target.value })}
              />
            </span>
            <Hemisphere
              options={['E', 'W']}
              value={settings.defaultVariationEW}
              onChange={(value) => onChange({ defaultVariationEW: value as 'E' | 'W' })}
              label="East or west"
            />
          </div>
        </div>
        <p className="panel-note">Fills the variation field when the application is opened.</p>
      </section>

      <section className="panel">
        <h2 className="panel-title">Lighting</h2>
        <Segmented
          value={settings.theme}
          options={THEMES}
          onChange={(theme) => onChange({ theme })}
          tight
        />
        <p className="panel-note">
          Night is red on black, to preserve dark adaptation on a darkened bridge.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel-title">About</h2>
        <p className="prose">
          Positions of the Sun, Moon and planets are computed with Astronomy Engine; the 57
          navigational stars and Polaris are reduced from a catalog of mean ecliptic coordinates
          of J2000.0. Observations are not stored — the result is worked for entering by hand in
          the ship's Compass Error Book.
        </p>
        <p className="prose" style={{ marginTop: 10 }}>
          This works the compasses. It does not replace the Nautical Almanac as the ship's
          official source, and the officer of the watch remains responsible for the entry made in
          the book.
        </p>
      </section>
    </div>
  );
}
