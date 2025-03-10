import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ViewMode = 'explorer' | 'detail';
export type TimeMode = 'recent' | 'yearToDate' | 'historical';

interface AppState {
  viewMode: ViewMode;
  selectedEventId: string | null;
  timeRange: {
    start: Date;
    end: Date;
  };
  timeMode: TimeMode;
  isPlaying: boolean;
  playbackSpeed: number;
  showWindLayer: boolean;
  show3DMap: boolean;
  showSatelliteImagery: boolean;
  mapBounds: [number, number, number, number] | null;
}

interface AppContextValue extends AppState {
  setViewMode: (mode: ViewMode) => void;
  selectEvent: (eventId: string | null) => void;
  setTimeRange: (range: { start: Date; end: Date }) => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleWindLayer: () => void;
  toggle3DMap: () => void;
  toggleSatelliteImagery: () => void;
  resetView: () => void;
  setMapBounds: (bounds: [number, number, number, number]) => void;
}

const createStableDate = (date: Date | string): Date => {
  const stableDate = new Date(date);
  stableDate.setHours(0, 0, 0, 0);
  return stableDate;
};

const areDatesEqual = (date1: Date, date2: Date): boolean => {
  return date1.getTime() === date2.getTime();
};

const areTimeRangesEqual = (range1: AppState['timeRange'], range2: AppState['timeRange']): boolean => {
  return (
    areDatesEqual(range1.start, range2.start) &&
    areDatesEqual(range1.end, range2.end)
  );
};

const defaultState: AppState = {
  viewMode: 'explorer',
  selectedEventId: null,
  timeRange: {
    start: createStableDate(new Date(new Date().setDate(new Date().getDate() - 10))),
    end: createStableDate(new Date()),
  },
  timeMode: 'historical',
  isPlaying: false,
  playbackSpeed: 1,
  showWindLayer: false,
  show3DMap: false,
  showSatelliteImagery: false,
  mapBounds: null
};

const AppStateContext = createContext<AppContextValue | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(defaultState);


  const selectEvent = useCallback((eventId: string | null) => {
    setState(prev => {
      if (prev.selectedEventId === eventId) {
        return prev;
      }

      const newState = {
        ...prev,
        selectedEventId: eventId,
        viewMode: eventId ? 'detail' : 'explorer'
      };

      return newState;
    });
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => {
      if (prev.viewMode === mode) return prev;
      return { ...prev, viewMode: mode };
    });
  }, []);

  const setTimeRange = useCallback((range: { start: Date; end: Date }) => {
    setState(prev => {
      if (areTimeRangesEqual(prev.timeRange, range)) return prev;
      return { ...prev, timeRange: range };
    });
  }, []);

  const togglePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setState(prev => ({ ...prev, playbackSpeed: speed }));
  }, []);

  const toggleWindLayer = useCallback(() => {
    setState(prev => ({ ...prev, showWindLayer: !prev.showWindLayer }));
  }, []);

  const toggle3DMap = useCallback(() => {
    setState(prev => ({ ...prev, show3DMap: !prev.show3DMap }));
  }, []);

  const toggleSatelliteImagery = useCallback(() => {
    setState(prev => ({ ...prev, showSatelliteImagery: !prev.showSatelliteImagery }));
  }, []);

  const resetView = useCallback(() => {
    setState(prev => ({
      ...prev,
      timeRange: defaultState.timeRange,
      timeMode: defaultState.timeMode,
      isPlaying: false
    }));
  }, []);

  const setMapBounds = useCallback((bounds: [number, number, number, number]) => {
    setState(prev => ({ ...prev, mapBounds: bounds }));
  }, []);

  const value: AppContextValue = {
    ...state,
    setViewMode,
    selectEvent,
    setTimeRange,
    togglePlay,
    setPlaybackSpeed,
    toggleWindLayer,
    toggle3DMap,
    toggleSatelliteImagery,
    resetView,
    setMapBounds
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