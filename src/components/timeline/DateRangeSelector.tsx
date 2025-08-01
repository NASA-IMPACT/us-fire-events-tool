import { useState, useMemo, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useFireExplorerStore } from '@/state/useFireExplorerStore';
import { Button } from '@trussworks/react-uswds';
import Calendar from 'react-calendar';

import AdvancedFilters from '../filters/AdvancedFilters';

import 'react-calendar/dist/Calendar.css';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const THREE_MONTHS = 90 * DAY;
const SIX_MONTHS = 180 * DAY;
const YEAR = 365 * DAY;

const PRESET_OPTIONS = [
  { label: '12 hours', value: 12 * HOUR },
  { label: '1 week', value: WEEK },
  { label: '1 month', value: MONTH },
  { label: '3 months', value: THREE_MONTHS },
  { label: '6 months', value: SIX_MONTHS },
  { label: '12 months', value: YEAR },
];

const DateRangeSelector = () => {
  const setTimeRange = useFireExplorerStore.use.setTimeRange();
  const showAdvancedFilters = useFireExplorerStore.use.showAdvancedFilters();
  const toggleAdvancedFilters =
    useFireExplorerStore.use.toggleAdvancedFilters();

  const [selectedDuration, setSelectedDuration] = useState(PRESET_OPTIONS[2]);
  const [priorToDate, setPriorToDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const computedTimeRange = useMemo(() => {
    const end = new Date(priorToDate.setHours(23, 59, 59, 999));
    const start = new Date(end.getTime() - selectedDuration.value);
    return { start, end };
  }, [priorToDate, selectedDuration]);

  useEffect(() => {
    setTimeRange(computedTimeRange);
  }, [computedTimeRange, setTimeRange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  return (
    <div
      className="bg-white radius-md padding-y-2 padding-x-3 shadow-2 z-top"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'nowrap',
          gap: '0.75rem',
          width: '100%',
          whiteSpace: 'nowrap',
        }}
      >
        <span className="font-sans-3xs text-base-dark font-weight-bold">
          Find fire events within
        </span>

        <select
          className="usa-select margin-top-0"
          style={{ minWidth: '120px', height: '2.5rem' }}
          value={selectedDuration.label}
          onChange={(e) => {
            const newOption = PRESET_OPTIONS.find(
              (opt) => opt.label === e.target.value
            );
            if (newOption) setSelectedDuration(newOption);
          }}
        >
          {PRESET_OPTIONS.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>

        <span className="font-sans-3xs text-base-dark">prior to</span>

        <div
          className="display-flex flex-align-center border-1px border-base-light padding-y-05 padding-x-1 radius-sm bg-white date-picker margin-right-10"
          style={{
            position: 'relative',
            height: '2.5rem',
          }}
        >
          <button
            className="border-0 bg-transparent padding-1 display-flex flex-align-center"
            onClick={() => setShowCalendar((prev) => !prev)}
            style={{ cursor: 'pointer' }}
          >
            <span className="font-sans-3xs text-base-dark">
              {format(priorToDate, 'MMM d, yyyy')}
            </span>
            <CalendarIcon size={16} color="#71767a" className="margin-left-1" />
          </button>

          {showCalendar && (
            <div
              ref={calendarRef}
              style={{
                position: 'absolute',
                zIndex: 999,
                top: '-270px',
                right: 0,
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              }}
            >
              <Calendar
                onChange={(date) => {
                  if (date instanceof Date) {
                    setPriorToDate(date);
                    setShowCalendar(false);
                  }
                }}
                value={priorToDate}
                minDate={new Date(new Date().getFullYear(), 0, 1)}
                maxDate={new Date()}
              />
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={toggleAdvancedFilters}
          unstyled
          className="text-underline font-sans-3xs usa-button--unstyled"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            style={{ verticalAlign: 'middle', marginRight: '4px' }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.54157 5.08465C5.2249 7.07696 8.33324 10.7693 8.33324 10.7693V15.3847C8.33324 15.8077 8.70824 16.1539 9.16657 16.1539H10.8332C11.2916 16.1539 11.6666 15.8077 11.6666 15.3847V10.7693C11.6666 10.7693 14.7666 7.07696 16.4499 5.08465C16.8749 4.57696 16.4832 3.84619 15.7916 3.84619H4.1999C3.50824 3.84619 3.11657 4.57696 3.54157 5.08465Z"
              fill="#005EA2"
            />
          </svg>
          {showAdvancedFilters
            ? 'Hide advanced filters'
            : 'Show advanced filters'}
        </Button>
      </div>

      {showAdvancedFilters && (
        <div className="margin-top-2" style={{ width: '100%' }}>
          <AdvancedFilters />
        </div>
      )}
    </div>
  );
};

export default DateRangeSelector;
