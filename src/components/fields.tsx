import { useEffect, useId, useState, type ReactNode } from 'react';

interface NumberFieldProps {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
  placeholder?: string;
}

/** 入力中の途中状態（"5." や空欄）を壊さない数値入力 */
export function NumberField({ label, value, onChange, unit, step = 0.1, min, max, allowEmpty, placeholder }: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(value === null ? '' : String(value));

  useEffect(() => {
    const parsed = text === '' ? null : Number(text);
    if (parsed !== value) setText(value === null ? '' : String(value));
    // value が外から変わったときだけ同期する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commit = (raw: string) => {
    setText(raw);
    if (raw.trim() === '') {
      if (allowEmpty) onChange(null);
      return;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    if (min !== undefined && n < min) return;
    if (max !== undefined && n > max) return;
    onChange(n);
  };

  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <span className="relative block">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={text}
          placeholder={placeholder}
          onChange={(e) => commit(e.target.value)}
          onBlur={() => setText(value === null ? '' : String(value))}
          className={`field num ${unit ? 'pr-11' : ''}`}
        />
        {unit && <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>}
      </span>
    </label>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; disabled?: boolean }[];
}

export function SelectField<T extends string>({ label, value, onChange, options }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="field">
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Group({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="m-0 min-w-0 border-0 border-t border-rule p-0 pt-3">
      <legend className="float-left mb-2 flex w-full items-baseline justify-between gap-2 p-0">
        <span className="text-sm font-semibold">{title}</span>
        {aside && <span className="text-xs text-muted">{aside}</span>}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}
