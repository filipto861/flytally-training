const integerFormatter = new Intl.NumberFormat("en-US");

export function formatThousands(value: number): string {
  return integerFormatter.format(value);
}

export function formatThousandsWithUnit(value: number, unit: string): string {
  return `${formatThousands(value)} ${unit}`;
}
