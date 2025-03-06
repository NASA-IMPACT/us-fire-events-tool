import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { EventFeature } from '../../types';
import { Calendar } from 'lucide-react';
import ReactSlider from 'react-slider';

interface RangeSliderProps {
  events: EventFeature[];
  onRangeChange?: (range: { start: Date; end: Date }) => void;
}

const styles = `
  .range-slider {
    width: 100%;
    height: 24px;
    margin-top: 12px;
    position: relative;
  }

  .range-slider .track {
    top: 8px;
    height: 4px;
    background: #d9d9d9;
    border-radius: 2px;
  }

  .range-slider .track-1 {
    background: #1a6baa;
  }

  .range-slider .thumb {
    width: 16px;
    height: 16px;
    cursor: pointer;
    background: #fff;
    border-radius: 50%;
    border: 2px solid #1a6baa;
    top: 2px;
    outline: none;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  }

  .range-slider .thumb:hover {
    box-shadow: 0 0 0 2px rgba(26, 107, 170, 0.3);
  }

  .chart-container {
    height: 120px;
    width: 100%;
    position: relative;
    margin-bottom: 20px;
  }

  .bar {
    position: absolute;
    bottom: 30px; /* Space for x-axis labels */
    background-color: #d9d9d9;
    width: 12px;
    border-radius: 2px 2px 0 0;
  }

  .bar.highlighted {
    background-color: #1a6baa;
  }

  .x-axis {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 30px;
    display: flex;
    justify-content: space-between;
    padding: 0 10px;
  }

  .x-axis-label {
    font-size: 14px;
    color: #71767a;
    position: relative;
    text-align: center;
  }

  .x-axis-label::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    height: 5px;
    width: 1px;
    background-color: #d9d9d9;
  }

  .x-axis-tick {
    position: absolute;
    bottom: 30px;
    width: 1px;
    background-color: #d9d9d9;
    z-index: 0;
  }

  .highlighted-area {
    position: absolute;
    background-color: rgba(26, 107, 170, 0.1);
    bottom: 30px;
    top: 0;
    z-index: 1;
  }
`;

const RangeSlider: React.FC<RangeSliderProps> = ({ events, onRangeChange }) => {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(),
    end: new Date()
  });

  const [highlightedArea, setHighlightedArea] = useState({ left: 0, width: 0 });
  const chartRef = useRef<HTMLDivElement>(null);

  const { minDate, maxDate, totalRange, months } = useMemo(() => {
    if (!events.length) {
      const now = new Date();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      const monthLabels = [];
      const currentDate = new Date(sixMonthsAgo);
      while (currentDate <= now) {
        monthLabels.push(format(currentDate, 'MMM'));
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return {
        minDate: sixMonthsAgo,
        maxDate: now,
        totalRange: now.getTime() - sixMonthsAgo.getTime(),
        months: monthLabels
      };
    }

    const timestamps = events.map(e => new Date(e.properties.t).getTime());
    const min = new Date(Math.min(...timestamps));
    const max = new Date(Math.max(...timestamps));

    const extendedMin = new Date(min);
    extendedMin.setDate(1);
    extendedMin.setHours(0, 0, 0, 0);

    const extendedMax = new Date(max);
    extendedMax.setMonth(extendedMax.getMonth() + 1);
    extendedMax.setDate(0);
    extendedMax.setHours(23, 59, 59, 999);

    const monthLabels = [];
    const currentDate = new Date(extendedMin);
    while (currentDate <= extendedMax) {
      monthLabels.push(format(currentDate, 'MMM'));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return {
      minDate: extendedMin,
      maxDate: extendedMax,
      totalRange: extendedMax.getTime() - extendedMin.getTime(),
      months: monthLabels
    };
  }, [events]);

  const eventsByDay = useMemo(() => {
    if (!events.length) return [];

    const dayMap = new Map();

    const startDate = new Date(minDate);
    const endDate = new Date(maxDate);

    const currentDay = new Date(startDate);
    while (currentDay <= endDate) {
      const dayKey = currentDay.getTime();
      dayMap.set(dayKey, 0);
      currentDay.setDate(currentDay.getDate() + 1);
    }

    events.forEach(event => {
      const date = new Date(event.properties.t);
      date.setHours(0, 0, 0, 0);
      const dayKey = date.getTime();

      if (dayMap.has(dayKey)) {
        dayMap.set(dayKey, dayMap.get(dayKey) + 1);
      }
    });

    return Array.from(dayMap.entries()).map(([timestamp, count]) => ({
      date: new Date(timestamp),
      timestamp: Number(timestamp),
      count: Number(count)
    }));
  }, [events, minDate, maxDate]);

  const [sliderValues, setSliderValues] = useState([25, 40]);

  useEffect(() => {
    if (!chartRef.current) return;

    const getDateFromPercent = (percent: number) => {
      const milliseconds = minDate.getTime() + (totalRange * (percent / 100));
      return new Date(milliseconds);
    };

    const start = getDateFromPercent(sliderValues[0]);
    const end = getDateFromPercent(sliderValues[1]);

    setDateRange({ start, end });

    const chartWidth = chartRef.current.clientWidth;
    const left = (sliderValues[0] / 100) * chartWidth;
    const width = ((sliderValues[1] - sliderValues[0]) / 100) * chartWidth;
    setHighlightedArea({ left, width });

    if (onRangeChange) {
      onRangeChange({ start, end });
    }
  }, [sliderValues, minDate, maxDate, totalRange, onRangeChange]);

  useEffect(() => {
    if (events.length > 0 && chartRef.current) {
      setSliderValues([25, 40]);
    }
  }, [events.length, chartRef]);

  const renderBars = () => {
    if (!chartRef.current || eventsByDay.length === 0) return null;

    const chartWidth = chartRef.current.clientWidth;
    const maxHeight = 90;
    const barWidth = Math.max(2, chartWidth / eventsByDay.length);

    const maxCount = Math.max(...eventsByDay.map(day => day.count));

    return eventsByDay.map((day, index) => {
      const left = (index / eventsByDay.length) * chartWidth;
      const height = maxCount > 0 ? (day.count / maxCount) * maxHeight : 0;

      const isHighlighted = day.timestamp >= dateRange.start.getTime() &&
                            day.timestamp <= dateRange.end.getTime();

      return (
        <div
          key={day.timestamp}
          className={`bar ${isHighlighted ? 'highlighted' : ''}`}
          style={{
            left: `${left}px`,
            height: `${height}px`,
            width: `${barWidth}px`
          }}
        />
      );
    });
  };

  return (
    <div className="bg-white border-1px border-base-lighter padding-2 radius-md">
      <style>{styles}</style>

      <div className="display-flex flex-align-center margin-bottom-2">
        <div className="font-sans-sm text-base margin-right-2">y-axis: Number of fire events</div>
        <div className="font-sans-sm text-base margin-right-2">Time period:</div>
        <div className="display-flex flex-align-center border-1px border-base padding-1 font-sans-sm">
          {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
        </div>
        <button className="border-0 bg-transparent padding-1 margin-left-1">
          <Calendar size={16} color="#71767a" />
        </button>
      </div>

      <div className="chart-container" ref={chartRef}>
        {renderBars()}

        <div
          className="highlighted-area"
          style={{
            left: highlightedArea.left,
            width: highlightedArea.width
          }}
        />

        <div className="x-axis">
          {months.map((month, index) => (
            <div key={index} className="x-axis-label">{month}</div>
          ))}
        </div>

        {chartRef.current && Array.from({ length: Math.floor(chartRef.current.clientWidth / 30) }).map((_, index) => (
          <div
            key={`tick-${index}`}
            className="x-axis-tick"
            style={{
              left: `${(index * 30) + 15}px`,
              height: `${index % 3 === 0 ? 10 : 5}px`
            }}
          />
        ))}
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
    </div>
  );
};

export default RangeSlider;