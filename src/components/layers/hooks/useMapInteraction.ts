import { useState, useRef, useCallback, useEffect } from 'react';
import { WebMercatorViewport } from '@deck.gl/core';
import {
  FEATURES_COLLECTION_DEBOUNCE,
  INTERACTION_TIMEOUT,
} from '../config/constants';

import _ from 'lodash';

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
  updateEvents,
}) => {
  const [isInteracting, setIsInteracting] = useState(false);

  const deckRef = useRef(null);
  const interactionTimeoutRef = useRef(null);
  const lastBoundsRef = useRef(null);
  const collectVisibleFeaturesRef = useRef(null);
  const isMountedRef = useRef(true);

  const cleanup = useCallback(() => {
    if (interactionTimeoutRef.current !== null) {
      window.clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = null;
    }

    if (collectVisibleFeaturesRef.current) {
      collectVisibleFeaturesRef.current.cancel();
      collectVisibleFeaturesRef.current = null;
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

      const { width, height, layerManager } = deckRef.current.deck;

      if (!layerManager || !layerManager.layers) {
        console.warn('LayerManager or layers not available');
        return;
      }

      const availableLayerIds = layerManager.layers.map((l) => l.id);

      const priorityLayers = ['perimeter-nrt', 'fireline', 'newfirepix'];
      const targetLayerId = priorityLayers.find((id) =>
        availableLayerIds.includes(id)
      );

      if (!targetLayerId) {
        console.warn(
          'No priority layers found in available layers:',
          availableLayerIds
        );
        return;
      }

      const features = deckRef.current.pickObjects({
        x: 0,
        y: 0,
        width,
        height,
        layerIds: [targetLayerId],
        ignoreVisibility: true,
      });

      if (isMountedRef.current) {
        updateEvents(features);
      }
    } catch (error) {
      console.error('Error updating context after interaction:', error);
    }
  }, [setMapBounds, updateEvents, setViewStateForUrl, viewState]);

  useEffect(() => {
    try {
      collectVisibleFeaturesRef.current = _.debounce(() => {
        if (!isInteracting) {
          updateStoreAfterInteraction();
        }
      }, FEATURES_COLLECTION_DEBOUNCE);
    } catch (error) {
      console.error('Error creating debounced function:', error);
    }

    return () => {
      if (collectVisibleFeaturesRef.current) {
        collectVisibleFeaturesRef.current.cancel();
        collectVisibleFeaturesRef.current = null;
      }
    };
  }, [isInteracting, updateStoreAfterInteraction]);

  const collectVisibleFeatures = useCallback(() => {
    try {
      if (collectVisibleFeaturesRef.current) {
        collectVisibleFeaturesRef.current();
      }
    } catch (error) {
      console.error('Error collecting visible features:', error);
    }
  }, []);

  const handleInteractionStateChange = useCallback(
    ({ isDragging, isPanning, isRotating, isZooming }) => {
      try {
        const isCurrentlyInteracting =
          isDragging || isPanning || isRotating || isZooming;

        if (interactionTimeoutRef.current !== null) {
          window.clearTimeout(interactionTimeoutRef.current);
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
    (bounds, { padding = 40 } = {}) => {
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
          { padding }
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

        setViewState({
          ...viewState,
          longitude: newViewport.longitude,
          latitude: newViewport.latitude,
          zoom: newViewport.zoom,
        });
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
    collectVisibleFeatures,
    fitBounds,
  };
};
