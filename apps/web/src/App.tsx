import { useState } from 'react';
import { initialForm, type FormState } from './form';
import { Calculate } from './screens/Calculate';
import { SettingsScreen } from './screens/SettingsScreen';
import { loadSettings, useSettings } from './settings';

type Tab = 'calculate' | 'settings';

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'calculate', label: 'Calculate' },
  { id: 'settings', label: 'Settings' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('calculate');
  const [settings, updateSettings] = useSettings();

  // The half-filled form belongs to the session, not to the tab: an officer who steps
  // over to Settings must come back to what they had typed.
  const [form, setForm] = useState<FormState>(() => {
    const stored = loadSettings();
    return initialForm({
      variation: stored.defaultVariation,
      variationEW: stored.defaultVariationEW,
    });
  });

  return (
    <div className="app">
      <header className="header no-print">
        <div className="header-row">
          <h1>Compass Error</h1>
          {settings.ship ? <span className="ship">{settings.ship}</span> : null}
        </div>
        <nav className="tabs" role="tablist">
          {TABS.map((entry) => (
            <button
              key={entry.id}
              role="tab"
              type="button"
              aria-selected={tab === entry.id}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'calculate' ? <Calculate form={form} onForm={setForm} /> : null}
        {tab === 'settings' ? (
          <SettingsScreen settings={settings} onChange={updateSettings} />
        ) : null}
      </main>
    </div>
  );
}
