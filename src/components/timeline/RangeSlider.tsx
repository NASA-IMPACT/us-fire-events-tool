import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import Calendar from 'react-calendar';
import ReactSlider from 'react-slider';
import { useEvents } from '../../contexts/EventsContext';
import { useAppState } from '../../contexts/AppStateContext';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import AdvancedFilters from '../filters/AdvancedFilters';
import { useFilters } from '../../contexts/FiltersContext';

import 'react-calendar/dist/Calendar.css';
import './rangeslider.scss';

const TimeRangeSlider = () => {
  const { timeRange, setTimeRange } = useAppState();
  const { toggleAdvancedFilters} = useFilters();
  const { events } = useEvents();

  const [showCalendar, setShowCalendar] = useState(false);
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [highlightedArea, setHighlightedArea] = useState({ left: 0, width: 0 });
  const chartRef = useRef(null);

  const { minDate, maxDate, totalRange } = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate());
    now.setHours(23, 59, 59, 999);

    const fixedStartDate = new Date(now.getFullYear(), 0, 1);
    fixedStartDate.setHours(0, 0, 0, 0);

    return {
      minDate: fixedStartDate,
      maxDate: now,
      totalRange: now.getTime() - fixedStartDate.getTime(),
      months: []
    };
  }, []);

  const HOURS_PER_BIN = 96;
  const totalHours = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60);
  const FIXED_BINS = Math.ceil(totalHours / HOURS_PER_BIN);

  const eventsByTime = useMemo(() => {
    if (!events.length) return [];

    const timeMap = new Map();
    const binSize = totalRange / FIXED_BINS;

    for (let i = 0; i < FIXED_BINS; i++) {
      timeMap.set(i, 0);
    }

    events.forEach(event => {
      const eventTime = new Date(event.object.properties.t).getTime();
      if (eventTime >= minDate.getTime() && eventTime <= maxDate.getTime()) {
        const binIndex = Math.floor((eventTime - minDate.getTime()) / binSize);
        if (binIndex >= 0 && binIndex < FIXED_BINS && timeMap.has(binIndex)) {
          timeMap.set(binIndex, timeMap.get(binIndex) + 1);
        }
      }
    });

    return Array.from(timeMap.entries()).map(([index, count]) => ({
      timestamp: minDate.getTime() + index * binSize,
      date: new Date(minDate.getTime() + index * binSize),
      count,
      isHighlighted: false
    }));
  }, [events, minDate, maxDate, totalRange, FIXED_BINS]);

  const [sliderValues, setSliderValues] = useState([50, 100]);

  useEffect(() => {
    const twoMonthsAgo = new Date(maxDate);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    twoMonthsAgo.setHours(0, 0, 0, 0);

    const startPercent = ((twoMonthsAgo.getTime() - minDate.getTime()) / totalRange) * 100;
    const endPercent = 100;

    setSliderValues([startPercent, endPercent]);
  }, [minDate, maxDate, totalRange]);

  useEffect(() => {
    const getDateFromPercent = (percent) => {
      const milliseconds = minDate.getTime() + (totalRange * (percent / 100));
      return new Date(milliseconds);
    };

    const filteredStart = getDateFromPercent(sliderValues[0]);
    const filteredEnd = getDateFromPercent(sliderValues[1]);

    if (!timeRange ||
        timeRange.start.getTime() !== filteredStart.getTime() ||
        timeRange.end.getTime() !== filteredEnd.getTime()) {
      setTimeRange({ start: filteredStart, end: filteredEnd });
    }

    if (chartRef.current) {
      const chartWidth = chartRef.current.clientWidth;
      const left = (sliderValues[0] / 100) * chartWidth;
      const width = ((sliderValues[1] - sliderValues[0]) / 100) * chartWidth;

      if (
        highlightedArea.left !== left ||
        highlightedArea.width !== width
      ) {
        setHighlightedArea({ left, width });
      }
    }
  }, [sliderValues, minDate, totalRange, setTimeRange, timeRange]);

  const chartData = useMemo(() => {
    if (!timeRange || !eventsByTime.length) return [];

    return eventsByTime.map(item => ({
      ...item,
      isHighlighted:
        item.timestamp >= timeRange.start.getTime() &&
        item.timestamp <= timeRange.end.getTime()
    }));
  }, [eventsByTime, timeRange]);

  return (
    <div className="bg-base-lightest radius-md padding-3 shadow-2 z-top" style={{ width: "800px", height: 'auto' }}>
      <div className="display-flex flex-align-center margin-bottom-1">
        <div className="font-body font-weight-regular font-sans-3xs text-base-dark">
          <span>y-axis: <span className="font-weight-bold">Number of fire events</span></span>
        </div>
        <div className="display-flex flex-align-center margin-left-4">
          <span className="font-body font-weight-regular font-sans-3xs text-base margin-right-1">Time period:</span>
          <div className="display-flex flex-align-center border-1px border-base-light padding-y-05 padding-x-1 radius-sm font-ui font-weight-regular font-sans-3xs text-base bg-white date-picker">
            {format(timeRange.start, 'MMM d, yyyy')} - {format(timeRange.end, 'MMM d, yyyy')}
            <button
              className="border-0 bg-transparent padding-1 margin-left-1"
              onClick={() => setShowCalendar(prev => !prev)}
            >
              <CalendarIcon size={16} color="#71767a" />
            </button>

            {showCalendar && (
              <div style={{ position: 'absolute', zIndex: 10, top: '-240px' }}>
                <Calendar
                  selectRange
                  onChange={(range) => {
                    if (Array.isArray(range) && range[0] && range[1]) {
                      const startPercent = ((range[0].getTime() - minDate.getTime()) / totalRange) * 100;
                      const endPercent = ((range[1].getTime() - minDate.getTime()) / totalRange) * 100;
                      setSliderValues([startPercent, endPercent]);
                      setShowCalendar(false);
                    }
                  }}
                  minDate={minDate}
                  maxDate={maxDate}
                  value={[timeRange.start, timeRange.end]}
                />
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowSearchFilters((prev) => !prev)
            toggleAdvancedFilters();
          }}
          className="usa-button usa-button--unstyled text-underline margin-left-auto font-sans-3xs"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3.54157 5.08465C5.2249 7.07696 8.33324 10.7693 8.33324 10.7693V15.3847C8.33324 15.8077 8.70824 16.1539 9.16657 16.1539H10.8332C11.2916 16.1539 11.6666 15.8077 11.6666 15.3847V10.7693C11.6666 10.7693 14.7666 7.07696 16.4499 5.08465C16.8749 4.57696 16.4832 3.84619 15.7916 3.84619H4.1999C3.50824 3.84619 3.11657 4.57696 3.54157 5.08465Z" fill="#005EA2"/>
          </svg>
          {showSearchFilters ? 'Hide advanced filters' : 'Show advanced filters'}
        </button>
      </div>

      <div style={{ height: '120px', position: 'relative' }} ref={chartRef}>
        <div
          className="highlighted-area"
          style={{
            left: highlightedArea.left,
            width: highlightedArea.width
          }}
        />
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2} barCategoryGap={0}>
            <YAxis
              width={1}
              axisLine={false}
              tickLine={false}
              style={{ transform: "translate(0px, 0)", fontSize: '10px' }}
              tick={{
                className: 'font-body font-weight-regular font-sans-3xs text-base'
              }}
            />
            <XAxis
              dataKey="date"
              scale="time"
              tickFormatter={(date) => format(date, 'MMM d')}
              tickLine={false}
              axisLine={false}
              height={30}
              tickMargin={8}
              tick={{
                className: 'font-body font-weight-regular font-sans-3xs text-base'
              }}
            />
            <Bar
              dataKey="count"
              shape={(props) => {
                const isHighlighted = props.payload.isHighlighted;
                return (
                  <rect
                    x={props.x}
                    y={props.y}
                    width={7}
                    height={props.height}
                    fill={isHighlighted ? '#005ea2' : '#A9AEB1'}
                    opacity={isHighlighted ? 1 : 0.7}
                    rx={2}
                    ry={2}
                    className="custom-bar-shape"
                  />
                );
              }}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ReactSlider
        className="range-slider"
        thumbClassName="thumb"
        trackClassName="track"
        value={sliderValues}
        onChange={setSliderValues}
        min={0}
        max={100}
        ariaLabel={['Minimum date', 'Maximum date']}
        pearling
        minDistance={5}
      />

      {showSearchFilters && (
        <div className="margin-top-2">
          <AdvancedFilters />
        </div>
      )}

    </div>
  );
};

export default TimeRangeSlider;