const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const THREE_MONTHS = 90 * DAY;
const SIX_MONTHS = 180 * DAY;
const YEAR = 365 * DAY;

export const DATE_PRESET_OPTIONS = [
  { label: '12 hours', value: 12 * HOUR },
  { label: '1 week', value: WEEK },
  { label: '1 month', value: MONTH },
  { label: '3 months', value: THREE_MONTHS },
  { label: '6 months', value: SIX_MONTHS },
  { label: '12 months', value: YEAR },
];
