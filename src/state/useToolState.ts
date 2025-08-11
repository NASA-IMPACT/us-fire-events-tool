import { useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { ViewState } from 'react-map-gl/mapbox';
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
  selectedDuration: { label: string; value: number };
  viewStateForUrl: ViewState;
}

const useToolState = () => {
  const selectedEventId = useFireExplorerStore.use.selectedEventId();
  const windLayerType = useFireExplorerStore.use.windLayerType();
  const show3DMap = useFireExplorerStore.use.show3DMap();
  const showPerimeterNrt = useFireExplorerStore.use.showPerimeterNrt();
  const showFireline = useFireExplorerStore.use.showFireline();
  const showNewFirepix = useFireExplorerStore.use.showNewFirepix();
  const viewMode = useFireExplorerStore.use.viewMode();
  const timeRange = useFireExplorerStore.use.timeRange();
  const viewStateForUrl = useFireExplorerStore.use.viewStateForUrl();
  const selectedDuration = useFireExplorerStore.use.selectedDuration();

  const setViewMode = useFireExplorerStore.use.setViewMode();
  const setWindLayerType = useFireExplorerStore.use.setWindLayerType();
  const toggle3DMap = useFireExplorerStore.use.toggle3DMap();
  const setShowPerimeterNrt = useFireExplorerStore.use.setShowPerimeterNrt();
  const setShowFireline = useFireExplorerStore.use.setShowFireline();
  const setShowNewFirepix = useFireExplorerStore.use.setShowNewFirepix();
  const setTimeRange = useFireExplorerStore.use.setTimeRange();
  const selectEvent = useFireExplorerStore.use.selectEvent();
  const featuresApiEndpoint = useFireExplorerStore.use.featuresApiEndpoint();
  const setViewStateForUrl = useFireExplorerStore.use.setViewStateForUrl();
  const setViewState = useFireExplorerStore.use.setViewState();
  const setSelectedDuration = useFireExplorerStore.use.setSelectedDuration();

  const debouncedSetTimeRange = useMemo(
    () => debounce(setTimeRange, 300),
    [setTimeRange]
  );

  const state: ToolUrlState = useMemo(
    () => ({
      selectedEventId,
      windLayerType,
      show3DMap,
      showPerimeterNrt,
      showFireline,
      showNewFirepix,
      viewMode,
      timeRange,
      selectedDuration,
      viewStateForUrl,
    }),
    [
      selectedEventId,
      windLayerType,
      show3DMap,
      showPerimeterNrt,
      showFireline,
      showNewFirepix,
      viewMode,
      timeRange,
      selectedDuration,
      viewStateForUrl,
    ]
  );

  const setState = useCallback(
    (nextState: Partial<ToolUrlState>) => {
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
      if (
        nextState.selectedEventId !== undefined &&
        nextState.selectedEventId !== selectedEventId
      ) {
        selectEvent(nextState.selectedEventId, featuresApiEndpoint);
      }

      if (nextState.timeRange !== undefined) {
        debouncedSetTimeRange(nextState.timeRange);
      }

      if (nextState.viewStateForUrl !== undefined) {
        setViewStateForUrl(nextState.viewStateForUrl);
        setViewState(nextState.viewStateForUrl);
      }

      if (nextState.selectedDuration !== undefined) {
        setSelectedDuration(nextState.selectedDuration);
      }
    },
    [
      show3DMap,
      selectedEventId,
      setViewMode,
      setWindLayerType,
      toggle3DMap,
      setShowPerimeterNrt,
      setShowFireline,
      setShowNewFirepix,
      selectEvent,
      featuresApiEndpoint,
      debouncedSetTimeRange,
      setViewStateForUrl,
      setViewState,
      setSelectedDuration,
    ]
  );

  return useMemo(
    () => ({
      state,
      setState,
    }),
    [state, setState]
  );
};

export default useToolState;
export type { ToolUrlState };
