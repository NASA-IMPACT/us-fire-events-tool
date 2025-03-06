import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { EventFeature } from '../../types';
import { Play, RotateCcw } from 'lucide-react';
import ReactSlider from 'react-slider';

interface DetailedTimeChartProps {
  events: EventFeature[];
  onRangeChange?: (range: { start: Date; end: Date }) => void;
  initialProperty?: string;
}

const CHART_PROPERTIES = [
  { value: 'farea', label: 'Fire area (km²)', unit: 'km²', formatter: (v: number) => `${v.toFixed(2)} km²` },
  { value: 'fperim', label: 'Fire Perimeter (km)', unit: 'km', formatter: (v: number) => `${v.toFixed(2)} km` },
  { value: 'meanfrp', label: 'Mean Fire Radiative Power (MW)', unit: 'MW', formatter: (v: number) => `${v.toFixed(2)} MW` },
  { value: 'duration', label: 'Duration (days)', unit: 'days', formatter: (v: number) => `${v.toFixed(0)} days` },
  { value: 'n_pixels', label: 'Number of Pixels', unit: '', formatter: (v: number) => v.toString() }
];

const styles = `
  .detailed-chart-container {
    max-width: 800px;
    margin: 0 auto;
    background-color: white;
    border: 1px solid #dfe1e2;
    border-radius: 8px;
    padding: 16px;
    font-family: 'Source Sans Pro', 'Helvetica Neue', Helvetica, Roboto, Arial, sans-serif;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .property-selector {
    position: relative;
    width: 280px;
  }

  .property-select {
    appearance: none;
    width: 100%;
    padding: 8px 12px;
    font-size: 14px;
    border: 1px solid #dfe1e2;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
  }

  .selector-arrows {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .chart-area {
    height: 180px;
    position: relative;
    margin-bottom: 40px;
  }

  .y-axis {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 60px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 5px 0;
  }

  .y-axis-label {
    font-size: 12px;
    color: #71767a;
    text-align: right;
    padding-right: 5px;
  }

  .chart-grid {
    position: absolute;
    left: 60px;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .grid-line {
    width: 100%;
    height: 1px;
    background-color: #dfe1e2;
  }

  .chart-visualization {
    position: absolute;
    left: 60px;
    right: 0;
    top: 0;
    bottom: 40px;
  }

  .area-path {
    fill: rgba(26, 107, 170, 0.2);
    stroke: none;
  }

  .line-path {
    fill: none;
    stroke: #1a6baa;
    stroke-width: 2;
  }

  .x-axis {
    position: absolute;
    left: 60px;
    right: 0;
    bottom: 0;
    height: 40px;
  }

  .x-axis-grid {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 180px;
    pointer-events: none;
  }

  .x-grid-line {
    position: absolute;
    top: 0;
    height: 100%;
    width: 1px;
    background-color: #dfe1e2;
  }

  .x-axis-label {
    position: absolute;
    bottom: 0;
    transform: translateX(-50%);
    font-size: 12px;
    color: #71767a;
  }

  .range-slider {
    width: 100%;
    height: 24px;
    margin-top: 20px;
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

  .time-indicator {
    position: absolute;
    width: 2px;
    background-color: #1a6baa;
    top: 0;
    bottom: 40px;
    pointer-events: none;
    z-index: 5;
  }

  .time-point {
    position: absolute;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: white;
    border: 2px solid #1a6baa;
    transform: translate(-50%, 50%);
    bottom: 0;
    z-index: 6;
  }

  .tooltip {
    position: absolute;
    background-color: white;
    border: 1px solid #dfe1e2;
    border-radius: 4px;
    padding: 8px 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    pointer-events: none;
    z-index: 10;
    max-width: 180px;
  }

  .tooltip-date {
    font-size: 12px;
    color: #71767a;
    margin-bottom: 4px;
  }

  .tooltip-value {
    font-size: 14px;
    font-weight: 600;
    color: #1b1b1b;
  }

  .control-buttons {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    gap: 12px;
  }

  .control-button {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    background-color: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #1b1b1b;
  }

  .control-button:hover {
    background-color: rgba(0,0,0,0.05);
  }
`;

const DetailedTimeChart: React.FC<DetailedTimeChartProps> = ({
  events,
  onRangeChange,
  initialProperty = 'farea'
}) => {
  const [selectedProperty, setSelectedProperty] = useState(initialProperty);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ date: Date; value: number; x: number; y: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [sliderRange, setSliderRange] = useState([0, 100]);
  const [timeIndicator, setTimeIndicator] = useState<number | null>(null);

  const processedData = useMemo(() => {
    if (!events.length) return { timeSeriesData: [], minDate: new Date(), maxDate: new Date(), min: 0, max: 0 };

    const propertyData = events
      .map(event => ({
        date: new Date(event.properties.t),
        value: event.properties[selectedProperty] || 0
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const dates = propertyData.map(d => d.date.getTime());
    const values = propertyData.map(d => d.value);

    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const valuePadding = (maxValue - minValue) * 0.1;
    const min = Math.max(0, minValue - valuePadding);
    const max = maxValue + valuePadding;

    return {
      timeSeriesData: propertyData,
      minDate,
      maxDate,
      min,
      max
    };
  }, [events, selectedProperty]);

  const yAxisLabels = useMemo(() => {
    const { min, max } = processedData;
    const step = (max - min) / 4;

    return [
      max,
      min + step * 3,
      min + step * 2,
      min + step,
      min
    ].map(value => Math.round(value));
  }, [processedData]);

  const xAxisElements = useMemo(() => {
    if (processedData.timeSeriesData.length === 0) return { labels: [], gridLines: [] };

    const { minDate, maxDate } = processedData;
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

    let interval = 1;
    if (totalDays > 14) interval = 2;
    if (totalDays > 30) interval = 5;
    if (totalDays > 60) interval = 10;

    const labels = [];
    const gridLines = [];

    const startTime = minDate.getTime();
    const timeRange = maxDate.getTime() - startTime;

    for (let i = 0; i <= totalDays; i += interval) {
      const date = new Date(minDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const position = ((date.getTime() - startTime) / timeRange) * 100;

      labels.push({
        date,
        position,
        label: format(date, i === 0 || i === totalDays ? 'HH:mm MMM d, yyyy' : 'd')
      });

      gridLines.push({
        position,
        isMajor: i % (interval * 2) === 0
      });
    }

    return { labels, gridLines };
  }, [processedData]);

  const chartPaths = useMemo(() => {
    if (processedData.timeSeriesData.length === 0 || !chartRef.current)
      return { areaPath: '', linePath: '', points: [] };

    const { timeSeriesData, minDate, maxDate, min, max } = processedData;
    const chartWidth = chartRef.current.offsetWidth - 60;
    const chartHeight = 180 - 40;

    const totalTime = maxDate.getTime() - minDate.getTime();
    const valueRange = max - min;

    const points = timeSeriesData.map(point => {
      const x = ((point.date.getTime() - minDate.getTime()) / totalTime) * chartWidth;
      const y = chartHeight - ((point.value - min) / valueRange) * chartHeight;
      return { x, y, date: point.date, value: point.value };
    });

    let linePath = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L${points[i].x},${points[i].y}`;
    }

    const areaPath = `${linePath} L${points[points.length-1].x},${chartHeight} L${points[0].x},${chartHeight} Z`;

    return { areaPath, linePath, points };
  }, [processedData, chartRef]);

  const handleChartHover = (e: React.MouseEvent) => {
    if (!chartRef.current || processedData.timeSeriesData.length === 0) return;

    const chartRect = chartRef.current.getBoundingClientRect();
    const chartX = e.clientX - chartRect.left - 60;

    const chartWidth = chartRect.width - 60;
    const { minDate, maxDate } = processedData;
    const totalTime = maxDate.getTime() - minDate.getTime();

    const relativePosition = Math.max(0, Math.min(chartX / chartWidth, 1));
    const timestamp = minDate.getTime() + totalTime * relativePosition;

    const { points } = chartPaths;
    if (!points.length) return;

    let closestPoint = points[0];
    let minDistance = Math.abs(points[0].date.getTime() - timestamp);

    for (let i = 1; i < points.length; i++) {
      const distance = Math.abs(points[i].date.getTime() - timestamp);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = points[i];
      }
    }

    setTimeIndicator(closestPoint.x);
    setHoveredPoint({
      date: closestPoint.date,
      value: closestPoint.value,
      x: closestPoint.x + 60,
      y: closestPoint.y
    });
  };

  const handleChartLeave = () => {
    setTimeIndicator(null);
    setHoveredPoint(null);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setSliderRange([0, 100]);

    if (onRangeChange && processedData.timeSeriesData.length > 0) {
      const { minDate, maxDate } = processedData;
      onRangeChange({ start: minDate, end: maxDate });
    }
  };

  useEffect(() => {
    if (processedData.timeSeriesData.length === 0 || !onRangeChange) return;

    const { minDate, maxDate } = processedData;
    const totalTime = maxDate.getTime() - minDate.getTime();

    const startTime = minDate.getTime() + (totalTime * sliderRange[0] / 100);
    const endTime = minDate.getTime() + (totalTime * sliderRange[1] / 100);

    onRangeChange({
      start: new Date(startTime),
      end: new Date(endTime)
    });
  }, [sliderRange, processedData, onRangeChange]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSliderRange(prev => {
        const increment = 1;
        const newEnd = Math.min(prev[1] + increment, 100);

        if (newEnd >= 100) {
          setIsPlaying(false);
          clearInterval(interval);
          return prev;
        }

        return [prev[0], newEnd];
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const selectedPropertyDetails = CHART_PROPERTIES.find(p => p.value === selectedProperty) || CHART_PROPERTIES[0];

  return (
    <div className="detailed-chart-container">
      <style>{styles}</style>

      <div className="header">
        <div className="property-selector">
          <div>y-axis:</div>
          <select
            className="property-select"
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
          >
            {CHART_PROPERTIES.map(prop => (
              <option key={prop.value} value={prop.value}>
                {prop.label}
              </option>
            ))}
          </select>
          <div className="selector-arrows">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="#1B1B1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="control-buttons">
          <button className="control-button" onClick={togglePlay}>
            <Play size={18} />
          </button>
          <button className="control-button" onClick={handleReset}>
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      <div
        className="chart-area"
        ref={chartRef}
        onMouseMove={handleChartHover}
        onMouseLeave={handleChartLeave}
      >
        <div className="y-axis">
          {yAxisLabels.map((label, index) => (
            <div key={index} className="y-axis-label">
              {label}
            </div>
          ))}
        </div>

        <div className="chart-grid">
          {yAxisLabels.map((_, index) => (
            <div key={index} className="grid-line" />
          ))}
        </div>

        <div className="x-axis-grid">
          {xAxisElements.gridLines.map((line, index) => (
            <div
              key={index}
              className="x-grid-line"
              style={{
                left: `${line.position}%`,
                opacity: line.isMajor ? 0.8 : 0.4
              }}
            />
          ))}
        </div>

        <div className="chart-visualization">
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            <path
              d={chartPaths.areaPath}
              className="area-path"
            />
            <path
              d={chartPaths.linePath}
              className="line-path"
            />
          </svg>

          {timeIndicator !== null && (
            <>
              <div
                className="time-indicator"
                style={{ left: `${timeIndicator + 60}px` }}
              />
              <div
                className="time-point"
                style={{ left: `${timeIndicator + 60}px` }}
              />
            </>
          )}
        </div>

        <div className="x-axis">
          {xAxisElements.labels.map((item, index) => (
            <div
              key={index}
              className="x-axis-label"
              style={{ left: `${item.position}%` }}
            >
              {item.label}
            </div>
          ))}
        </div>

        {hoveredPoint && (
          <div
            className="tooltip"
            style={{
              left: hoveredPoint.x + 20,
              top: hoveredPoint.y - 40
            }}
          >
            <div className="tooltip-date">
              {format(hoveredPoint.date, 'HH:mm MMM d, yyyy')}
            </div>
            <div className="tooltip-value">
              {selectedPropertyDetails.formatter(hoveredPoint.value)}
            </div>
          </div>
        )}
      </div>

      <ReactSlider
        className="range-slider"
        thumbClassName="thumb"
        trackClassName="track"
        value={sliderRange}
        onChange={setSliderRange}
        min={0}
        max={100}
        ariaLabel={['Minimum date', 'Maximum date']}
        pearling
        minDistance={5}
      />
    </div>
  );
};

export default DetailedTimeChart;