import React from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useEvents } from '../contexts/EventsContext';
import MapView from '../components/MapView';
import EventDetails from '../components/sidebar/EventDetailView';
import TimeRangeSlider from '../components/timeline/RangeSlider';

import 'mapbox-gl/dist/mapbox-gl.css';
import DetailedTimeChart from '../components/timeline/DetailedTimeChart';
import Header from '../components/Header';

const Explorer: React.FC = () => {
  const {
    viewMode,
    setViewMode,
    toggle3DMap,
    show3DMap,
    windLayerType,
    setWindLayerType,
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

  return (
    <>
      <Header />

      <div className="display-flex height-viewport">
        <div className="position-relative flex-fill">
          <MapView />

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
    </>
  );
};

export default Explorer;