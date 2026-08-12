import { useState } from 'react';
import { initialForm, type FormState } from './form';
import { Calculate } from './screens/Calculate';
import { SettingsScreen } from './screens/SettingsScreen';
import { loadSettings, useSettings } from './settings';

/** The compass rose of the application mark, drawn as four diamonds. */
function Mark() {
  return (
    <svg className="mark" viewBox="-1 -1 2 2" aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <path d="M0 -0.86 .09 0 0 .86 -.09 0Z" />
        <path d="M-.86 0 0 -.09 .86 0 0 .09Z" />
        <path d="M-.4 -.4 .04 -.12 .4 .4 -.04 .12Z" opacity="0.55" />
        <path d="M.4 -.4 .12 .04 -.4 .4 -.12 -.04Z" opacity="0.55" />
      </g>
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1M18.7 18.7l-2.1-2.1M7.4 7.4L5.3 5.3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function App() {
  const [settings, updateSettings] = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  // The half-filled form belongs to the session, not to the screen: an officer who steps
  // over to Settings must come back to what they had typed.
  const [form, setForm] = useState<FormState>(() => {
    const stored = loadSettings();
    return initialForm({
      variation: stored.defaultVariation,
      variationEW: stored.defaultVariationEW,
    });
  });

  return (
    <>
      <header className="masthead no-print">
        <div className="masthead-inner">
          <Mark />
          <div className="masthead-title">
            <h1>Compass Error</h1>
            {settings.ship ? <span className="masthead-ship">{settings.ship}</span> : null}
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-expanded={showSettings}
            aria-label={showSettings ? 'Close settings' : 'Settings'}
            onClick={() => setShowSettings((open) => !open)}
          >
            {showSettings ? <CloseIcon /> : <GearIcon />}
          </button>
        </div>
      </header>

      <main className={showSettings ? 'stage' : 'stage stage--split'}>
        {showSettings ? (
          <SettingsScreen settings={settings} onChange={updateSettings} />
        ) : (
          <Calculate form={form} onForm={setForm} />
        )}
      </main>
    </>
  );
}
