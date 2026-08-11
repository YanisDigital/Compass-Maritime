import { useCallback, useEffect, useState } from 'react';
import { initialForm, type FormState } from './form';
import type { ObservationRecord } from './observation';
import { Calculate } from './screens/Calculate';
import { LogScreen } from './screens/LogScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { loadSettings, useSettings } from './settings';
import { listObservations } from './storage/db';

type Tab = 'calculate' | 'log' | 'settings';

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'calculate', label: 'Calculate' },
  { id: 'log', label: 'Log' },
  { id: 'settings', label: 'Settings' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('calculate');
  const [settings, updateSettings] = useSettings();
  const [records, setRecords] = useState<ObservationRecord[]>([]);

  // The half-filled form belongs to the session, not to the tab: an officer who steps
  // over to the Log to check the last entry must come back to what they had typed.
  const [form, setForm] = useState<FormState>(() => {
    const stored = loadSettings();
    return initialForm({
      variation: stored.defaultVariation,
      variationEW: stored.defaultVariationEW,
    });
  });
  const [saved, setSaved] = useState(false);

  const refresh = useCallback(() => {
    listObservations().then(setRecords).catch(() => setRecords([]));
  }, []);

  useEffect(refresh, [refresh]);

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
              {entry.id === 'log' && records.length > 0 ? ` (${records.length})` : ''}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'calculate' ? (
          <Calculate
            settings={settings}
            form={form}
            onForm={setForm}
            saved={saved}
            onSavedChange={setSaved}
            onSaved={refresh}
          />
        ) : null}
        {tab === 'log' ? <LogScreen records={records} onChanged={refresh} /> : null}
        {tab === 'settings' ? (
          <SettingsScreen
            settings={settings}
            onChange={updateSettings}
            recordCount={records.length}
            onCleared={refresh}
          />
        ) : null}
      </main>
    </div>
  );
}
