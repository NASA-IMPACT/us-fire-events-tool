import { useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useEvents } from '../contexts/EventsContext';
import { useAppState } from '../contexts/AppStateContext';
import { INITIAL_VIEW_STATE, MAP_STYLE } from './layers';
import { useLayers } from './layers/hooks/useLayers';
import { useMapInteraction } from './layers/hooks/useMapInteraction';

/**
 * Map visualization component
 * Renders a map with multiple layers based on application state
 */
const MapView = () => {
    const { updateEvents } = useEvents();
    const { show3DMap, setMapBounds, setViewMode } = useAppState();

    const {
        viewState,
        deckRef,
        handleInteractionStateChange,
        handleViewStateChange,
        collectVisibleFeatures,
        isInteracting,
        fitBounds
    } = useMapInteraction({
        initialViewState: INITIAL_VIEW_STATE,
        setMapBounds,
        updateEvents,
        show3DMap
    });

    const layers = useLayers({
        collectVisibleFeatures,
        isInteracting,
        viewState,
        setViewMode
    });

    useEffect(() => {
        const handleFitBounds = (event) => {
            if (fitBounds && event.detail && event.detail.bounds) {
                fitBounds(event.detail.bounds, {
                    padding: event.detail.padding || 40
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
            getCursor={({isDragging}) => isDragging ? 'grabbing' : 'grab'}
            onLoad={() => {
                setTimeout(collectVisibleFeatures, 500);
            }}
        >
            <Map
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                mapStyle={MAP_STYLE}
                projection="mercator"
                attributionControl={false}
                reuseMaps
            />
        </DeckGL>
    );
};

export default MapView;