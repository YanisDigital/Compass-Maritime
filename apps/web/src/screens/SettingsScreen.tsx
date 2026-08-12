import { Segmented } from '../components/Fields';
import type { Settings, Theme } from '../settings';

const THEMES: ReadonlyArray<{ value: Theme; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'night', label: 'Night' },
];

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

export function SettingsScreen({ settings, onChange }: Props) {
  return (
    <>
      <section className="card">
        <h2>Vessel</h2>
        <div className="field">
          <label htmlFor="ship">Ship's name</label>
          <input
            id="ship"
            type="text"
            value={settings.ship}
            placeholder="MV …"
            onChange={(event) => onChange({ ship: event.target.value })}
          />
        </div>
        <p className="muted" style={{ fontSize: '0.8rem', margin: '10px 0 0' }}>
          Shown in the heading, so it is clear which ship the application is set up for.
        </p>
      </section>

      <section className="card">
        <h2>Defaults</h2>
        <div className="field">
          <span className="legend">Variation for this area</span>
          <div className="angle" style={{ gridTemplateColumns: '1fr auto' }}>
            <span className="unit" data-unit="°">
              <input
                type="text"
                inputMode="decimal"
                aria-label="Default variation"
                value={settings.defaultVariation}
                onChange={(event) => onChange({ defaultVariation: event.target.value })}
              />
            </span>
            <div className="segmented compact" role="group" aria-label="East or west">
              {(['E', 'W'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={settings.defaultVariationEW === option}
                  onClick={() => onChange({ defaultVariationEW: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="muted" style={{ fontSize: '0.8rem', margin: '10px 0 0' }}>
          Used to fill the variation field when the Calculate tab is first opened.
        </p>
      </section>

      <section className="card">
        <h2>Display</h2>
        <Segmented
          value={settings.theme}
          options={THEMES}
          onChange={(theme) => onChange({ theme })}
          compact
        />
        <p className="muted" style={{ fontSize: '0.8rem', margin: '10px 0 0' }}>
          Night is red on black, to preserve dark adaptation on a darkened bridge.
        </p>
      </section>

      <section className="card">
        <h2>About</h2>
        <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
          Compass Error Calculator. Positions of the Sun, Moon and planets are computed with
          Astronomy Engine; the 57 navigational stars and Polaris are reduced from a catalog of
          mean ecliptic coordinates of J2000.0. Observations are not stored — the result is
          worked for entering by hand in the ship's Compass Error Book. Results are for checking
          the compasses and do not replace the Nautical Almanac as the ship's official source.
        </p>
      </section>
    </>
  );
}
