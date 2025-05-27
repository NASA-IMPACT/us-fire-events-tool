import { useState, useEffect, useCallback, useRef } from 'react';
import { useMap } from '../../../contexts/MapContext';
import { getFireId, useEvents } from '../../../contexts/EventsContext';
import { useAppState } from '../../../contexts/AppStateContext';
import { useFilters } from '../../../contexts/FiltersContext';
import { LAYER_TYPES } from '../config/constants';
import { createLayers } from '../LayerFactory';
import _ from 'lodash';
import { useEnv } from '../../../contexts/EnvContext';

export type MVTLayerId =
  | 'perimeterNrt'
  | 'fireline'
  | 'newfirepix';

type UseLayersProps = {
  collectVisibleFeatures: () => void;
  isInteracting: boolean;
  viewState: Record<string, any>;
  setViewMode: (mode: 'detail' | 'default' | string) => void;
};

type LoadingStates = {
  perimeterNrt: boolean;
  fireline: boolean;
  newfirepix: boolean;
};

/**
 * Custom hook that returns an array of deck.gl layers based on application state.
 * It dynamically configures and filters MVT, GeoJSON, Terrain and wind/grid layers based on user-selected options,
 * time range, and filter settings from multiple contexts (AppState, Events, Filters, and Map).
 *
 * Layer visibility is controlled by boolean flags such as `showPerimeterNrt`, `showFireline`, etc.
 * Fire features are filtered based on advanced filter options like area, duration, FRP, region, and activity status.
 *
 * Also manages side effects such as selecting events and fitting bounds on map click,
 * and collects visible features for analysis after tile loading.
 *
 * @param {Object} params
 * @param {Function} params.collectVisibleFeatures - Called after tile load to collect visible features (used for analytics/context updates)
 * @param {boolean} params.isInteracting - Indicates if the user is currently interacting with the map (used to delay certain updates)
 * @param {Object} params.viewState - Current map view state (used for terrain layer configuration)
 * @param {Function} params.setViewMode - Callback to change the view mode (e.g., to "detail" when a feature is selected)
 *
 * @returns {Object} - Object containing layers array and loading states for each layer
 */
export const useLayers = ({
  collectVisibleFeatures,
  isInteracting,
  viewState,
  setViewMode
}: UseLayersProps) => {
  const { mapboxAccessToken, featuresApiEndpoint: baseUrl } = useEnv();

  const MVT_URLS: Record<MVTLayerId, string> = {
    perimeterNrt: `${baseUrl}/collections/pg_temp.eis_fire_lf_perimeter_nrt_latest/tiles/WebMercatorQuad/{z}/{x}/{y}?bbox=-125.0,24.5,-66.0,49.5&properties=duration,farea,meanfrp,fperim,n_pixels,n_newpixels,pixden,fireid,primarykey,t,region`,
    fireline: `${baseUrl}/collections/public.eis_fire_lf_fireline_nrt/tiles/WebMercatorQuad/{z}/{x}/{y}?bbox=-125.0,24.5,-66.0,49.5&properties=duration,farea,meanfrp,fperim,n_pixels,n_newpixels,pixden,fireid,primarykey,t,region`,
    newfirepix: `${baseUrl}/collections/public.eis_fire_lf_newfirepix_nrt/tiles/WebMercatorQuad/{z}/{x}/{y}?bbox=-125.0,24.5,-66.0,49.5&properties=duration,farea,meanfrp,fperim,n_pixels,n_newpixels,pixden,fireid,primarykey,t,region`
  };

  const [layers, setLayers] = useState([]);
  const [lastTimeRangeEnd, setLastTimeRangeEnd] = useState(null);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    perimeterNrt: false,
    fireline: false,
    newfirepix: false
  });

  const debouncedTimeUpdate = useRef(null);
  const layerRefs = useRef<Record<string, any>>({});

  const { windLayerType, show3DMap, timeRange, showPerimeterNrt, showFireline, showNewFirepix  } = useAppState();
  const { firePerimeters, selectEvent } = useEvents();
  const { layerOpacity } = useMap();
  const {
    fireArea,
    duration,
    meanFrp,
    region,
    isActive,
    showAdvancedFilters
  } = useFilters();

  useEffect(() => {
    const checkLoadingStates = () => {
      const newLoadingStates = { ...loadingStates };
      let hasChanges = false;

      Object.keys(layerRefs.current).forEach(layerId => {
        const layer = layerRefs.current[layerId];
        const layerKey = layerId.replace('perimeter-nrt', 'perimeterNrt') as keyof LoadingStates;

        if (layer && typeof layer.isLoaded === 'boolean') {
          const wasLoading = loadingStates[layerKey];
          const isNowLoaded = layer.isLoaded;

          if (wasLoading && isNowLoaded) {
            newLoadingStates[layerKey] = false;
            hasChanges = true;

            if (!isInteracting) {
              collectVisibleFeatures();
            }
          }
        }
      });

      if (hasChanges) {
        setLoadingStates(newLoadingStates);
      }
    };

    const interval = setInterval(checkLoadingStates, 100);

    return () => clearInterval(interval);
  }, [loadingStates, isInteracting, collectVisibleFeatures]);

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
  ]);

  const zoomToFeature = useCallback((feature) => {
    if (!feature?.geometry) return null;

    try {
      let coordinates: number[][] = [];

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

  const createTileLoadHandler = useCallback((layerId: keyof LoadingStates) => {
    return (tile) => {

      if (!isInteracting && tile?.data?.length) {
        collectVisibleFeatures();
      }
    };
  }, [collectVisibleFeatures, isInteracting]);

  const createTileErrorHandler = useCallback((layerId: keyof LoadingStates) => {
    return (error) => {
      console.error(`Tile loading error for ${layerId}:`, error);
    };
  }, []);

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
          mapboxAccessToken,
          viewState,
        });
      }

      if (showPerimeterNrt) {
        setLoadingStates(prev => ({ ...prev, perimeterNrt: true }));

        layerConfigs.push({
          type: LAYER_TYPES.MVT,
          id: 'perimeter-nrt',
          data: MVT_URLS.perimeterNrt,
          filterFunction: featurePassesFilters,
          opacity: layerOpacity,
          onTileLoad: createTileLoadHandler('perimeterNrt'),
          onTileError: createTileErrorHandler('perimeterNrt'),
          onClick: handleClick,
          updateTriggers: {
            getFillColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive],
            getLineColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive],
          }
        });
      }

      if (showFireline) {
        setLoadingStates(prev => ({ ...prev, fireline: true }));

        layerConfigs.push({
          type: LAYER_TYPES.MVT,
          id: 'fireline',
          data: MVT_URLS.fireline,
          filterFunction: featurePassesFilters,
          opacity: layerOpacity,
          onTileLoad: createTileLoadHandler('fireline'),
          onTileError: createTileErrorHandler('fireline'),
          onClick: handleClick,
          updateTriggers: {
            getFillColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive],
            getLineColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive],
          }
        });
      }

      if (showNewFirepix) {
        setLoadingStates(prev => ({ ...prev, newfirepix: true }));

        layerConfigs.push({
          type: LAYER_TYPES.MVT,
          id: 'newfirepix',
          data: MVT_URLS.newfirepix,
          filterFunction: featurePassesFilters,
          opacity: layerOpacity,
          lineWidthMinPixels: 2,
          onTileLoad: createTileLoadHandler('newfirepix'),
          onTileError: createTileErrorHandler('newfirepix'),
          onClick: handleClick,
          updateTriggers: {
            getFillColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive],
            getLineColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive],
          }
        });
      }

      if (firePerimeters) {
        layerConfigs.push({
          type: show3DMap ? LAYER_TYPES.GEOJSON_3D : LAYER_TYPES.GEOJSON_2D,
          data: firePerimeters,
          filterFunction: featurePassesFilters,
          opacity: layerOpacity,
          updateTriggers: {
            getFillColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive],
            getLineColor: [timeRange, showAdvancedFilters, fireArea, duration, meanFrp, region, isActive],
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

      layerRefs.current = {};
      newLayers.forEach(layer => {
        if (layer && layer.id) {
          layerRefs.current[layer.id] = layer;
        }
      });

      setLayers(newLayers);
    };

    initializeLayers();
  }, [
    windLayerType,
    firePerimeters,
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
    viewState,
    zoomToFeature,
    showFireline,
    showNewFirepix,
    showPerimeterNrt,
    createTileLoadHandler,
    createTileErrorHandler
  ]);

  return { layers, loadingStates, featurePassesFilters };
};