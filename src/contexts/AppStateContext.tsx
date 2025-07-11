import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';

export type ViewMode = 'explorer' | 'detail';

interface AppState {
  viewMode: ViewMode;
  selectedEventId: string | null;
  timeRange: {
    start: Date;
    end: Date;
  };
  isPlaying: boolean;
  playbackSpeed: number;
  windLayerType: 'grid' | 'wind' | null;
  show3DMap: boolean;
  showPerimeterNrt: boolean;
  showFireline: boolean;
  showNewFirepix: boolean;
  showSatelliteImagery: boolean;
  mapBounds: [number, number, number, number] | null;
}

type AppAction =
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SELECT_EVENT'; payload: string | null }
  | { type: 'SET_TIME_RANGE'; payload: { start: Date; end: Date } }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_PLAYBACK_SPEED'; payload: number }
  | { type: 'TOGGLE_WIND_LAYER' }
  | { type: 'TOGGLE_3D_MAP' }
  | { type: 'TOGGLE_SATELLITE_IMAGERY' }
  | { type: 'SET_MAP_BOUNDS'; payload: [number, number, number, number] }
  | { type: 'SET_SHOW_PERIMETER_NRT'; payload: boolean }
  | { type: 'SET_WIND_LAYER_TYPE'; payload: 'grid' | 'wind' | null }
  | { type: 'SET_SHOW_FIRELINE'; payload: boolean }
  | { type: 'SET_SHOW_NEWFIREPIX'; payload: boolean };

const createStableDate = (date: Date | string): Date => {
  const stableDate = new Date(date);
  stableDate.setHours(0, 0, 0, 0);
  return stableDate;
};

const areDatesEqual = (date1: Date, date2: Date): boolean => {
  return date1.getTime() === date2.getTime();
};

const areTimeRangesEqual = (
  range1: AppState['timeRange'],
  range2: AppState['timeRange']
): boolean => {
  return (
    areDatesEqual(range1.start, range2.start) &&
    areDatesEqual(range1.end, range2.end)
  );
};

const initialState: AppState = {
  viewMode: 'explorer',
  selectedEventId: null,
  timeRange: {
    start: createStableDate(new Date(2025, 0, 1)),
    end: createStableDate(new Date(2025, 3, 10)),
  },
  isPlaying: false,
  playbackSpeed: 1,
  windLayerType: null,
  show3DMap: false,
  showPerimeterNrt: true,
  showFireline: false,
  showNewFirepix: false,
  showSatelliteImagery: false,
  mapBounds: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      if (state.viewMode === action.payload) return state;
      return { ...state, viewMode: action.payload };

    case 'SELECT_EVENT':
      if (state.selectedEventId === action.payload) return state;
      return {
        ...state,
        selectedEventId: action.payload,
        viewMode: action.payload ? 'detail' : 'explorer',
      };

    case 'SET_TIME_RANGE':
      if (areTimeRangesEqual(state.timeRange, action.payload)) return state;
      return { ...state, timeRange: action.payload };

    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };

    case 'SET_PLAYBACK_SPEED':
      return { ...state, playbackSpeed: action.payload };

    case 'TOGGLE_3D_MAP':
      return { ...state, show3DMap: !state.show3DMap };

    case 'TOGGLE_SATELLITE_IMAGERY':
      return { ...state, showSatelliteImagery: !state.showSatelliteImagery };

    case 'SET_MAP_BOUNDS':
      return { ...state, mapBounds: action.payload };

    case 'SET_WIND_LAYER_TYPE':
      return { ...state, windLayerType: action.payload };

    case 'SET_SHOW_PERIMETER_NRT':
      return { ...state, showPerimeterNrt: action.payload };

    case 'SET_SHOW_FIRELINE':
      return { ...state, showFireline: action.payload };

    case 'SET_SHOW_NEWFIREPIX':
      return { ...state, showNewFirepix: action.payload };

    default:
      return state;
  }
};

interface AppContextValue extends AppState {
  setViewMode: (mode: ViewMode) => void;
  selectEvent: (eventId: string | null) => void;
  setTimeRange: (range: { start: Date; end: Date }) => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: number) => void;
  toggle3DMap: () => void;
  setMapBounds: (bounds: [number, number, number, number]) => void;
  windLayerType: 'grid' | 'wind' | null;
  setShowPerimeterNrt: (enabled: boolean) => void;
  setShowFireline: (enabled: boolean) => void;
  setShowNewFirepix: (enabled: boolean) => void;
  setWindLayerType: (type: 'grid' | 'wind' | null) => void;
}

const AppStateContext = createContext<AppContextValue | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setViewMode = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, []);

  const selectEvent = useCallback((eventId: string | null) => {
    dispatch({ type: 'SELECT_EVENT', payload: eventId });
  }, []);

  const setTimeRange = useCallback((range: { start: Date; end: Date }) => {
    dispatch({ type: 'SET_TIME_RANGE', payload: range });
  }, []);

  const togglePlay = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLAY' });
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    dispatch({ type: 'SET_PLAYBACK_SPEED', payload: speed });
  }, []);

  const toggle3DMap = useCallback(() => {
    dispatch({ type: 'TOGGLE_3D_MAP' });
  }, []);

  const setMapBounds = useCallback(
    (bounds: [number, number, number, number]) => {
      dispatch({ type: 'SET_MAP_BOUNDS', payload: bounds });
    },
    []
  );

  const setWindLayerType = useCallback((type) => {
    dispatch({ type: 'SET_WIND_LAYER_TYPE', payload: type });
  }, []);

  const setShowPerimeterNrt = useCallback((val: boolean) => {
    dispatch({ type: 'SET_SHOW_PERIMETER_NRT', payload: val });
  }, []);

  const setShowFireline = useCallback((val: boolean) => {
    dispatch({ type: 'SET_SHOW_FIRELINE', payload: val });
  }, []);

  const setShowNewFirepix = useCallback((val: boolean) => {
    dispatch({ type: 'SET_SHOW_NEWFIREPIX', payload: val });
  }, []);

  const value: AppContextValue = {
    ...state,
    setViewMode,
    selectEvent,
    setTimeRange,
    togglePlay,
    setPlaybackSpeed,
    toggle3DMap,
    setMapBounds,
    setWindLayerType,
    setShowPerimeterNrt,
    setShowFireline,
    setShowNewFirepix,
    windLayerType: state.windLayerType,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};
