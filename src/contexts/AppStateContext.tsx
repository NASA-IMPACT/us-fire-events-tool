import { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';

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
  setTimeMode: (mode: TimeMode) => void;
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
    start: createStableDate('2024-01-01'),
    end: createStableDate('2024-12-31'),
  },
  timeMode: 'historical',
  isPlaying: false,
  playbackSpeed: 1,
  showWindLayer: true,
  show3DMap: false,
  showSatelliteImagery: false,
  mapBounds: null
};

const AppStateContext = createContext<AppContextValue | undefined>(undefined);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const isUpdatingTimeRange = useRef(false);
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
    if (isUpdatingTimeRange.current) {
      return;
    }

    setState(prev => {
      if (areTimeRangesEqual(prev.timeRange, range)) {
        return prev;
      }

      const stableRange = {
        start: createStableDate(range.start),
        end: createStableDate(range.end)
      };

      let newTimeMode = prev.timeMode;
      const endYear = stableRange.end.getFullYear();
      const currentYear = new Date().getFullYear();

      if (endYear >= 2018 && endYear <= 2021) {
        newTimeMode = 'historical';
      } else if (endYear === currentYear) {
        newTimeMode = 'yearToDate';
      } else {
        newTimeMode = 'recent';
      }

      isUpdatingTimeRange.current = true;
      setTimeout(() => {
        isUpdatingTimeRange.current = false;
      }, 50);

      return {
        ...prev,
        timeRange: stableRange,
        timeMode: newTimeMode
      };
    });
  }, []);

  const setTimeMode = useCallback((mode: TimeMode) => {
    setState(prev => {
      if (prev.timeMode === mode) {
        return prev;
      }

      let newTimeRange = { ...prev.timeRange };
      const currentYear = new Date().getFullYear();

      if (mode === 'recent') {
        const now = new Date();
        const twentyDaysAgo = new Date();
        twentyDaysAgo.setDate(now.getDate() - 20);
        newTimeRange = {
          start: createStableDate(twentyDaysAgo),
          end: createStableDate(now)
        };
      } else if (mode === 'yearToDate') {
        newTimeRange = {
          start: createStableDate(`${currentYear}-01-01`),
          end: createStableDate(new Date())
        };
      } else if (mode === 'historical') {
        newTimeRange = {
          start: createStableDate('2024-01-01'),
          end: createStableDate('2024-12-31')
        };
      }

      return {
        ...prev,
        timeMode: mode,
        timeRange: newTimeRange
      };
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
    setTimeMode,
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