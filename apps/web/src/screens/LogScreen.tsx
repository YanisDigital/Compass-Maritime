import { formatBearing, formatEastWest, formatLatitude, formatLongitude } from '@compass/core';
import { useState } from 'react';
import { BOOK_COLUMNS, downloadCsv, toBookRow, toCsv } from '../export/csv';
import type { ObservationRecord } from '../observation';
import { deleteObservation } from '../storage/db';

interface Props {
  records: ObservationRecord[];
  onChanged: () => void;
}

export function LogScreen({ records, onChanged }: Props) {
  const [view, setView] = useState<'list' | 'book'>('list');

  async function remove(id: string) {
    await deleteObservation(id);
    onChanged();
  }

  if (records.length === 0) {
    return (
      <section className="card">
        <p className="empty">
          No observations yet.
          <br />
          Work an error on the Calculate tab and save it here.
        </p>
      </section>
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <>
      <section className="card no-print">
        <h2>{records.length} observation{records.length === 1 ? '' : 's'}</h2>
        <div className="btn-row">
          <div className="segmented compact" role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
              List
            </button>
            <button type="button" aria-pressed={view === 'book'} onClick={() => setView('book')}>
              Book
            </button>
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 10 }}>
          <button
            type="button"
            className="btn small"
            onClick={() => downloadCsv(`compass-error-book-${stamp}.csv`, toCsv(records))}
          >
            Export CSV
          </button>
          <button type="button" className="btn small" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </section>

      {view === 'book' ? (
        <section className="card">
          <div className="scroll-x">
            <table className="book">
              <thead>
                <tr>
                  {BOOK_COLUMNS.map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    {toBookRow(record).map((cell, index) => (
                      <td key={BOOK_COLUMNS[index]} className={index < 6 ? 'left' : undefined}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        records.map((record) => <Entry key={record.id} record={record} onDelete={() => remove(record.id)} />)
      )}
    </>
  );
}

function Entry({ record, onDelete }: { record: ObservationRecord; onDelete: () => void }) {
  const utc = new Date(record.utc);
  return (
    <article className="entry">
      <div className="entry-head">
        <span className="entry-when">
          {utc.toISOString().slice(0, 10)} {utc.toISOString().slice(11, 19)}Z
        </span>
        <button type="button" className="btn subtle small danger no-print" onClick={onDelete}>
          Delete
        </button>
      </div>
      <div className="entry-body">
        {formatLatitude(record.latitude)} · {formatLongitude(record.longitude)} · {record.body} ·{' '}
        {record.method === 'amplitude' ? 'Amplitude' : 'Azimuth'}
        {record.observer ? ` · ${record.observer}` : ''}
      </div>
      <div className="chips">
        <span className="chip">Gyro {formatBearing(record.gyroBearing)}</span>
        <span className="chip">True {formatBearing(record.trueBearing)}</span>
        <span className="chip">G/E {formatEastWest(record.gyroError)}</span>
        {record.totalError ? <span className="chip">T/E {formatEastWest(record.totalError)}</span> : null}
        {record.deviation ? <span className="chip">Dev {formatEastWest(record.deviation)}</span> : null}
      </div>
    </article>
  );
}
