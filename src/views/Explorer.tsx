import React, { useEffect } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useEvents } from '../contexts/EventsContext';
import { useMap } from '../contexts/MapContext';
import { useFilters } from '../contexts/FiltersContext';
import 'mapbox-gl/dist/mapbox-gl.css';
import EventList from '../components/sidebar/EventList';
import SearchBox from '../components/filters/SearchBox';
import MapControls from '../components/filters/MapControls';
import EventDetailView from '../components/sidebar/EventDetailView';
import MapView from '../components/MapView';

const Explorer: React.FC = () => {
  const {
    setTimeRange,
    selectEvent,
    selectedEventId,
    viewMode,
    setViewMode,
    showWindLayer,
    show3DMap,
    toggleWindLayer,
    toggle3DMap
  } = useAppState();

  const {
    events,
    selectedEvent,
    totalEvents,
    activeEvents,
    inactiveEvents,
    totalArea,
    isLoading: isLoadingEvents
  } = useEvents();

  const {
    viewState,
    setViewState,
    layers,
    deckRef,
    mapboxStyle,
    isLayersLoading,
    opacity,
    setOpacity
  } = useMap();

  const {
    searchTerm,
    showAdvancedFilters,
    setSearchTerm,
    toggleAdvancedFilters,
  } = useFilters();

  useEffect(() => {
  }, [selectedEventId, selectedEvent, viewMode]);

  const handleMapClick = (info: any) => {
    if (info.object) {
      selectEvent(info.object.properties.fireid);
    }
  };

  const handleRangeChange = (range: { start: Date; end: Date }) => {
    setTimeRange(range);
  };

  const handleBackToList = () => {
    selectEvent(null);
  };

  const handleSelectFeature = (id: string) => {
    selectEvent(id);
    setViewMode('detail');
  };

  const showDetailView = selectedEventId !== null && selectedEvent !== null;

  return (
    <div className="display-flex height-viewport">
      <div className="position-relative flex-fill">
        <MapView />

        <div className="position-absolute top-4 left-4 z-top width-mobile-lg">
          {viewMode === 'detail' ? (
              <MapControls
                opacity={opacity}
                setOpacity={setOpacity}
                showWindDirection={showWindLayer}
                setShowWindDirection={toggleWindLayer}
                show3DMap={show3DMap}
                setShow3DMap={toggle3DMap}
              />
            ) : (
              <SearchBox
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                toggleAdvancedFilters={toggleAdvancedFilters}
                showAdvancedFilters={showAdvancedFilters}
              />
            )}
        </div>

        <div className="position-absolute bottom-0 left-0 right-0 z-top display-flex justify-center padding-bottom-4">
            {/* {viewMode === 'detail' ? (
              <DetailedTimeChart events={events} onRangeChange={(e) => console.log(e)} />
            ) : (
              <RangeSlider
                events={events}
                onRangeChange={(e) => console.log(e)}
              />
            )} */}
        </div>

        {(isLoadingEvents || isLayersLoading) && (
          <div className="position-absolute pin display-flex flex-align-center flex-justify-center bg-base-darkest opacity-30 z-top">
            <div className="bg-white padding-4 radius-lg shadow-lg">
              <div className="spinner margin-x-auto"></div>
              <p className="margin-top-2 text-center">Loading data...</p>
            </div>
          </div>
        )}
      </div>

      <div className="width-mobile-lg overflow-hidden display-flex flex-column">
        {viewMode === 'detail' ? (
          <EventDetailView
            event={selectedEvent}
            onBack={handleBackToList}
          />
        ) : (
          <div className="bg-base-darkest usa-backdrop-blur text-white height-full display-flex flex-column">
            <div className="flex-fill overflow-auto">
              <EventList
                features={events}
                selectedId={selectedEventId}
                onSelectFeature={handleSelectFeature}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;