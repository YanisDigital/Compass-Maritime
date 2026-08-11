import { useId, type ReactNode } from 'react';

interface SegmentedProps<T extends string> {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label?: string;
  compact?: boolean;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  compact,
}: SegmentedProps<T>) {
  return (
    <div className="field">
      {label ? <span className="legend">{label}</span> : null}
      <div className={compact ? 'segmented compact' : 'segmented'} role="group" aria-label={label}>
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

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  placeholder?: string;
  error?: string;
  hint?: ReactNode;
}

export function NumberField({ label, value, onChange, unit, placeholder, error, hint }: NumberFieldProps) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="unit" data-unit={unit}>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={label}
          value={value}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
          style={unit ? { paddingRight: 26, textAlign: 'right' } : undefined}
        />
      </div>
      {error ? <span className="note error">{error}</span> : hint}
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
      <span className="legend">{label}</span>
      <div className="angle">
        <span className="unit" data-unit="°">
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`${label} degrees`}
            aria-invalid={error ? true : undefined}
            value={degrees}
            onChange={(event) => onDegrees(event.target.value)}
          />
        </span>
        <span className="unit" data-unit="′">
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            aria-label={`${label} minutes`}
            value={minutes}
            onChange={(event) => onMinutes(event.target.value)}
          />
        </span>
        <div className="segmented compact" role="group" aria-label={`${label} hemisphere`}>
          {hemispheres.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === hemisphere}
              onClick={() => onHemisphere(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      {error ? <span className="note error">{error}</span> : null}
    </div>
  );
}

export function Readout({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? 'readout wide' : 'readout'}>
      <div className="k">{label}</div>
      <div className="v">{value}</div>
    </div>
  );
}

export function Row({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className={strong ? 'row strong' : 'row'}>
      <span className="k">{label}</span>
      <span className="v">{value}</span>
    </div>
  );
}
