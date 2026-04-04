export interface SettingsDto {
  startYear: number;
  startMonth: number;
  currency: string;
}

export const CURRENCIES = [
  { code: '£',      symbol: '£',    flag: '🇬🇧', iso: 'GBP' },
  { code: '$',      symbol: '$',    flag: '🇺🇸', iso: 'USD' },
  { code: '€',      symbol: '€',    flag: '🇪🇺', iso: 'EUR' },
  { code: '¥',      symbol: '¥',    flag: '🇯🇵', iso: 'JPY' },
  { code: 'Fr',     symbol: 'Fr',   flag: '🇨🇭', iso: 'CHF' },
  { code: 'CA$',    symbol: '$',    flag: '🇨🇦', iso: 'CAD' },
  { code: 'A$',     symbol: '$',    flag: '🇦🇺', iso: 'AUD' },
  { code: '₹',      symbol: '₹',    flag: '🇮🇳', iso: 'INR' },
  { code: 'kr-sek', symbol: 'kr',   flag: '🇸🇪', iso: 'SEK' },
  { code: 'kr-nok', symbol: 'kr',   flag: '🇳🇴', iso: 'NOK' },
];

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code;
}
