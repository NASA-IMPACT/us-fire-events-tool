import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import ReactSlider from 'react-slider';
import { Pause, Play, RotateCw, Video, X } from 'lucide-react';
import { useEvents } from '../../contexts/EventsContext';
import { useAppState } from '../../contexts/AppStateContext';
import { YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import WebMWriter from 'webm-writer';

const DetailedTimeChart = () => {
  const { selectedEventId, firePerimeters } = useEvents();
  const { windLayerType, setWindLayerType, setTimeRange, show3DMap, toggle3DMap } = useAppState();

  const [sliderValue, setSliderValue] = useState(0);
  const [currentPerimeter, setCurrentPerimeter] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(2000);
  const chartRef = useRef(null);
  const sliderContainerRef = useRef(null);
  const animationRef = useRef(null);
  const [timePointIndexes, setTimePointIndexes] = useState([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingToRecord, setIsPreparingToRecord] = useState(false);
  const webmWriterRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const frameCountRef = useRef(0);
  const totalFramesRef = useRef(0);
  const isRecordingRef = useRef(false);
  const animationCompleteRef = useRef(false);
  const [videoFps, setVideoFps] = useState(1);
  const recordingEndTimeoutRef = useRef(null);

  const yAxisOptions = ['Fire area (km²)', 'Mean FRP', 'Duration (days)'];
  const [selectedYAxis, setSelectedYAxis] = useState(yAxisOptions[0]);

  const {
    minDate,
    maxDate,
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
        maxArea: 0,
        timePoints: [],
        chartData: []
      };
    }

    const sortedFeatures = [...firePerimeters.features].sort((a, b) => {
      const timeA = new Date(a.properties.primarykey.split('|')[2]).getTime();
      const timeB = new Date(b.properties.primarykey.split('|')[2]).getTime();
      return timeA - timeB;
    });

    const data = sortedFeatures.map(feature => {
      const time = new Date(feature.properties.primarykey.split('|')[2]);
      const areaKm2 = (feature.properties.farea || 0);
      const meanFrp = feature.properties.meanfrp || 0;
      const duration = feature.properties.duration || 0;

      return {
        time,
        timestamp: time.getTime(),
        area: areaKm2,
        meanFrp,
        duration,
        properties: feature.properties
      };
    });

    const minTime = data[0].timestamp;
    const maxTime = data[data.length - 1].timestamp;

    const startDate = new Date(minTime);
    const endDate = new Date(maxTime);

    const timePoints = data.map(d => ({
      time: d.time,
      timestamp: d.timestamp
    }));

    const chartData = data.map(d => ({
      time: d.time,
      timestamp: d.timestamp,
      date: format(d.time, 'MMM d, HH:mm'),
      area: d.area,
      meanFrp: d.meanFrp,
      duration: d.duration,
      name: format(d.time, 'MMM d, yyyy HH:mm')
    }));

    return {
      minDate: startDate,
      maxDate: endDate,
      totalRange: endDate.getTime() - startDate.getTime(),
      perimeterData: data,
      maxArea: Math.max(...data.map(d => d.area)) * 1.2,
      timePoints,
      chartData
    };
  }, [firePerimeters]);

  useEffect(() => {
    if (timePoints.length > 0) {
      const indexes = timePoints.map((_, index) => (index / (timePoints.length - 1)) * 100);
      setTimePointIndexes(indexes);
    }
  }, [timePoints]);

  useEffect(() => {
    if (perimeterData.length > 0) {
      setSliderValue(0);
      setCurrentPerimeter(perimeterData[perimeterData.length - 1]);

      setTimeRange({
        start: minDate,
        end: perimeterData[perimeterData.length - 1].time
      });
    }
  }, [minDate, perimeterData, setTimeRange]);

  useEffect(() => {
    if (totalRange === 0 || perimeterData.length === 0 || timePoints.length === 0 || timePointIndexes.length === 0) return;

    let closestPointIndex = 0;
    let closestDistance = Infinity;

    timePointIndexes.forEach((position, index) => {
      const distance = Math.abs(position - sliderValue);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPointIndex = index;
      }
    });

    const nextPerimeter = perimeterData[closestPointIndex];

    if (!currentPerimeter || nextPerimeter.timestamp !== currentPerimeter.timestamp) {
      setCurrentPerimeter(nextPerimeter);
    }

    if (!currentPerimeter || nextPerimeter.time !== currentPerimeter.time) {
      setTimeRange({
        start: minDate,
        end: nextPerimeter.time
      });
    }

    if (Math.abs(sliderValue - timePointIndexes[closestPointIndex]) > 0.1) {
      setSliderValue(timePointIndexes[closestPointIndex]);
    }
  }, [sliderValue, minDate, perimeterData, setTimeRange, timePoints, timePointIndexes, totalRange]);

  useEffect(() => {
    if (isPlaying) {
      if (sliderValue >= 100) {
        setIsPlaying(false);
        animationCompleteRef.current = true;

        if (isRecordingRef.current) {
          if (recordingEndTimeoutRef.current) {
            clearTimeout(recordingEndTimeoutRef.current);
          }

          recordingEndTimeoutRef.current = setTimeout(() => {
            stopRecording();
          }, 2000);
        }
        return;
      }

      let currentIndex = 0;
      let minDiff = Infinity;

      timePointIndexes.forEach((pos, idx) => {
        const diff = Math.abs(sliderValue - pos);
        if (diff < minDiff) {
          minDiff = diff;
          currentIndex = idx;
        }
      });

      const nextIndex = Math.min(currentIndex + 1, timePointIndexes.length - 1);
      const nextPosition = timePointIndexes[nextIndex];

      animationRef.current = setTimeout(() => {
        setSliderValue(nextPosition);

        if (isRecordingRef.current) {
          captureFrame();
        }
      }, animationSpeed);

      if (nextIndex === timePointIndexes.length - 1) {
        animationCompleteRef.current = true;
        setIsPlaying(false);
        if (isRecordingRef.current) stopRecording();
      }
    }

    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isPlaying, sliderValue, animationSpeed, timePointIndexes]);

  const togglePlayback = () => {
    if (sliderValue >= 100) {
      animationCompleteRef.current = false;
      setSliderValue(timePointIndexes[0] || 0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const resetAnimation = () => {
    animationCompleteRef.current = false;
    setIsPlaying(false);
    setSliderValue(timePointIndexes[0] || 0);
  };

  const getYAxisKey = () => {
    if (selectedYAxis === 'Fire area (km²)') {
      return 'area';
    } else if (selectedYAxis === 'Mean FRP') {
      return 'meanFrp';
    } else {
      return 'duration';
    }
  };

  const formatYAxisTick = (value) => {
    if (selectedYAxis === 'Fire area (km²)') {
      return value.toFixed(1);
    } else if (selectedYAxis === 'Mean FRP') {
      return value.toFixed(1);
    } else {
      return value.toFixed(1);
    }
  };

  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      let displayValue;
      let unit = '';

      if (selectedYAxis === 'Fire area (km²)') {
        displayValue = data.area.toFixed(2);
        unit = ' km²';
      } else if (selectedYAxis === 'Mean FRP') {
        displayValue = data.meanFrp.toFixed(2);
      } else {
        displayValue = data.duration.toFixed(2);
        unit = ' days';
      }

      return (
        <div className="bg-white padding-2 radius-md border-1px border-base-lighter shadow-1 z-top">
          <p className="text-bold">{format(data.time, 'HH:mm MMM d, yyyy')}</p>
          <p>
            {selectedYAxis}: {displayValue}{unit}
          </p>
        </div>
      );
    }
    return null;
  };

  const enhancedChartData = useMemo(() => {
    if (!chartData.length || !currentPerimeter) return chartData;

    return chartData.map(dataPoint => ({
      ...dataPoint,
      isHighlighted: dataPoint.timestamp <= currentPerimeter.timestamp
    }));
  }, [chartData, currentPerimeter]);

  const handleExportVideo = () => {
    if (isRecordingRef.current) {
      stopRecording();
    } else if (isPreparingToRecord) {
      startRecording();
    } else {
      prepareToRecord();
    }
  };

  const prepareToRecord = () => {
    if (!show3DMap) {
      toggle3DMap();
    }

    if (windLayerType === 'wind') {
      setWindLayerType('grid');
    }

    animationCompleteRef.current = false;
    setIsPreparingToRecord(true);
    resetAnimation();
  };

  const captureFrame = () => {
    if (!isRecordingRef.current || !webmWriterRef.current) {
      return;
    }

    try {
      const deckGLCanvas = document.getElementById('deckgl-overlay');

      if (!deckGLCanvas) {
        console.error("Could not find required canvases");
        return;
      }

      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = deckGLCanvas.width;
      compositeCanvas.height = deckGLCanvas.height;

      const ctx = compositeCanvas.getContext('2d', { alpha: false });

      ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
      ctx.drawImage(deckGLCanvas, 0, 0);

      if (!currentPerimeter?.time) return;

      const timestampText = format(new Date(currentPerimeter.time), 'yyyy-MM-dd HH:mm');

      ctx.font = '64px sans-serif';
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'right';

      const paddingX = 32;
      const paddingY = 32;
      const x = compositeCanvas.width - paddingX;
      const y = paddingY;

      ctx.strokeText(timestampText, x, y);
      ctx.fillText(timestampText, x, y);


      webmWriterRef.current.addFrame(compositeCanvas);

      frameCountRef.current++;
    } catch (error) {
      console.error("Error capturing frame:", error);
    }
  };

  const startRecording = () => {
    try {
      if (recordingEndTimeoutRef.current) {
        clearTimeout(recordingEndTimeoutRef.current);
        recordingEndTimeoutRef.current = null;
      }

      setIsPreparingToRecord(false);

      isRecordingRef.current = true;
      setIsRecording(true);

      animationCompleteRef.current = false;

      webmWriterRef.current = new WebMWriter({
        quality: 0.95,
        frameRate: videoFps,
        transparent: false,
        debug: true
      });

      resetAnimation();

      frameCountRef.current = 0;

      setTimeout(() => {
        setIsPlaying(true);
      }, 500);

      const animationDuration = timePoints.length * animationSpeed;
      totalFramesRef.current = Math.ceil(videoFps * (animationDuration / 1000));
      totalFramesRef.current = Math.ceil(totalFramesRef.current * 1.2);

      setIsPlaying(true);

    } catch (error) {
      console.error("Error starting recording:", error);
      isRecordingRef.current = false;
      setIsRecording(false);
      setIsPreparingToRecord(false);
    }
  };

  const stopRecording = () => {
    if (!isRecordingRef.current || !webmWriterRef.current) {
      setIsRecording(false);
      isRecordingRef.current = false;
      setIsPreparingToRecord(false);
      return;
    }

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (recordingEndTimeoutRef.current) {
      clearTimeout(recordingEndTimeoutRef.current);
      recordingEndTimeoutRef.current = null;
    }

    setIsPlaying(false);
    isRecordingRef.current = false;

    webmWriterRef.current.complete()
      .then(webMBlob => {
        const url = URL.createObjectURL(webMBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fire-animation-${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}-${timePoints.length}frames-${videoFps}fps.webm`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);

        setIsRecording(false);
        setIsPreparingToRecord(false);
        setIsPlaying(false);
      })
      .catch(error => {
        console.error("Error completing recording:", error);
        setIsRecording(false);
        setIsPreparingToRecord(false);
        setIsPlaying(false);
      });
  };

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (recordingEndTimeoutRef.current) {
        clearTimeout(recordingEndTimeoutRef.current);
      }
    };
  }, []);

  if (!selectedEventId) return null;

  return (
    <div className="detailed-time-chart bg-base-lightest radius-md padding-3 shadow-2 z-top" style={{ width: "800px", height: '215px' }}>
      <div className="display-flex flex-align-center flex-justify margin-bottom-2">
        <div className="display-flex flex-align-center">
          <span className="margin-right-1 font-role-body font-weight-regular type-scale-3xs color-base-ink">y-axis:</span>
          <select
            className="y-axis-select"
            value={selectedYAxis}
            onChange={(e) => setSelectedYAxis(e.target.value)}
          >
            {yAxisOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="display-flex flex-align-center">
          <button
            className="control-button"
            onClick={togglePlayback}
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={isRecording || isPreparingToRecord}
          >
            {isPlaying ? (
              <Pause size={24} />
            ) : (
              <Play size={24} />
            )}
          </button>

          <button
            className="control-button"
            onClick={resetAnimation}
            aria-label="Reset"
            disabled={isRecording || isPreparingToRecord}
          >
            <RotateCw size={24} />
          </button>

        </div>

        <button
          className={`export-button border-radius-md padding-1 padding-x-105 ${isPreparingToRecord ? 'preparing' : isRecording ? 'recording' : ''}`}
          onClick={handleExportVideo}
        >
          {isRecording ? (
            <>Stop Recording <X size={18} className="margin-left-1" /></>
          ) : isPreparingToRecord ? (
            <>Start Recording <Video size={18} className="margin-left-1" /></>
          ) : (
            <>Prepare Video <Video size={18} className="margin-left-1" /></>
          )}
        </button>
      </div>

      <div className="chart-container" ref={chartRef}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
              data={enhancedChartData}
              margin={{ top: 10, bottom: 0 }}
              barSize={100}
              barGap={0}
              barCategoryGap={0}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <YAxis
              dataKey={getYAxisKey()}
              tickFormatter={formatYAxisTick}
              tick={{ fontSize: 12, fontFamily: "Source Sans Pro Web, Helvetica Neue, Helvetica, Roboto, Arial, sans-serif", fill: "#71767a" }}
              className="font-role-body font-weight-regular type-scale-3xs color-base"
            />
            <Tooltip content={customTooltip} cursor={{fill: 'transparent'}} />
            <Bar
              dataKey={getYAxisKey()}
              shape={(props) => {
                const isHighlighted = props.payload.isHighlighted;
                return (
                  <rect
                    x={props.x}
                    y={props.y}
                    width={props.width}
                    height={props.height}
                    fill={isHighlighted ? '#1a6baa' : '#DFE1E2'}
                    opacity={isHighlighted ? 1 : 0.5}
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
          onChange={(value) => {
            setIsPlaying(false);
            setSliderValue(value);
          }}
          min={0}
          max={100}
          marks={timePointIndexes.length > 0}
          markClassName="slider-mark"
          ariaLabel="Fire perimeter time"
          disabled={isRecording || isPreparingToRecord}
        />
      </div>

      <div className="time-labels display-flex flex-justify">
        <div className="theme-font-role-body theme-font-weight-regular theme-type-scale-3xs theme-color-base">{format(minDate, 'HH:mm MMM d, yyyy')}</div>
        <div className="theme-font-role-body theme-font-weight-regular theme-type-scale-3xs theme-color-base">{format(maxDate, 'HH:mm MMM d, yyyy')}</div>
      </div>
    </div>
  );
};

export default DetailedTimeChart;