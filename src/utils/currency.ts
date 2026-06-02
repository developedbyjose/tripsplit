export type CurrencyCode = 'PHP' | 'USD' | 'EUR' | 'SGD' | 'JPY';

export interface CurrencyOption {
  code: CurrencyCode;
  label: string;
  symbol: string;
}

export interface FormatCurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export const DEFAULT_CURRENCY: CurrencyCode = 'PHP';

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'PHP', label: 'Philippine Peso', symbol: '₱' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
];

export function isCurrencyCode(value: string | null | undefined): value is CurrencyCode {
  return !!value && CURRENCY_OPTIONS.some((option) => option.code === value);
}

export function getCurrencyOption(currencyCode: CurrencyCode) {
  return CURRENCY_OPTIONS.find((option) => option.code === currencyCode) ?? CURRENCY_OPTIONS[0];
}

export function getCurrencySymbol(currencyCode: CurrencyCode) {
  return getCurrencyOption(currencyCode).symbol;
}

export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = DEFAULT_CURRENCY,
  options: FormatCurrencyOptions = {}
) {
  const minimumFractionDigits = options.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}
