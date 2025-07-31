import { useEffect, useCallback, useState } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/mapbox';

import { useFireExplorerStore } from '@/state/useFireExplorerStore';
import { MAP_STYLE } from './layers';
import { useLayers } from './layers/hooks/useLayers';
import { useMapInteraction } from './layers/hooks/useMapInteraction';
import { CompassWidget, FullscreenWidget, ZoomWidget } from '@deck.gl/widgets';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@deck.gl/widgets/stylesheet.css';
import 'deck.gl/stylesheet.css';

/**
 * Map visualization component
 * Renders a map with multiple layers based on application state
 */
type MapViewProps = {
  onLoadingStatesChange?: (loadingStates: {
    perimeterNrt: boolean;
    fireline: boolean;
    newfirepix: boolean;
  }) => void;
};

const MapView: React.FC<MapViewProps> = ({ onLoadingStatesChange }) => {
  const mapboxAccessToken = useFireExplorerStore.use.mapboxAccessToken();
  const show3DMap = useFireExplorerStore.use.show3DMap();
  const setViewMode = useFireExplorerStore.use.setViewMode();
  const setMapBounds = useFireExplorerStore.use.setMapBounds();

  const viewState = useFireExplorerStore.use.viewState();
  const setViewState = useFireExplorerStore.use.setViewState();
  const setViewStateForUrl = useFireExplorerStore.use.setViewStateForUrl();

  const {
    deckRef,
    handleInteractionStateChange,
    handleViewStateChange,
    isInteracting,
    fitBounds,
  } = useMapInteraction({
    viewState,
    setViewState,
    setViewStateForUrl,
    setMapBounds,
  });

  const { layers, loadingStates, featurePassesFilters } = useLayers({
    isInteracting,
    viewState,
    setViewMode,
  });

  useEffect(() => {
    setViewState(
      {
        ...viewState,
        pitch: show3DMap ? 45 : 0,
      },
      {
        transitionDuration: 300,
      }
    );
  }, [show3DMap]);

  useEffect(() => {
    if (onLoadingStatesChange) {
      onLoadingStatesChange(loadingStates);
    }
  }, [loadingStates, onLoadingStatesChange]);

  useEffect(() => {
    const handleFitBounds = (event) => {
      if (fitBounds && event.detail && event.detail.bounds) {
        fitBounds(event.detail.bounds, {
          padding: event.detail.padding || 40,
        });
      }
    };

    window.addEventListener('fitbounds', handleFitBounds);

    return () => {
      window.removeEventListener('fitbounds', handleFitBounds);
    };
  }, [fitBounds]);

  return (
    <DeckGL
      ref={deckRef}
      viewState={viewState}
      onViewStateChange={handleViewStateChange}
      onInteractionStateChange={handleInteractionStateChange}
      layers={layers}
      controller={{ doubleClickZoom: false }}
      getCursor={({ isDragging }) => (isDragging ? 'grabbing' : 'grab')}
      pickingRadius={10}
      getTooltip={({ object }) =>
        getMapTooltip({ object, featurePassesFilters })
      }
      widgets={[
        new ZoomWidget({
          placement: 'top-left',
          style: {
            marginTop: '55px',
          },
        }),
        new CompassWidget({
          id: 'compass',
          placement: 'top-left',
        }),
        new FullscreenWidget({
          id: 'fullscreen',
          placement: 'top-left',
        }),
      ]}
    >
      <Map
        mapboxAccessToken={mapboxAccessToken}
        mapStyle={MAP_STYLE}
        projection="mercator"
        attributionControl={false}
        reuseMaps
      />
    </DeckGL>
  );
};

function getMapTooltip({ object, featurePassesFilters }) {
  if (!object || !featurePassesFilters(object)) return null;

  const { fireid, primarykey, region, t } = object.properties;

  return {
    html: `
        <table style="font-size: 12px; border-collapse: collapse;">
          <tr><td style="padding: 2px 4px;"><strong>ID</strong></td><td style="padding: 2px 4px;">${fireid}</td></tr>
          <tr><td style="padding: 2px 4px;"><strong>Primary key</strong></td><td style="padding: 2px 4px;">${primarykey}</td></tr>
          <tr><td style="padding: 2px 4px;"><strong>Region</strong></td><td style="padding: 2px 4px;">${region}</td></tr>
          <tr><td style="padding: 2px 4px;"><strong>Timestamp</strong></td><td style="padding: 2px 4px;">${t}</td></tr>
        </table>
      `,
    style: {
      backgroundColor: '#fff',
      color: '#000',
      padding: '6px',
      border: '1px solid #ccc',
      borderRadius: '4px',
    },
  };
}

export default MapView;
