import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import ReactSlider from 'react-slider';
import { Loader2, Pause, Play, RotateCw, Video, X } from 'lucide-react';
import { useEvents } from '../../contexts/EventsContext';
import { useAppState } from '../../contexts/AppStateContext';
import {
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis
} from 'recharts';
import useRecordVideo from './useVideoRecording';
import { Props as BarProps } from 'recharts/types/cartesian/Bar';

const yAxisOptions = ['Fire area (km²)', 'Mean FRP', 'Duration (days)'];

const DetailedTimeChart = () => {
  const { selectedEventId, firePerimeters } = useEvents();
  const {
    windLayerType,
    setWindLayerType,
    setTimeRange,
    show3DMap,
    toggle3DMap,
    exportFormat,
    setExportFormat,
    isRecording: globalIsRecording,
    setIsRecording
  } = useAppState();

  const [sliderValue, setSliderValue] = useState(0);
  const [currentPerimeter, setCurrentPerimeter] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timePointIndexes, setTimePointIndexes] = useState([]);
  const [baseFrameDelay, setBaseFrameDelay] = useState(500);
  const [selectedYAxis, setSelectedYAxis] = useState(yAxisOptions[0]);

  const chartRef = useRef(null);
  const sliderContainerRef = useRef(null);
  const animationRef = useRef(null);
  const animationCompleteRef = useRef(false);

  const getCurrentPerimeter = () => currentPerimeter;

  const resetAnimation = useCallback(() => {
    animationCompleteRef.current = false;
    setIsPlaying(false);
    setSliderValue(timePointIndexes[0] || 0);
  }, [timePointIndexes]);

  const {
    isRecording,
    isPreparingToRecord,
    isExporting,
    speedMultiplier,
    captureFrame,
    handleExportVideo,
    stopRecording,
    isRecordingRef,
    getWebMBlob
  } = useRecordVideo({
    show3DMap,
    toggle3DMap,
    windLayerType,
    setWindLayerType,
    resetAnimation,
    setIsPlaying,
    getCurrentPerimeter,
    animationCompleteRef,
    baseFrameDelay,
    exportFormat,
    setExportFormat,
    setIsRecording
  });

  const {
    minDate,
    totalRange,
    perimeterData,
    timePoints,
    chartData
  } = useMemo(() => {
    if (!firePerimeters || firePerimeters.features.length === 0) {
      return {
        minDate: new Date(),
        maxDate: new Date(),
        totalRange: 0,
        perimeterData: [],
        timePoints: [],
        chartData: []
      };
    }

    const sorted = [...firePerimeters.features].sort((a, b) => {
      const ta = new Date(a.properties.primarykey.split('|')[2]).getTime();
      const tb = new Date(b.properties.primarykey.split('|')[2]).getTime();
      return ta - tb;
    });

    const data = sorted.map((f) => {
      const t = new Date(f.properties.primarykey.split('|')[2]);
      return {
        time: t,
        timestamp: t.getTime(),
        area: f.properties.farea || 0,
        meanFrp: f.properties.meanfrp || 0,
        duration: f.properties.duration || 0,
        properties: f.properties
      };
    });

    const timePoints = data.map((d) => ({
      time: d.time,
      timestamp: d.timestamp
    }));

    const chartData = data.map((d) => ({
      ...d,
      date: format(d.time, 'MMM d, HH:mm'),
      name: format(d.time, 'MMM d, yyyy HH:mm')
    }));

    return {
      minDate: data[0].time,
      maxDate: data[data.length - 1].time,
      totalRange: data[data.length - 1].timestamp - data[0].timestamp,
      perimeterData: data,
      timePoints,
      chartData
    };
  }, [firePerimeters]);

  useEffect(() => {
    if (timePoints.length) {
      const indexes = timePoints.map((_, idx) => (idx / (timePoints.length - 1)) * 100);
      setTimePointIndexes(indexes);
    }
  }, [timePoints]);

  useEffect(() => {
    if (!perimeterData.length) return;
    setSliderValue(0);
    setCurrentPerimeter(perimeterData[perimeterData.length - 1]);
    setTimeRange({
      start: minDate,
      end: perimeterData[perimeterData.length - 1].time
    });
  }, [minDate, perimeterData, setTimeRange]);

  useEffect(() => {
    if (
      totalRange === 0 ||
      !perimeterData.length ||
      !timePoints.length ||
      !timePointIndexes.length
    )
      return;

    let closestIdx = 0;
    let closestDist = Infinity;
    timePointIndexes.forEach((pos, idx) => {
      const d = Math.abs(pos - sliderValue);
      if (d < closestDist) {
        closestDist = d;
        closestIdx = idx;
      }
    });

    const nextPerimeter = perimeterData[closestIdx];
    if (!currentPerimeter || nextPerimeter.timestamp !== currentPerimeter.timestamp) {
      setCurrentPerimeter(nextPerimeter);
    }

    if (!currentPerimeter || nextPerimeter.time !== currentPerimeter.time) {
      setTimeRange({ start: minDate, end: nextPerimeter.time });
    }

    if (Math.abs(sliderValue - timePointIndexes[closestIdx]) > 0.1) {
      setSliderValue(timePointIndexes[closestIdx]);
    }
  }, [
    sliderValue,
    minDate,
    perimeterData,
    setTimeRange,
    timePoints,
    timePointIndexes,
    totalRange,
    currentPerimeter
  ]);

  useEffect(() => {
    if (!isPlaying || !timePointIndexes.length) return;

    let currentIndex = 0;
    let minDiff = Infinity;
    timePointIndexes.forEach((pos, idx) => {
      const diff = Math.abs(sliderValue - pos);
      if (diff < minDiff) {
        minDiff = diff;
        currentIndex = idx;
      }
    });

    const nextIdx = Math.min(currentIndex + 1, timePointIndexes.length - 1);
    const isLastFrame = currentIndex === timePointIndexes.length - 1;
    const frameDelay = baseFrameDelay / speedMultiplier;

    animationRef.current = setTimeout(() => {
      if (isLastFrame) {
        if (isRecordingRef.current) {
          requestAnimationFrame(() => {
            captureFrame();
            stopRecording();
          });
        }

        animationCompleteRef.current = true;
        setIsPlaying(false);
        return;
      }

      if (isRecordingRef.current) {
        requestAnimationFrame(captureFrame);
      }

      setSliderValue(timePointIndexes[nextIdx]);
    }, frameDelay);


    return () => clearTimeout(animationRef.current);
  }, [
    isPlaying,
    sliderValue,
    timePointIndexes,
    timePoints,
    captureFrame,
    stopRecording,
    isRecordingRef,
    baseFrameDelay,
    speedMultiplier
  ]);

  const togglePlayback = useCallback(() => {
    if (sliderValue >= 100) {
      animationCompleteRef.current = false;
      setSliderValue(timePointIndexes[0] || 0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [sliderValue, timePointIndexes]);

  const getYAxisKey = useCallback(() => {
    switch (selectedYAxis) {
      case 'Fire area (km²)':
        return 'area';
      case 'Mean FRP':
        return 'meanFrp';
      default:
        return 'duration';
    }
  }, [selectedYAxis]);

  const formatYAxisTick = (v) => v.toFixed(1);

  const customTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const value =
      selectedYAxis === 'Fire area (km²)'
        ? `${d.area.toFixed(2)} km²`
        : selectedYAxis === 'Mean FRP'
        ? d.meanFrp.toFixed(2)
        : `${d.duration.toFixed(2)} days`;

    return (
      <div className="bg-white padding-2 radius-md border-1px border-base-lighter shadow-1 z-top">
        <p className="text-bold">{format(d.time, 'HH:mm MMM d, yyyy')}</p>
        <p>
          {selectedYAxis}: {value}
        </p>
      </div>
    );
  }, [selectedYAxis]);

  const enhancedChartData = useMemo(() => {
    if (!chartData.length || !currentPerimeter) return chartData;
    return chartData.map((d) => ({
      ...d,
      isHighlighted: d.timestamp <= currentPerimeter.timestamp
    }));
  }, [chartData, currentPerimeter]);

  const xAxisTicks = useMemo(() => {
    if (!enhancedChartData.length) return [];
    const step = Math.ceil(enhancedChartData.length / 8);
    const ticks = enhancedChartData
      .filter((_, idx) => idx % step === 0)
      .map((d) => d.timestamp);

    const lastTimestamp = enhancedChartData[enhancedChartData.length - 1].timestamp;
    if (ticks[ticks.length - 1] !== lastTimestamp) {
      ticks.push(lastTimestamp);
    }

    return ticks;
  }, [enhancedChartData]);

  if (!selectedEventId) return null;

  return (
    <div
      className="detailed-time-chart bg-base-lightest radius-md padding-3 shadow-2 z-top"
      style={{ width: '800px', height: '215px' }}
    >
      <div className="display-flex flex-align-center flex-justify margin-bottom-2">
        <YAxisSelector selectedYAxis={selectedYAxis} onChange={setSelectedYAxis} />
        <PlaybackControls
          isPlaying={isPlaying}
          togglePlayback={togglePlayback}
          resetAnimation={resetAnimation}
          isRecording={isRecording}
          isPreparingToRecord={isPreparingToRecord}
        />
        <ExportButton
          isExporting={isExporting}
          isRecording={isRecording}
          isPreparingToRecord={isPreparingToRecord}
          handleExportVideo={handleExportVideo}
        />
        <ExportSettings
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          baseFrameDelay={baseFrameDelay}
          setBaseFrameDelay={setBaseFrameDelay}
        />
      </div>

      <div className="chart-container" ref={chartRef}>
        <ResponsiveContainer width="100%" height={113}>
          <BarChart
            data={enhancedChartData}
            margin={{ top: 10, bottom: 0, left: 30 }}
            barGap={0}
            barCategoryGap="0"
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['auto', 'auto']}
              ticks={xAxisTicks}
              tickFormatter={(tick) => {
                const date = new Date(tick);
                const hour = date.getHours();
                return hour === 0 || hour === 12 ? format(date, 'HH:mm MMM d') : '';
              }}
              tick={{
                fontSize: 10,
                fill: '#71767a',
                transform: 'translate(0, 30px)'
              }}
              tickLine={false}
              axisLine={false}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              dataKey={getYAxisKey()}
              tickFormatter={formatYAxisTick}
              width={1}
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fontFamily:
                  'Source Sans Pro Web, Helvetica Neue, Helvetica, Roboto, Arial, sans-serif',
                fill: '#71767a'
              }}
              className="font-body-3xs color-base"
            />
            <Tooltip content={customTooltip} cursor={false} />
            <Bar
              dataKey={getYAxisKey()}
              isAnimationActive={false}
              shape={(props: BarProps) => {
                const { x, y, width, height, payload } = props;
                if (x == null || y == null || width == null || height == null) return null;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={payload.isHighlighted ? '#1a6baa' : '#DFE1E2'}
                    opacity={payload.isHighlighted ? 1 : 0.5}
                    rx={2}
                    ry={2}
                    style={{ outline: 'none', stroke: 'none' }}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="slider-container" ref={sliderContainerRef}>
        <ReactSlider
          className="time-slider"
          thumbClassName="thumb"
          trackClassName="track"
          value={sliderValue}
          onChange={(v) => {
            setIsPlaying(false);
            setSliderValue(v);
          }}
          min={0}
          max={100}
          marks={timePointIndexes.length > 0}
          markClassName="slider-mark"
          ariaLabel="Fire perimeter time"
          disabled={isRecording}  // Only disable during recording, allow adjustment during prepare
        />
      </div>
    </div>
  );
};

export default DetailedTimeChart;

const YAxisSelector = ({ selectedYAxis, onChange }) => (
  <div className="display-flex flex-align-center">
    <span className="margin-right-1 font-body-3xs font-weight-regular color-base-ink">
      y-axis:
    </span>
    <select
      className="usa-select margin-top-0"
      value={selectedYAxis}
      onChange={(e) => onChange(e.target.value)}
    >
      {yAxisOptions.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </div>
);

const PlaybackControls = ({
  isPlaying,
  togglePlayback,
  resetAnimation,
  isRecording,
  isPreparingToRecord
}) => (
  <div className="display-flex flex-align-center">
    <button
      className="control-button padding-1"
      onClick={togglePlayback}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      disabled={isRecording}  // Only disable during recording
    >
      {isPlaying ? <Pause size={12} /> : <Play size={16} />}
    </button>
    <button
      className="control-button padding-1 margin-left-1"
      onClick={resetAnimation}
      aria-label="Reset"
      disabled={isRecording}  // Only disable during recording
    >
      <RotateCw size={16} />
    </button>
  </div>
);

const ExportButton = ({
  isExporting,
  isRecording,
  isPreparingToRecord,
  handleExportVideo
}) => (
  <button
    style={{ height: '40px' }}
    className={`usa-button export-button font-body-3xs padding-1 ${
      isExporting
        ? 'bg-base-lighter color-base font-italic'
        : isPreparingToRecord
        ? 'preparing'
        : isRecording
        ? 'recording'
        : ''
    }`}
    onClick={handleExportVideo}
    disabled={isExporting}
  >
    {isExporting ? (
      <>
        Processing... <Loader2 size={16} className="spin margin-left-1" />
      </>
    ) : isRecording ? (
      <>
        Stop Recording <X size={16} className="margin-left-1" />
      </>
    ) : isPreparingToRecord ? (
      <>
        Start Recording <Video size={16} className="margin-left-1" />
      </>
    ) : (
      <>
        Prepare Video <Video size={16} className="margin-left-1" />
      </>
    )}
  </button>
);

const ExportSettings = ({ exportFormat, setExportFormat, baseFrameDelay, setBaseFrameDelay }) => (
  <>
    <div className="display-flex flex-align-center flex-col margin-right-2">
      <span className="font-role-body font-weight-regular font-body-3xs color-base-ink margin-right-1">
        Format
      </span>
      <select
        className="usa-select margin-top-0"
        value={exportFormat}
        onChange={(e) => setExportFormat(e.target.value)}
      >
        <option value="webm">WebM</option>
        <option value="gif">GIF</option>
        <option value="instagram">Instagram Reels</option>
      </select>
    </div>

    <div className="display-flex flex-align-center flex-col">
      <span className="font-role-body font-weight-regular font-body-3xs color-base-ink margin-right-1">
        Speed
      </span>
      <select
        className="usa-select margin-top-0"
        value={baseFrameDelay}
        onChange={(e) => setBaseFrameDelay(Number(e.target.value))}
      >
        <option value={500}>1x</option>
        <option value={250}>2x</option>
        <option value={50}>3x</option>
      </select>
    </div>
  </>
);
