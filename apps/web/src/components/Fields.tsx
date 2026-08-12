import { useId, type ReactNode } from 'react';

interface SegmentedProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label?: string;
  tight?: boolean;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  tight,
}: SegmentedProps<T>) {
  return (
    <div className="field">
      {label ? <span className="field-label">{label}</span> : null}
      <div
        className={tight ? 'segmented segmented--tight' : 'segmented'}
        role="group"
        aria-label={label}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The East/West or North/South chooser that finishes an angle. */
export function Hemisphere({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly [string, string];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="segmented segmented--tight" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mark?: string;
  error?: string;
}

export function NumberField({ label, value, onChange, mark, error }: NumberFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <span className="marked" data-mark={mark}>
        <input
          id={id}
          className={mark ? 'control control--figure' : 'control'}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={label}
          value={value}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
      {error ? <span className="note note--bad">{error}</span> : null}
    </div>
  );
}

interface AngleFieldProps {
  label: string;
  degrees: string;
  minutes: string;
  hemisphere: string;
  hemispheres: readonly [string, string];
  onDegrees: (value: string) => void;
  onMinutes: (value: string) => void;
  onHemisphere: (value: string) => void;
  error?: string;
}

/** Degrees, decimal minutes and a hemisphere — the way every angle is read aloud. */
export function AngleField({
  label,
  degrees,
  minutes,
  hemisphere,
  hemispheres,
  onDegrees,
  onMinutes,
  onHemisphere,
  error,
}: AngleFieldProps) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="angle">
        <span className="marked" data-mark="°">
          <input
            className="control control--figure"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`${label} degrees`}
            aria-invalid={error ? true : undefined}
            value={degrees}
            onChange={(event) => onDegrees(event.target.value)}
          />
        </span>
        <span className="marked" data-mark="′">
          <input
            className="control control--figure"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`${label} minutes`}
            value={minutes}
            onChange={(event) => onMinutes(event.target.value)}
          />
        </span>
        <Hemisphere
          options={hemispheres}
          value={hemisphere}
          onChange={onHemisphere}
          label={`${label} hemisphere`}
        />
      </div>
      {error ? <span className="note note--bad">{error}</span> : null}
    </div>
  );
}

/** One ruled line of the readout, in the order the book asks for it. */
export function LedgerRow({
  label,
  value,
  name,
  principal,
}: {
  label: string;
  value: ReactNode;
  name?: string;
  principal?: boolean;
}) {
  return (
    <div className={principal ? 'ledger-row ledger-row--principal' : 'ledger-row'}>
      <span className="ledger-key">{label}</span>
      <span className="ledger-value">
        {value}
        {name ? <span className="ledger-name">{name}</span> : null}
      </span>
    </div>
  );
}
