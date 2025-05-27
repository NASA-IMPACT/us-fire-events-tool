import React, { useState } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useEvents } from '../contexts/EventsContext';
import MapView from '../components/MapView';
import EventDetails from '../components/sidebar/EventDetailView';
import TimeRangeSlider from '../components/timeline/RangeSlider';
import DetailedTimeChart from '../components/timeline/DetailedTimeChart';
import Header from '../components/Header';
import LayerSwitcher from '../components/LayerSwitcher';
import { Layers } from 'lucide-react';

import 'mapbox-gl/dist/mapbox-gl.css';

type LoadingStates = {
  perimeterNrt: boolean;
  fireline: boolean;
  newfirepix: boolean;
};

const Explorer: React.FC = () => {
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    perimeterNrt: false,
    fireline: false,
    newfirepix: false
  });

  const {
    viewMode,
    setViewMode,
    toggle3DMap,
    show3DMap,
    windLayerType,
    setWindLayerType,
    showPerimeterNrt,
    showFireline,
    showNewFirepix
  } = useAppState();

  const { selectEvent, selectedEventId } = useEvents();

  const handleBackToList = () => {
    selectEvent(null);
    setViewMode('explorer');
    if (show3DMap) {
      toggle3DMap();
    }
    if (windLayerType !== null) {
      setWindLayerType(null);
    }
  };

  const handleLoadingStatesChange = (newLoadingStates: LoadingStates) => {
    setLoadingStates(newLoadingStates);
  };

  const hasLoadingLayers = Object.entries(loadingStates).some(([layerKey, isLoading]) => {
    if (!isLoading) return false;

    switch (layerKey) {
      case 'perimeterNrt':
        return showPerimeterNrt;
      case 'fireline':
        return showFireline;
      case 'newfirepix':
        return showNewFirepix;
      default:
        return false;
    }
  });

  return (
    <div className='wildfire-explorer'>
      <Header />

      <div className="display-flex height-viewport">
        <div className="position-relative flex-fill">
          <div
            className="display-flex position-absolute z-top bg-white border-0 shadow-2 radius-md cursor-pointer"
            style={{
              top: '50px',
              right: viewMode === 'detail' && selectedEventId ? '380px' : '10px',
              transition: 'right 0.2s ease',
              padding: '5px 5px 2px 5px'
            }}
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            aria-label="Toggle layer switcher"
          >
            <div className="position-relative">
              <Layers size={18} />
              {/* Loading indicator on the layers button */}
              {hasLoadingLayers && (
                <div
                  className="position-absolute"
                  style={{
                    width: '6px',
                    height: '6px',
                    top: '0px',
                    right: '0px',
                    backgroundColor: '#3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1.5s ease-in-out infinite'
                  }}
                />
              )}
            </div>
          </div>

          {showLayerPanel && (
            <div
              className="position-absolute z-top"
              style={{
                top: '50px',
                right: viewMode === 'detail' && selectedEventId ? '380px' : '10px',
                transition: 'right 0.2s ease',
              }}
            >
              <LayerSwitcher
                onClose={() => setShowLayerPanel(false)}
                loadingStates={loadingStates}
              />
            </div>
          )}

          <MapView onLoadingStatesChange={handleLoadingStatesChange} />

          {viewMode === 'detail' && selectedEventId ? (
            <div
              className="position-absolute bottom-0 z-top margin-bottom-2"
              style={{
                left: 'calc(50% - 185px)',
                transform: 'translateX(-50%)',
              }}
            >
              <DetailedTimeChart />
            </div>

          ) : (
            <div
              className="position-absolute bottom-0 z-top margin-bottom-2"
              style={{ left: '50%', transform: 'translateX(-50%)' }}>
              <TimeRangeSlider />
            </div>
          )}
        </div>

        {viewMode === 'detail' && (
          <div className="overflow-hidden display-flex flex-column position-absolute bg-white" style={{ position: 'absolute', width: '360px', top: '50px', right: '10px', height: 'calc(100% - 70px)' }}>
            <EventDetails onBack={handleBackToList} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;