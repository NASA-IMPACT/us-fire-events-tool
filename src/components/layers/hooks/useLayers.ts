import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useFireExplorerStore } from '@/state/useFireExplorerStore';
import { LAYER_TYPES } from '../config/constants';
import { createLayers } from '../LayerFactory';
import _ from 'lodash';
import { fitMapToBounds } from '@/utils/fireUtils';

export type MVTLayerId = 'perimeterNrt' | 'fireline' | 'newfirepix';

type LoadingStates = {
  perimeterNrt: boolean;
  fireline: boolean;
  newfirepix: boolean;
};

const useMVTUrls = () => {
  const baseUrl = useFireExplorerStore.use.featuresApiEndpoint();
  const timeRange = useFireExplorerStore.use.timeRange();

  const [debouncedTimeRange, setDebouncedTimeRange] = useState(timeRange);
  const debounceFn = useRef(_.debounce(setDebouncedTimeRange, 300)).current;

  useEffect(() => {
    debounceFn(timeRange);
  }, [timeRange.start.getTime(), timeRange.end.getTime()]);

  const datetimeStart = debouncedTimeRange.start.toISOString();
  const datetimeEnd = debouncedTimeRange.end.toISOString();
  const datetimeParam = `&datetime=${datetimeStart}/${datetimeEnd}`;

  return useMemo<Record<MVTLayerId, string>>(
    () => ({
      perimeterNrt: `${baseUrl}/collections/pg_temp.eis_fire_lf_perimeter_nrt_latest/tiles/WebMercatorQuad/{z}/{x}/{y}?bbox=-165.0,24.5,-66.0,69.5${datetimeParam}&properties=duration,farea,meanfrp,fperim,n_pixels,n_newpixels,pixden,fireid,primarykey,t,region`,
      fireline: `${baseUrl}/collections/public.eis_fire_lf_fireline_nrt/tiles/WebMercatorQuad/{z}/{x}/{y}?bbox=-165.0,24.5,-66.0,69.5${datetimeParam}&properties=duration,farea,meanfrp,fperim,n_pixels,n_newpixels,pixden,fireid,primarykey,t,region`,
      newfirepix: `${baseUrl}/collections/public.eis_fire_lf_newfirepix_nrt/tiles/WebMercatorQuad/{z}/{x}/{y}?bbox=-165.0,24.5,-66.0,69.5${datetimeParam}&properties=duration,farea,meanfrp,fperim,n_pixels,n_newpixels,pixden,fireid,primarykey,t,region`,
    }),
    [baseUrl, datetimeStart, datetimeEnd]
  );
};

const useFeatureFilters = () => {
  const timeRange = useFireExplorerStore.use.timeRange();
  const showAdvancedFilters = useFireExplorerStore.use.showAdvancedFilters();
  const fireArea = useFireExplorerStore.use.fireArea();
  const duration = useFireExplorerStore.use.duration();
  const meanFrp = useFireExplorerStore.use.meanFrp();
  const region = useFireExplorerStore.use.region();
  const isActive = useFireExplorerStore.use.isActive();

  return useMemo(() => {
    return (feature) => {
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
        if (durationInDays < duration.min || durationInDays > duration.max)
          return false;

        const frp = feature.properties.meanfrp || 0;
        if (frp < meanFrp.min || frp > meanFrp.max) return false;

        if (region && feature.properties.region !== region) return false;

        if (isActive !== null && feature.properties.isactive !== isActive)
          return false;
      }

      return true;
    };
  }, [
    timeRange,
    showAdvancedFilters,
    fireArea,
    duration,
    meanFrp,
    region,
    isActive,
  ]);
};

const useLayerHandlers = (setViewMode: (mode: string) => void) => {
  const selectEvent = useFireExplorerStore.use.selectEvent();
  const baseUrl = useFireExplorerStore.use.featuresApiEndpoint();

  const getFireId = useCallback((feature: any): string | null => {
    if (!feature?.properties) return null;
    return feature.properties.fireid || feature.properties.primarykey || null;
  }, []);

  const handleClick = useCallback(
    (info) => {
      const { object } = info;
      if (!object) return;

      const fireId = getFireId(object);
      if (!fireId) {
        console.error('No fire ID found for the selected feature');
        return;
      }

      selectEvent(fireId, baseUrl);
      fitMapToBounds(object);
      setViewMode('detail');
    },
    [getFireId, selectEvent, baseUrl, setViewMode]
  );

  return { handleClick };
};

const useLoadingStates = (
  layerRefs: React.MutableRefObject<Record<string, any>>,
  isInteracting: boolean,
  collectVisibleFeatures: () => void
) => {
  const showPerimeterNrt = useFireExplorerStore.use.showPerimeterNrt();
  const showFireline = useFireExplorerStore.use.showFireline();
  const showNewFirepix = useFireExplorerStore.use.showNewFirepix();

  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    perimeterNrt: false,
    fireline: false,
    newfirepix: false,
  });

  const createTileLoadHandler = useCallback(() => {
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
    const newLoadingStates = {
      perimeterNrt: showPerimeterNrt,
      fireline: showFireline,
      newfirepix: showNewFirepix,
    };
    setLoadingStates(newLoadingStates);
  }, [showPerimeterNrt, showFireline, showNewFirepix]);

  useEffect(() => {
    const checkLoadingStates = () => {
      const newLoadingStates = { ...loadingStates };
      let hasChanges = false;

      Object.keys(layerRefs.current).forEach((layerId) => {
        const layer = layerRefs.current[layerId];
        const layerKey = layerId.replace(
          'perimeter-nrt',
          'perimeterNrt'
        ) as keyof LoadingStates;

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

  return { loadingStates, createTileLoadHandler, createTileErrorHandler };
};

const useTimeRangeDebounce = () => {
  const timeRange = useFireExplorerStore.use.timeRange();
  const windLayerType = useFireExplorerStore.use.windLayerType();
  const [lastTimeRangeEnd, setLastTimeRangeEnd] = useState(null);
  const debouncedTimeUpdate = useRef(null);

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

  return lastTimeRangeEnd;
};

const useUpdateTriggers = () => {
  const timeRange = useFireExplorerStore.use.timeRange();
  const showAdvancedFilters = useFireExplorerStore.use.showAdvancedFilters();
  const fireArea = useFireExplorerStore.use.fireArea();
  const duration = useFireExplorerStore.use.duration();
  const meanFrp = useFireExplorerStore.use.meanFrp();
  const region = useFireExplorerStore.use.region();
  const isActive = useFireExplorerStore.use.isActive();

  return useMemo(
    () => ({
      getFillColor: [
        timeRange.start.getTime(),
        timeRange.end.getTime(),
        showAdvancedFilters,
        fireArea.min,
        fireArea.max,
        duration.min,
        duration.max,
        meanFrp.min,
        meanFrp.max,
        region,
        isActive,
      ],
      getLineColor: [
        timeRange.start.getTime(),
        timeRange.end.getTime(),
        showAdvancedFilters,
        fireArea.min,
        fireArea.max,
        duration.min,
        duration.max,
        meanFrp.min,
        meanFrp.max,
        region,
        isActive,
      ],
    }),
    [
      timeRange.start,
      timeRange.end,
      showAdvancedFilters,
      fireArea.min,
      fireArea.max,
      duration.min,
      duration.max,
      meanFrp.min,
      meanFrp.max,
      region,
      isActive,
    ]
  );
};

type UseLayersProps = {
  collectVisibleFeatures: () => void;
  isInteracting: boolean;
  viewState: Record<string, any>;
  setViewMode: (mode: 'detail' | 'default' | string) => void;
};

/**
 * Main hook that orchestrates all layer management.
 * Deck.gl's layers should be recreated (not mutated) when configuration changes.
 * This hook serves as an orchestrator for the layer recreation, the filtering logic and tile loading states.
 */
export const useLayers = ({
  collectVisibleFeatures,
  isInteracting,
  viewState,
  setViewMode,
}: UseLayersProps) => {
  const [layers, setLayers] = useState([]);
  const layerRefs = useRef<Record<string, any>>({});

  const MVT_URLS = useMVTUrls();
  const featurePassesFilters = useFeatureFilters();
  const { handleClick } = useLayerHandlers(setViewMode);
  const { loadingStates, createTileLoadHandler, createTileErrorHandler } =
    useLoadingStates(layerRefs, isInteracting, collectVisibleFeatures);
  const lastTimeRangeEnd = useTimeRangeDebounce();
  const updateTriggers = useUpdateTriggers();

  const windLayerType = useFireExplorerStore.use.windLayerType();
  const show3DMap = useFireExplorerStore.use.show3DMap();
  const timeRange = useFireExplorerStore.use.timeRange();
  const showPerimeterNrt = useFireExplorerStore.use.showPerimeterNrt();
  const showFireline = useFireExplorerStore.use.showFireline();
  const showNewFirepix = useFireExplorerStore.use.showNewFirepix();
  const layerOpacity = useFireExplorerStore.use.layerOpacity();
  const firePerimeters = useFireExplorerStore.use.firePerimeters();
  const mapboxAccessToken = useFireExplorerStore.use.mapboxAccessToken();

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
        layerConfigs.push({
          type: LAYER_TYPES.MVT,
          id: 'perimeter-nrt',
          data: MVT_URLS.perimeterNrt,
          filterFunction: featurePassesFilters,
          opacity: layerOpacity,
          onTileLoad: createTileLoadHandler(),
          onTileError: createTileErrorHandler('perimeterNrt'),
          onClick: handleClick,
          updateTriggers,
        });
      }

      if (showFireline) {
        layerConfigs.push({
          type: LAYER_TYPES.MVT,
          id: 'fireline',
          data: MVT_URLS.fireline,
          filterFunction: featurePassesFilters,
          opacity: layerOpacity,
          onTileLoad: createTileLoadHandler(),
          onTileError: createTileErrorHandler('fireline'),
          onClick: handleClick,
          updateTriggers,
        });
      }

      if (showNewFirepix) {
        layerConfigs.push({
          type: LAYER_TYPES.MVT,
          id: 'newfirepix',
          data: MVT_URLS.newfirepix,
          filterFunction: featurePassesFilters,
          opacity: layerOpacity,
          lineWidthMinPixels: 2,
          onTileLoad: createTileLoadHandler(),
          onTileError: createTileErrorHandler('newfirepix'),
          onClick: handleClick,
          updateTriggers,
        });
      }

      if (firePerimeters) {
        layerConfigs.push({
          type: show3DMap ? LAYER_TYPES.GEOJSON_3D : LAYER_TYPES.GEOJSON_2D,
          data: firePerimeters,
          filterFunction: featurePassesFilters,
          opacity: layerOpacity,
          updateTriggers: {
            ...updateTriggers,
            getLineWidth: [timeRange.start.getTime(), timeRange.end.getTime()],
            getDashArray: [timeRange.start.getTime(), timeRange.end.getTime()],
          },
          onClick: handleClick,
          timeRange,
        });
      }

      if (windLayerType === 'wind' && lastTimeRangeEnd) {
        layerConfigs.push({
          type: LAYER_TYPES.WIND,
          timeRangeEnd: lastTimeRangeEnd,
          opacity: layerOpacity,
        });
      }

      if (windLayerType === 'grid' && lastTimeRangeEnd) {
        layerConfigs.push({
          type: LAYER_TYPES.GRID,
          timeRangeEnd: lastTimeRangeEnd,
          opacity: layerOpacity,
        });
      }

      const newLayers = await createLayers(layerConfigs);

      layerRefs.current = {};
      newLayers.forEach((layer) => {
        if (layer && layer.id) {
          layerRefs.current[layer.id] = layer;
        }
      });

      setLayers(newLayers);
    };

    initializeLayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showPerimeterNrt,
    showFireline,
    showNewFirepix,
    show3DMap,
    windLayerType,
    MVT_URLS.perimeterNrt,
    MVT_URLS.fireline,
    MVT_URLS.newfirepix,
    firePerimeters,
    layerOpacity,
    mapboxAccessToken,
    lastTimeRangeEnd,
    featurePassesFilters,
    handleClick,
    updateTriggers,
    timeRange,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ...(show3DMap ? [viewState] : []),
  ]);

  return { layers, loadingStates, featurePassesFilters };
};
