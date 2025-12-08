import { useState, useRef, useCallback, useEffect } from 'react';
import { WebMercatorViewport } from '@deck.gl/core';
import {
  FLY_TO_TRANSITION,
  INTERACTION_TIMEOUT,
  MAP_VIEWPORT_PADDING,
} from '../config/constants';

import {
  DETAIL_EVENT_PANEL_WIDTH_DESKTOP,
  DETAIL_TIME_CHART_PANEL_HEIGHT,
  HEADER_HEIGHT,
} from '@/constants';

/**
 * Hook for handling map interactions and view state
 * Store is the source of truth for viewState
 *
 * @param {Object} params - Parameters
 * @param {Object} params.viewState - Current view state from store
 * @param {Function} params.setViewState - Function to update view state in store
 * @param {Function} params.setViewStateForUrl - Function to update view state for URL in store
 * @param {Function} params.setMapBounds - Function to update map bounds in store
 * @param {Function} params.updateEvents - Function to update events in store
 * @return {Object} Map interaction state and handlers
 */
export const useMapInteraction = ({
  viewState,
  setViewState,
  setViewStateForUrl,
  setMapBounds,
}) => {
  const [isInteracting, setIsInteracting] = useState(false);

  const deckRef = useRef(null);
  const interactionTimeoutRef = useRef(null);
  const lastBoundsRef = useRef(null);
  const isMountedRef = useRef(true);

  const cleanup = useCallback(() => {
    if (interactionTimeoutRef.current !== null) {
      clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = null;
    }
  }, []);

  const updateBounds = useCallback(
    (newViewState) => {
      try {
        const viewport = new WebMercatorViewport(newViewState);
        const bounds = viewport.getBounds();
        lastBoundsRef.current = bounds;

        if (!isInteracting) {
          setMapBounds(bounds);
        }
      } catch (error) {
        console.error('Error updating bounds:', error);
      }
    },
    [setMapBounds, isInteracting]
  );

  const updateStoreAfterInteraction = useCallback(() => {
    try {
      if (!lastBoundsRef.current || !deckRef.current) return;

      setMapBounds(lastBoundsRef.current);

      // Sync the debounced URL state prop in the store with the current view state now that user interaction has completed.
      // This prevents browser history pollution during dragging/zooming by only updating the URL
      // after the user has finished interacting with the map.
      if (setViewStateForUrl) {
        setViewStateForUrl(viewState);
      }
    } catch (error) {
      console.error('Error updating store after interaction:', error);
    }
  }, [setMapBounds, setViewStateForUrl, viewState]);

  const handleInteractionStateChange = useCallback(
    ({
      isDragging,
      isPanning,
      isRotating,
      isZooming,
    }: {
      isDragging?: boolean;
      isPanning?: boolean;
      isRotating?: boolean;
      isZooming?: boolean;
    }) => {
      try {
        const isCurrentlyInteracting =
          isDragging || isPanning || isRotating || isZooming;

        if (interactionTimeoutRef.current !== null) {
          clearTimeout(interactionTimeoutRef.current);
          interactionTimeoutRef.current = null;
        }

        setIsInteracting(isCurrentlyInteracting);

        if (!isCurrentlyInteracting) {
          interactionTimeoutRef.current = setTimeout(() => {
            updateStoreAfterInteraction();
            interactionTimeoutRef.current = null;
          }, INTERACTION_TIMEOUT);
        }
      } catch (error) {
        console.error('Error handling interaction state change:', error);
      }
    },
    [updateStoreAfterInteraction]
  );

  const handleViewStateChange = useCallback(
    ({ viewState: newViewState }) => {
      try {
        setViewState(newViewState);
        updateBounds(newViewState);
      } catch (error) {
        console.error('Error handling view state change:', error);
      }
    },
    [setViewState, updateBounds]
  );

  const fitBounds = useCallback(
    (bounds) => {
      if (!bounds || bounds.length !== 2) {
        console.warn('Invalid bounds provided to fitBounds', bounds);
        return;
      }

      try {
        const [[minLng, minLat], [maxLng, maxLat]] = bounds;

        if (
          typeof minLng !== 'number' ||
          typeof minLat !== 'number' ||
          typeof maxLng !== 'number' ||
          typeof maxLat !== 'number' ||
          !isFinite(minLng) ||
          !isFinite(minLat) ||
          !isFinite(maxLng) ||
          !isFinite(maxLat)
        ) {
          console.warn('Invalid coordinate values in bounds', bounds);
          return;
        }

        if (minLng >= maxLng || minLat >= maxLat) {
          console.warn(
            'Invalid bounds: min values should be less than max values',
            bounds
          );
          return;
        }

        const newViewport = new WebMercatorViewport(viewState).fitBounds(
          bounds,
          {
            padding: {
              top: MAP_VIEWPORT_PADDING + HEADER_HEIGHT,
              left: MAP_VIEWPORT_PADDING,
              right: MAP_VIEWPORT_PADDING + DETAIL_EVENT_PANEL_WIDTH_DESKTOP,
              bottom: MAP_VIEWPORT_PADDING + DETAIL_TIME_CHART_PANEL_HEIGHT,
            },
          }
        );

        if (
          !isFinite(newViewport.longitude) ||
          !isFinite(newViewport.latitude) ||
          !isFinite(newViewport.zoom) ||
          newViewport.zoom < 0 ||
          newViewport.zoom > 24
        ) {
          console.warn('Invalid viewport calculated from bounds', newViewport);
          return;
        }

        setViewState(
          {
            ...viewState,
            longitude: newViewport.longitude,
            latitude: newViewport.latitude,
            zoom: newViewport.zoom,
          },
          FLY_TO_TRANSITION
        );
      } catch (error) {
        console.error('Error in fitBounds:', error);
      }
    },
    [viewState, setViewState]
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    viewState,
    isInteracting,
    deckRef,
    handleInteractionStateChange,
    handleViewStateChange,
    fitBounds,
  };
};
