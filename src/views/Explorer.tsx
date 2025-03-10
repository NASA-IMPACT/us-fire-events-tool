import React, { useMemo } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useEvents } from '../contexts/EventsContext';
import { useFilters } from '../contexts/FiltersContext';
import EventList from '../components/sidebar/EventList';
import SearchBox from '../components/filters/SearchBox';
import MapView from '../components/MapView';
import EventDetails from '../components/sidebar/EventDetailView';
import TimeRangeSlider from '../components/timeline/RangeSlider';

import 'mapbox-gl/dist/mapbox-gl.css';

const Explorer: React.FC = () => {
  const {
    timeRange,
    viewMode,
    setViewMode
  } = useAppState();

  const { getFilteredEvents, selectEvent } = useEvents();

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
  };

  return (
    <div className="display-flex height-viewport">
      <div className="position-relative flex-fill">
        <MapView />

        <div className="position-absolute top-3 left-3 z-top width-mobile-lg">
          <SearchBox
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            toggleAdvancedFilters={toggleAdvancedFilters}
            showAdvancedFilters={showAdvancedFilters}
          />
        </div>

        <TimeRangeSlider />
      </div>

      <div className="width-mobile-lg overflow-hidden display-flex flex-column">
        {viewMode === 'detail' ? (
          <EventDetails onBack={handleBackToList} />
        ) : (
          <div className="bg-base-darkest usa-backdrop-blur text-white height-full display-flex flex-column">
            <div className="flex-fill overflow-auto">
              <EventList
                features={filteredEvents}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;