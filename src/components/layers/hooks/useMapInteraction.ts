import { useState, useRef, useCallback, useEffect } from 'react';
import { WebMercatorViewport } from '@deck.gl/core';
import { FEATURES_COLLECTION_DEBOUNCE, INTERACTION_TIMEOUT } from '../config/constants';

import _ from 'lodash';

/**
 * Hook for handling map interactions and view state
 *
 * @param {Object} params - Parameters
 * @param {Object} params.initialViewState - Initial view state
 * @param {Function} params.setMapBounds - Function to update map bounds in context
 * @param {Function} params.updateEvents - Function to update events in context
 * @param {boolean} params.show3DMap - Whether 3D mode is enabled
 * @return {Object} Map interaction state and handlers
 */
export const useMapInteraction = ({
  initialViewState,
  setMapBounds,
  updateEvents,
  show3DMap
}) => {
  const [viewState, setViewState] = useState(initialViewState);
  const [isInteracting, setIsInteracting] = useState(false);

  const deckRef = useRef(null);
  const interactionTimeoutRef = useRef(null);
  const lastBoundsRef = useRef(null);
  const collectVisibleFeaturesRef = useRef(null);

  const updateBounds = useCallback((newViewState) => {
    const viewport = new WebMercatorViewport(newViewState);
    const bounds = viewport.getBounds();
    lastBoundsRef.current = bounds;

    if (!isInteracting) {
      setMapBounds(bounds);
    }
  }, [setMapBounds, isInteracting]);

  const updateContextAfterInteraction = useCallback(() => {
    if (!lastBoundsRef.current || !deckRef.current) return;

    setMapBounds(lastBoundsRef.current);

    const { width, height, layerManager } = deckRef.current.deck;
    const availableLayerIds = layerManager.layers.map(l => l.id);

    const priorityLayers = ['perimeterNrt', 'fireline', 'newfirepix', 'archivePerimeters', 'archiveFirepix'];
    const targetLayerId = priorityLayers.find(id => availableLayerIds.includes(id));
    if (!targetLayerId) return;

    const features = deckRef.current.pickObjects({
      x: 0,
      y: 0,
      width,
      height,
      layerIds: [targetLayerId],
      ignoreVisibility: true
    });

    updateEvents(features);
  }, [setMapBounds, updateEvents]);

  useEffect(() => {
    collectVisibleFeaturesRef.current = _.debounce(() => {
      if (!isInteracting) {
        updateContextAfterInteraction();
      }
    }, FEATURES_COLLECTION_DEBOUNCE);

    return () => {
      if (collectVisibleFeaturesRef.current) {
        collectVisibleFeaturesRef.current.cancel();
      }
    };
  }, [isInteracting, updateContextAfterInteraction]);

  const collectVisibleFeatures = useCallback(() => {
    if (collectVisibleFeaturesRef.current) {
      collectVisibleFeaturesRef.current();
    }
  }, []);

  const handleInteractionStateChange = useCallback(({ isDragging, isPanning, isRotating, isZooming }) => {
    const isCurrentlyInteracting = isDragging || isPanning || isRotating || isZooming;

    if (interactionTimeoutRef.current !== null) {
      window.clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = null;
    }

    setIsInteracting(isCurrentlyInteracting);

    if (!isCurrentlyInteracting) {
      interactionTimeoutRef.current = window.setTimeout(() => {
        updateContextAfterInteraction();
      }, INTERACTION_TIMEOUT);
    }
  }, [updateContextAfterInteraction]);

  const handleViewStateChange = useCallback(({ viewState: newViewState }) => {
    setViewState(newViewState);
    updateBounds(newViewState);
  }, [updateBounds]);

  useEffect(() => {
    if (show3DMap) {
      setViewState(prev => ({
        ...prev,
        pitch: 45,
        transitionDuration: 300,
      }));
    } else {
      setViewState(prev => ({
        ...prev,
        pitch: 0,
        transitionDuration: 300,
      }));
    }
  }, [show3DMap]);

  const fitBounds = useCallback((bounds, { padding = 40 } = {}) => {
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
        typeof maxLat !== 'number'
      ) {
        console.warn('Invalid coordinate values in bounds', bounds);
        return;
      }

      const newViewport = new WebMercatorViewport(viewState)
        .fitBounds(bounds, { padding });

      setViewState({
        ...viewState,
        longitude: newViewport.longitude,
        latitude: newViewport.latitude,
        zoom: newViewport.zoom,
        transitionDuration: 500,
        transitionInterpolator: null
      });
    } catch (error) {
      console.error('Error in fitBounds:', error);
    }
  }, [viewState]);

  return {
    viewState,
    setViewState,
    isInteracting,
    deckRef,
    handleInteractionStateChange,
    handleViewStateChange,
    collectVisibleFeatures,
    fitBounds
  };
};