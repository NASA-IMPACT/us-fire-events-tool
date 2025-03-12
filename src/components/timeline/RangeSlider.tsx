import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import ReactSlider from 'react-slider';
import { useEvents } from '../../contexts/EventsContext';
import { useAppState } from '../../contexts/AppStateContext';
import { BarChart, Bar, ResponsiveContainer, XAxis } from 'recharts';

const TimeRangeSlider = () => {
  const { timeRange, setTimeRange } = useAppState();
  const { events } = useEvents();

  const [highlightedArea, setHighlightedArea] = useState({ left: 0, width: 0 });
  const chartRef = useRef(null);

  const { minDate, maxDate, totalRange } = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const fixedStartDate = new Date();
    fixedStartDate.setDate(now.getDate() - 20);
    fixedStartDate.setHours(0, 0, 0, 0);

    return {
      minDate: fixedStartDate,
      maxDate: now,
      totalRange: now.getTime() - fixedStartDate.getTime(),
      months: []
    };
  }, []);

  const HOURS_PER_BIN = 12;
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
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(maxDate.getDate() - 10);
    tenDaysAgo.setHours(0, 0, 0, 0);

    const startPercent = ((tenDaysAgo.getTime() - minDate.getTime()) / totalRange) * 100;
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

      setHighlightedArea({ left, width });
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
    <div className="position-absolute bottom-3 left-3 bg-white radius-md padding-3 shadow-2 z-top" style={{ width: "800px" }}>
      <style>
        {`
          .range-slider {
            width: 100%;
            height: 24px;
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

          .highlighted-area {
            position: absolute;
            background-color: rgba(26, 107, 170, 0.1);
            height: 90px;
            z-index: 1;
          }
        `}
      </style>

      <div className="display-flex flex-align-center flex-justify flex-row margin-bottom-1">
        <div className="font-sans-sm text-base-dark">
          <span>y-axis: Number of fire events</span>
          <span className="margin-left-2">Time period:</span>
        </div>
        <div className="display-flex flex-align-center border-1px border-base-light padding-y-05 padding-x-2 radius-sm font-sans-sm">
          {format(timeRange.start, 'MMM d, yyyy')} - {format(timeRange.end, 'MMM d, yyyy')}
          <button className="border-0 bg-transparent padding-1 margin-left-1">
            <Calendar size={16} color="#71767a" />
          </button>
        </div>
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
          <BarChart data={chartData} barGap={0} barCategoryGap={0}>
            <XAxis
              dataKey="date"
              scale="time"
              tickFormatter={(date) => format(date, 'MMM d')}
              tickLine={false}
              axisLine={false}
              height={30}
              tickMargin={8}
              style={{
                fontSize: '14px',
                color: '#71767a',
                marginTop: '50px'
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
                    width={props.width}
                    height={props.height}
                    fill={isHighlighted ? '#1a6baa' : '#cccccc'}
                    opacity={isHighlighted ? 1 : 0.5}
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
    </div>
  );
};

export default TimeRangeSlider;