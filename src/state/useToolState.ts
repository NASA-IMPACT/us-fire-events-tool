import { useFireExplorerStore } from './useFireExplorerStore';

interface ToolUrlState {
  selectedEventId: string | null;
  windLayerType: 'grid' | 'wind' | null;
  show3DMap: boolean;
  showPerimeterNrt: boolean;
  showFireline: boolean;
  showNewFirepix: boolean;
  viewMode: 'explorer' | 'detail';
  timeRange: {
    start: Date;
    end: Date;
  };
  mapBounds: [number, number, number, number] | null;
  layerOpacity: number;
}

export const useToolState = () => {
  const selectedEventId = useFireExplorerStore.use.selectedEventId();
  const windLayerType = useFireExplorerStore.use.windLayerType();
  const show3DMap = useFireExplorerStore.use.show3DMap();
  const showPerimeterNrt = useFireExplorerStore.use.showPerimeterNrt();
  const showFireline = useFireExplorerStore.use.showFireline();
  const showNewFirepix = useFireExplorerStore.use.showNewFirepix();
  const viewMode = useFireExplorerStore.use.viewMode();
  const timeRange = useFireExplorerStore.use.timeRange();
  const mapBounds = useFireExplorerStore.use.mapBounds();
  const layerOpacity = useFireExplorerStore.use.layerOpacity();

  const setViewMode = useFireExplorerStore.use.setViewMode();
  const setWindLayerType = useFireExplorerStore.use.setWindLayerType();
  const toggle3DMap = useFireExplorerStore.use.toggle3DMap();
  const setShowPerimeterNrt = useFireExplorerStore.use.setShowPerimeterNrt();
  const setShowFireline = useFireExplorerStore.use.setShowFireline();
  const setShowNewFirepix = useFireExplorerStore.use.setShowNewFirepix();
  const setTimeRange = useFireExplorerStore.use.setTimeRange();
  const setMapBounds = useFireExplorerStore.use.setMapBounds();
  const setLayerOpacity = useFireExplorerStore.use.setLayerOpacity();
  const selectEvent = useFireExplorerStore.use.selectEvent();
  const featuresApiEndpoint = useFireExplorerStore.use.featuresApiEndpoint();

  const state: ToolUrlState = {
    selectedEventId,
    windLayerType,
    show3DMap,
    showPerimeterNrt,
    showFireline,
    showNewFirepix,
    viewMode,
    timeRange,
    mapBounds,
    layerOpacity,
  };

  const setState = (nextState: Partial<ToolUrlState>) => {
    if (nextState.viewMode !== undefined) {
      setViewMode(nextState.viewMode);
    }
    if (nextState.windLayerType !== undefined) {
      setWindLayerType(nextState.windLayerType);
    }
    if (
      nextState.show3DMap !== undefined &&
      nextState.show3DMap !== show3DMap
    ) {
      toggle3DMap();
    }
    if (nextState.showPerimeterNrt !== undefined) {
      setShowPerimeterNrt(nextState.showPerimeterNrt);
    }
    if (nextState.showFireline !== undefined) {
      setShowFireline(nextState.showFireline);
    }
    if (nextState.showNewFirepix !== undefined) {
      setShowNewFirepix(nextState.showNewFirepix);
    }
    if (nextState.timeRange !== undefined) {
      setTimeRange(nextState.timeRange);
    }
    if (nextState.mapBounds !== undefined) {
      setMapBounds(nextState.mapBounds);
    }
    if (nextState.layerOpacity !== undefined) {
      setLayerOpacity(nextState.layerOpacity);
    }
    if (
      nextState.selectedEventId !== undefined &&
      nextState.selectedEventId !== selectedEventId
    ) {
      selectEvent(nextState.selectedEventId, featuresApiEndpoint);
    }
  };

  return {
    state,
    setState,
  };
};

export type { ToolUrlState };
