import styles from "./input-with-unit.module.css";

export interface InputWithUnitOption {
  readonly value: string;
  readonly label: string;
}

export interface InputWithUnitProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly unit: string;
  readonly unitKind?: "static" | "select";
  readonly selectOptions?: readonly InputWithUnitOption[];
  readonly onUnitChange?: (value: string) => void;
  readonly inputMode?: "decimal" | "numeric" | "text";
  readonly ariaLabel: string;
  readonly unitAriaLabel?: string;
  readonly min?: number;
  readonly step?: number | "any";
}

export function InputWithUnit({
  value,
  onChange,
  unit,
  unitKind = "static",
  selectOptions = [],
  onUnitChange,
  inputMode = "decimal",
  ariaLabel,
  unitAriaLabel,
  min,
  step = "any",
}: InputWithUnitProps) {
  return (
    <div className={styles.control}>
      <input
        aria-label={ariaLabel}
        inputMode={inputMode}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        type="number"
        value={value}
      />
      {unitKind === "select" ? (
        <select
          aria-label={unitAriaLabel ?? `${ariaLabel} unit`}
          className={styles.unitSelect}
          onChange={(event) => onUnitChange?.(event.target.value)}
          value={unit}
        >
          {selectOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <span className={styles.unitSuffix}>{unit}</span>
      )}
    </div>
  );
}
