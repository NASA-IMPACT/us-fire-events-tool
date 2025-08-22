import React from 'react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import ReactSlider from 'react-slider';
import { useFireExplorerStore } from '@/state/useFireExplorerStore';
import {
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
} from 'recharts';
import useRecordVideo from '../timeline/useVideoRecording';
import { Props as BarProps } from 'recharts/types/cartesian/Bar';
import { ExportSettings, PlaybackControls } from '../timeline/VideoComponents';

import 'react-calendar/dist/Calendar.css';
import '../timeline/rangeslider.scss';
import DetailsToggle from './detailsToggle';
import { Button, Icon } from '@trussworks/react-uswds';
import { ToggleSlider } from 'react-toggle-slider';
import EventDetails from '../sidebar/EventDetailsView';
import './details.scss';

const yAxisOptions = ['Fire area (km²)', 'Mean FRP', 'Duration (days)'];

interface MobileDetails {
  onBack: () => void;
}

const MobileDetails: React.FC<MobileDetails> = ({ onBack }) => {
  const selectedEventId = useFireExplorerStore.use.selectedEventId();
  const firePerimeters = useFireExplorerStore.use.firePerimeters();
  const windLayerType = useFireExplorerStore.use.windLayerType();
  const setWindLayerType = useFireExplorerStore.use.setWindLayerType();
  const setTimeMarker = useFireExplorerStore.use.setTimeMarker();
  const show3DMap = useFireExplorerStore.use.show3DMap();
  const toggle3DMap = useFireExplorerStore.use.toggle3DMap();

  const [sliderValue, setSliderValue] = useState(0);
  const [currentPerimeter, setCurrentPerimeter] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timePointIndexes, setTimePointIndexes] = useState([]);
  const [baseFrameDelay, setBaseFrameDelay] = useState(500);
  const [selectedYAxis, setSelectedYAxis] = useState(yAxisOptions[0]);
  const [mobileTimelineActive, setMobileTimelineActive] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(true);
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
    exportFormat,
    setExportFormat,
    speedMultiplier,
    captureFrame,
    handleExportVideo,
    stopRecording,
    isRecordingRef,
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
  });

  const { minDate, totalRange, perimeterData, timePoints, chartData } =
    useMemo(() => {
      if (!firePerimeters || firePerimeters.features.length === 0) {
        return {
          minDate: new Date(),
          maxDate: new Date(),
          totalRange: 0,
          perimeterData: [],
          timePoints: [],
          chartData: [],
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
          properties: f.properties,
        };
      });

      const timePoints = data.map((d) => ({
        time: d.time,
        timestamp: d.timestamp,
      }));

      const chartData = data.map((d) => ({
        ...d,
        date: format(d.time, 'MMM d, HH:mm'),
        name: format(d.time, 'MMM d, yyyy HH:mm'),
      }));

      return {
        minDate: data[0].time,
        maxDate: data[data.length - 1].time,
        totalRange: data[data.length - 1].timestamp - data[0].timestamp,
        perimeterData: data,
        timePoints,
        chartData,
      };
    }, [firePerimeters]);

  useEffect(() => {
    if (timePoints.length) {
      const indexes = timePoints.map(
        (_, idx) => (idx / (timePoints.length - 1)) * 100
      );
      setTimePointIndexes(indexes);
    }
  }, [timePoints]);
  useEffect(() => {}, [mobileTimelineActive]);

  useEffect(() => {
    if (!perimeterData.length) return;
    setSliderValue(0);
    const first = perimeterData[0];
    setCurrentPerimeter(first);
    setTimeMarker(first.time);
  }, [minDate, perimeterData]);

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
    if (
      !currentPerimeter ||
      nextPerimeter.timestamp !== currentPerimeter.timestamp
    ) {
      setCurrentPerimeter(nextPerimeter);
    }

    if (!currentPerimeter || nextPerimeter.time !== currentPerimeter.time) {
      setTimeMarker(nextPerimeter.time);
    }

    if (Math.abs(sliderValue - timePointIndexes[closestIdx]) > 0.1) {
      setSliderValue(timePointIndexes[closestIdx]);
    }
  }, [
    sliderValue,
    minDate,
    perimeterData,
    setTimeMarker,
    timePoints,
    timePointIndexes,
    totalRange,
    currentPerimeter,
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
    speedMultiplier,
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

  const customTooltip = useCallback(
    ({ active, payload }) => {
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
    },
    [selectedYAxis]
  );

  const enhancedChartData = useMemo(() => {
    if (!chartData.length || !currentPerimeter) return chartData;

    return chartData.map((d) => ({
      ...d,
      isHighlighted: d.timestamp <= currentPerimeter.timestamp,
    }));
  }, [chartData, currentPerimeter]);

  const xAxisTicks = useMemo(() => {
    if (!enhancedChartData.length) return [];
    const step = Math.ceil(enhancedChartData.length / 8);
    const ticks = enhancedChartData
      .filter((_, idx) => idx % step === 0)
      .map((d) => d.timestamp);

    const lastTimestamp =
      enhancedChartData[enhancedChartData.length - 1].timestamp;
    if (ticks[ticks.length - 1] !== lastTimestamp) {
      ticks.push(lastTimestamp);
    }

    return ticks;
  }, [enhancedChartData]);

  if (!selectedEventId) return null;

  return (
    <div>
      <div className="padding-y-1  border-bottom border-base-lighter display-flex flex-row flex-align-center bg-white padding-x-3 display-flex flex-justify">
        <div>
          <button
            className="usa-button usa-button--unstyled text-base-dark display-flex flex-align-center"
            onClick={onBack}
          >
            <svg
              className="margin-right-1"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z"
                fill="currentColor"
              />
            </svg>
            <span className="font-body font-weight-regular font-sans-3xs text-underline">
              Back to all fire events
            </span>
          </button>
        </div>
        <div>
          <Button
            type={'button'}
            unstyled
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            {drawerOpen ? (
              <Icon.ExpandLess size={5} className="text-base" />
            ) : (
              <Icon.ExpandMore size={5} className="text-base" />
            )}
          </Button>
        </div>
      </div>

      <div className="detailed-time-chart bg-white radius-md padding-3 shadow-2 z-top width-full≈">
        {drawerOpen && (
          <div>
            <div className="margin-bottom-2">
              <DetailsToggle
                setMobileTimelineActive={setMobileTimelineActive}
                mobileTimelineActive={mobileTimelineActive}
              />
            </div>
            {mobileTimelineActive ? (
              <>
                <div className=" details-container padding-y-2 grid-container  padding-x-0 margin-bottom-2">
                  <div className="grid-row">
                    <div className="grid-col-6 padding-right-1">
                      <label className="usa-checkbox margin-0 border-base-light border-1px radius-md padding-2 display-flex width-full maxh-8 display-flex flex-justify">
                        {' '}
                        <span>Wind direction</span>
                        <input
                          className="usa-checkbox__input"
                          type="checkbox"
                          checked={windLayerType !== null}
                          onChange={(e) =>
                            setWindLayerType(e.target.checked ? 'wind' : null)
                          }
                        />
                        <span className="usa-checkbox__label font-ui font-sans-2xs text-base-ink margin-top-0 " />
                      </label>
                    </div>
                    <div className="grid-col-6 ">
                      <label className="usa-checkbox border-base-light border-1px radius-md padding-2 display-flex width-full maxh-8 display-flex flex-justify">
                        <span>3D map</span>

                        <input
                          className="usa-checkbox__input"
                          type="checkbox"
                          name="3d-map"
                          checked={show3DMap}
                          onChange={toggle3DMap}
                        />
                        <span className="usa-checkbox__label font-ui font-weight-regular font-sans-2xs text-base-ink margin-top-0" />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="display-flex flex-align-center flex-justify margin-bottom-2">
                  <YAxisSelector
                    selectedYAxis={selectedYAxis}
                    onChange={setSelectedYAxis}
                  />

                  <ExportSettings
                    exportFormat={exportFormat}
                    setExportFormat={setExportFormat}
                    baseFrameDelay={baseFrameDelay}
                    setBaseFrameDelay={setBaseFrameDelay}
                    isMobile={true}
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
                          return hour === 0 || hour === 12
                            ? format(date, 'HH:mm MMM d')
                            : '';
                        }}
                        tick={{
                          fontSize: 10,
                          fill: '#71767a',
                          transform: 'translate(0, 30px)',
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
                          fill: '#71767a',
                        }}
                        className="font-body-3xs color-base"
                      />
                      <Tooltip content={customTooltip} cursor={false} />
                      <Bar
                        dataKey={getYAxisKey()}
                        isAnimationActive={false}
                        shape={(props: BarProps) => {
                          const { x, y, width, height, payload } = props;
                          if (
                            x == null ||
                            y == null ||
                            width == null ||
                            height == null
                          )
                            return null;
                          return (
                            <rect
                              x={x}
                              y={y}
                              width={width}
                              height={height}
                              fill={
                                payload.isHighlighted ? '#1a6baa' : '#DFE1E2'
                              }
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
                <div
                  className="slider-container margin-bottom-2"
                  ref={sliderContainerRef}
                >
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
                    disabled={isRecording || isPreparingToRecord}
                  />
                </div>
              </>
            ) : (
              <div className="details-container ">
                <EventDetails isMobile={true} />
              </div>
            )}
          </div>
        )}
        <div className="display-flex flex-align-center width-full ">
          <PlaybackControls
            isPlaying={isPlaying}
            togglePlayback={togglePlayback}
            resetAnimation={resetAnimation}
            isRecording={isRecording}
            isPreparingToRecord={isPreparingToRecord}
            isMobile={true}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileDetails;

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
