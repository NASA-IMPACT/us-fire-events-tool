import React, { useMemo } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useEvents } from '../contexts/EventsContext';
import { useFilters } from '../contexts/FiltersContext';
import EventList from '../components/sidebar/EventList';
import MapView from '../components/MapView';
import EventDetails from '../components/sidebar/EventDetailView';
import TimeRangeSlider from '../components/timeline/RangeSlider';

import 'mapbox-gl/dist/mapbox-gl.css';
import DetailedTimeChart from '../components/timeline/DetailedTimeChart';
import Header from '../components/Header';
import SearchBox from '../components/filters/SearchBox';

const Explorer: React.FC = () => {
  const {
    timeRange,
    viewMode,
    setViewMode,
    toggle3DMap,
    show3DMap,
    showWindLayer,
    toggleWindLayer,
  } = useAppState();

  const { getFilteredEvents, selectEvent, selectedEventId } = useEvents();

  const filteredEvents = useMemo(() => {
    return getFilteredEvents(timeRange.start, timeRange.end);
  }, [getFilteredEvents, timeRange])

  const {
    searchTerm,
    showAdvancedFilters,
    setSearchTerm,
    toggleAdvancedFilters,
  } = useFilters();

  const handleBackToList = () => {
    selectEvent(null);
    setViewMode('explorer');
    if (show3DMap) {
      toggle3DMap();
    }
    if (showWindLayer) {
      toggleWindLayer();
    }
  };

  return (
    <>
      <Header />

      <div className="display-flex height-viewport">

        <div className="position-relative flex-fill">
          <MapView />

          {viewMode === 'explorer' &&
            <div className="position-absolute top-5 left-2 z-top width-mobile-lg" style={{ top: '60px' }}>
            <SearchBox
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              toggleAdvancedFilters={toggleAdvancedFilters}
              showAdvancedFilters={showAdvancedFilters}
            />
          </div>
          }

          {viewMode === 'detail' && selectedEventId ? (
            <DetailedTimeChart />
          ) : (
            <TimeRangeSlider />
          )}
        </div>

        <div className="overflow-hidden display-flex flex-column position-absolute bg-white" style={{ position: 'absolute', width: '360px', top: '50px', right: '10px', height: 'calc(100% - 70px)' }}>
          {viewMode === 'detail' ? (
            <EventDetails onBack={handleBackToList} />
          ) : (
            <EventList
                features={filteredEvents}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Explorer;