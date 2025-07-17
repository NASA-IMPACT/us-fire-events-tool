const createStableDate = (date: Date | string): Date => {
  const stableDate = new Date(date);
  stableDate.setHours(0, 0, 0, 0);
  return stableDate;
};

const getCurrentYearStart = (): Date => {
  const now = new Date();
  return createStableDate(new Date(now.getFullYear(), 0, 1));
};

const getToday = (): Date => {
  return createStableDate(new Date());
};

const getTodayEndOfDay = (): Date => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
};

const getMonthsAgo = (months: number, fromDate?: Date): Date => {
  const baseDate = fromDate || getTodayEndOfDay();
  const monthsAgo = new Date(baseDate);
  monthsAgo.setMonth(monthsAgo.getMonth() - months);
  monthsAgo.setHours(0, 0, 0, 0);
  return monthsAgo;
};

const getTwoMonthsAgo = (fromDate?: Date): Date => {
  return getMonthsAgo(2, fromDate);
};

const getDefaultTimeRange = (fromDate?: Date) => {
  const end = fromDate || getTodayEndOfDay();
  const start = getTwoMonthsAgo(end);
  return { start, end };
};

export {
  createStableDate,
  getCurrentYearStart,
  getToday,
  getTodayEndOfDay,
  getMonthsAgo,
  getTwoMonthsAgo,
  getDefaultTimeRange,
};
