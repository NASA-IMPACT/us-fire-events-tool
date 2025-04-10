import { useState, useEffect, useCallback, useRef } from 'react';
import { useMap } from '../../../contexts/MapContext';
import { getFireId, useEvents } from '../../../contexts/EventsContext';
import { useAppState } from '../../../contexts/AppStateContext';
import { useFilters } from '../../../contexts/FiltersContext';
import { LAYER_TYPES } from '../config/constants';
import { createLayers } from '../LayerFactory';
import _ from 'lodash';

/**
 * Hook for managing deck.gl layers based on application state
 *
 * @param {Object} params - Parameters
 * @param {Function} params.collectVisibleFeatures - Function to collect visible features
 * @param {boolean} params.isInteracting - Whether the user is interacting with the map
 * @param {Object} params.viewState - Current view state
 * @param {Function} params.setViewMode - Function to set the view mode
 * @return {Array<Object>} Array of configured deck.gl layers
 */
export const useLayers = ({
  collectVisibleFeatures,
  isInteracting,
  viewState,
  setViewMode
}) => {
  const [layers, setLayers] = useState([]);
  const [lastTimeRangeEnd, setLastTimeRangeEnd] = useState(null);
  const debouncedTimeUpdate = useRef(null);

  const { windLayerType, show3DMap, timeRange } = useAppState();
  const { firePerimeters, selectEvent } = useEvents();
  const { layerOpacity } = useMap();
  const {
    fireArea,
    duration,
    meanFrp,
    searchTerm,
    region,
    isActive,
    showAdvancedFilters
  } = useFilters();

  const featurePassesFilters = useCallback((feature) => {
    if (!feature?.properties) return false;

    const featureTime = new Date(feature.properties.t).getTime();
    const isInTimeRange =
      featureTime >= timeRange.start.getTime() &&
      featureTime <= timeRange.end.getTime();

    if (!isInTimeRange) return false;

    if (showAdvancedFilters) {
      const area = feature.properties.farea || 0;
      if (area < fireArea.min || area > fireArea.max) return false;

      const durationInDays = feature.properties.duration || 0;
      if (durationInDays < duration.min || durationInDays > duration.max) return false;

      const frp = feature.properties.meanfrp || 0;
      if (frp < meanFrp.min || frp > meanFrp.max) return false;

      if (region && feature.properties.region !== region) return false;

      if (isActive !== null && feature.properties.isactive !== isActive) return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nameMatch =
          feature.properties.primarykey &&
          feature.properties.primarykey.toLowerCase().includes(searchLower);
        const idMatch =
          feature.properties.fireid &&
          feature.properties.fireid.toLowerCase().includes(searchLower);

        if (!nameMatch && !idMatch) return false;
      }
    }

    return true;
  }, [
    timeRange,
    showAdvancedFilters,
    fireArea,
    duration,
    meanFrp,
    region,
    isActive,
    searchTerm
  ]);

  const zoomToFeature = useCallback((feature) => {
    if (!feature?.geometry) return null;

    try {
      let coordinates = [];

      if (feature.geometry.type === 'Polygon') {
        coordinates = feature.geometry.coordinates[0];
      } else if (feature.geometry.type === 'MultiPolygon') {
        feature.geometry.coordinates.forEach(polygon => {
          coordinates = [...coordinates, ...polygon[0]];
        });
      } else if (feature.geometry.type === 'Point') {
        const [lon, lat] = feature.geometry.coordinates;

        return {
          bounds: [[lon - 0.05, lat - 0.05], [lon + 0.05, lat + 0.05]],
          padding: 40
        };
      }

      if (coordinates.length === 0) return null;

      const lons = coordinates.map(c => c[0]);
      const lats = coordinates.map(c => c[1]);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);

      const padding = 40;

      return {
        bounds: [[minLon, minLat], [maxLon, maxLat]],
        padding
      };
    } catch (error) {
      console.error('Error calculating bounds:', error);
      return null;
    }
  }, []);

  const handleClick = useCallback((info) => {
    const { object } = info;
    if (!object || !featurePassesFilters(object)) return;

    const fireId = getFireId(object);
    if (!fireId) {
      console.error("No fire ID found for the selected feature");
      return;
    }

    selectEvent(fireId);

    const bounds = zoomToFeature(object);
    if (bounds) {
      const fitBoundsEvent = new CustomEvent('fitbounds', {
        detail: bounds
      });
      window.dispatchEvent(fitBoundsEvent);
    }

    setViewMode('detail');
  }, [featurePassesFilters, zoomToFeature, selectEvent, setViewMode]);

  const handleTileLoad = useCallback((tile) => {
    if (!tile?.data?.length) return;

    if (!isInteracting) {
      collectVisibleFeatures();
    }
  }, [collectVisibleFeatures, isInteracting]);

  useEffect(() => {
    debouncedTimeUpdate.current = _.debounce((newTimeEnd) => {
      setLastTimeRangeEnd(newTimeEnd);
    }, 500);

    return () => {
      if (debouncedTimeUpdate.current) {
        debouncedTimeUpdate.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (windLayerType && debouncedTimeUpdate.current) {
      debouncedTimeUpdate.current(timeRange.end);
    }
  }, [timeRange.end, windLayerType]);

  useEffect(() => {
    const initializeLayers = async () => {
      const layerConfigs = [];

      if (show3DMap) {
        layerConfigs.push({
          type: LAYER_TYPES.TERRAIN,
          opacity: layerOpacity,
          viewState
        });
      }

      layerConfigs.push({
        type: LAYER_TYPES.MVT,
        url: 'https://firenrt.delta-backend.com/collections/public.eis_fire_snapshot_perimeter_nrt/tiles/{z}/{x}/{y}',
        filterFunction: featurePassesFilters,
        opacity: layerOpacity,
        onTileLoad: handleTileLoad,
        onClick: handleClick,
        updateTriggers: {
          getFillColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive, searchTerm],
          getLineColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive, searchTerm],
          getLineWidth: [timeRange],
          getDashArray: [timeRange]
        },
        timeRange,
        show3DMap
      });

      if (firePerimeters) {
        layerConfigs.push({
          type: show3DMap ? LAYER_TYPES.GEOJSON_3D : LAYER_TYPES.GEOJSON_2D,
          data: firePerimeters,
          filterFunction: featurePassesFilters,
          opacity: layerOpacity,
          updateTriggers: {
            getFillColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive, searchTerm],
            getLineColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive, searchTerm],
            getLineWidth: [timeRange],
            getDashArray: [timeRange]
          },
          onClick: handleClick,
          timeRange
        });
      }

      if (windLayerType === 'wind' && lastTimeRangeEnd) {
        layerConfigs.push({
          type: LAYER_TYPES.WIND,
          timeRangeEnd: lastTimeRangeEnd,
          opacity: layerOpacity
        });
      }

      if (windLayerType === 'grid' && lastTimeRangeEnd) {
        layerConfigs.push({
          type: LAYER_TYPES.GRID,
          timeRangeEnd: lastTimeRangeEnd,
          opacity: layerOpacity
        });
      }

      const newLayers = await createLayers(layerConfigs);

      setLayers(newLayers);
    };

    initializeLayers();
  }, [
    windLayerType,
    firePerimeters,
    handleTileLoad,
    featurePassesFilters,
    handleClick,
    layerOpacity,
    show3DMap,
    lastTimeRangeEnd,
    collectVisibleFeatures,
    isInteracting,
    timeRange,
    showAdvancedFilters,
    fireArea,
    duration,
    meanFrp,
    region,
    isActive,
    searchTerm,
    viewState,
    zoomToFeature
  ]);

  return layers;
};