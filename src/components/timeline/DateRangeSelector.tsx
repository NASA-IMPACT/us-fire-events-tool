import { useState, useMemo, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useFireExplorerStore } from '@/state/useFireExplorerStore';
import { Button, Icon } from '@trussworks/react-uswds';
import Calendar from 'react-calendar';
import { DATE_PRESET_OPTIONS } from '@/constants';
import AdvancedFilters from '../filters/AdvancedFilters';

import 'react-calendar/dist/Calendar.css';
import './calendar-mobile-overrides.scss';

const DateRangeSelector = () => {
  const timeRange = useFireExplorerStore.use.timeRange();
  const setTimeRange = useFireExplorerStore.use.setTimeRange();
  const showAdvancedFilters = useFireExplorerStore.use.showAdvancedFilters();
  const toggleAdvancedFilters =
    useFireExplorerStore.use.toggleAdvancedFilters();

  const selectedDuration = useFireExplorerStore.use.selectedDuration();
  const setSelectedDuration = useFireExplorerStore.use.setSelectedDuration();

  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const priorToDate = useMemo(() => new Date(timeRange.end), [timeRange.end]);

  const computedTimeRange = useMemo(() => {
    const end = new Date(priorToDate.setHours(23, 59, 59, 999));
    const start = new Date(end.getTime() - selectedDuration.value);
    return { start, end };
  }, [priorToDate, selectedDuration]);

  useEffect(() => {
    if (
      timeRange.start.getTime() !== computedTimeRange.start.getTime() ||
      timeRange.end.getTime() !== computedTimeRange.end.getTime()
    ) {
      setTimeRange(computedTimeRange);
    }
  }, [computedTimeRange, setTimeRange, timeRange.start, timeRange.end]);

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
    <div className="bg-white radius-md mobile-lg:padding-y-2 padding-y-3 padding-x-3 shadow-2 z-top text-no-wrap">
      <div className="grid-row grid-gap-lg flex-no-wrap  ">
        <div
          className=" grid-col display-flex flex-column mobile-lg:flex-row  "
          style={{
            gap: '0.75rem',
          }}
        >
          <div className="display-flex flex-align-center mobile-lg:margin-right-2 ">
            <span className="font-sans-3xs text-base-dark font-weight-bold margin-right-2">
              Find fire events within
            </span>

            <select
              className="usa-select margin-top-0"
              style={{ minWidth: '120px', height: '2.5rem' }}
              value={selectedDuration.label}
              onChange={(e) => {
                const newOption = DATE_PRESET_OPTIONS.find(
                  (opt) => opt.label === e.target.value
                );
                if (newOption) setSelectedDuration(newOption);
              }}
            >
              {DATE_PRESET_OPTIONS.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="display-inline-flex flex-align-center flex-justify">
            <span className="font-sans-3xs text-base-dark margin-right-2">
              prior to
            </span>

            <div
              className="display-flex flex-align-center border-1px border-base-light padding-y-05 padding-x-1 radius-sm bg-white date-picker "
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
                <CalendarIcon
                  size={16}
                  color="#71767a"
                  className="margin-left-1"
                />
              </button>

              {showCalendar && (
                <div ref={calendarRef} className="calendar-override">
                  <Calendar
                    onChange={(date) => {
                      if (date instanceof Date) {
                        const end = new Date(date.setHours(23, 59, 59, 999));
                        const start = new Date(
                          end.getTime() - selectedDuration.value
                        );
                        setTimeRange({ start, end });
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
          </div>
        </div>
        <div className="grid-col-auto">
          <div className="mobile-lg:display-none ">
            <Button
              type="button"
              onClick={toggleAdvancedFilters}
              className={` font-sans-3xs ${
                showAdvancedFilters
                  ? 'usa-button'
                  : 'usa-button--base bg-base-light '
              }`}
            >
              <Icon.FilterAlt />
              <p className="mobile-lg:display-inline display-none">
                {showAdvancedFilters
                  ? 'Hide advanced filters'
                  : 'Show advanced filters'}
              </p>
            </Button>
          </div>
          <div className="mobile-lg:display-block display-none ">
            <Button
              type="button"
              onClick={toggleAdvancedFilters}
              unstyled
              className="text-underline font-sans-3xs usa-button--unstyled"
            >
              <Icon.FilterAlt />
              <p className="mobile-lg:display-inline display-none">
                {showAdvancedFilters
                  ? 'Hide advanced filters'
                  : 'Show advanced filters'}
              </p>
            </Button>
          </div>
        </div>
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
