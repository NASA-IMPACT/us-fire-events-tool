import { StateCreator } from 'zustand';

const createStableDate = (date: Date | string): Date => {
  const stableDate = new Date(date);
  stableDate.setHours(0, 0, 0, 0);
  return stableDate;
};

const getCurrentYearStart = (): Date => {
  const now = new Date();
  return createStableDate(new Date(now.getFullYear(), 0, 1));
};

const getToday = (): Date => {
  return createStableDate(new Date());
};

export interface UIState {
  viewMode: 'explorer' | 'detail';
  isPlaying: boolean;
  playbackSpeed: number;
  windLayerType: 'grid' | 'wind' | null;
  show3DMap: boolean;
  showPerimeterNrt: boolean;
  showFireline: boolean;
  showNewFirepix: boolean;
  showSatelliteImagery: boolean;
  timeRange: { start: Date; end: Date };
}

export interface UIActions {
  setViewMode: (mode: 'explorer' | 'detail') => void;
  setTimeRange: (range: { start: Date; end: Date }) => void;
  togglePlay: () => void;
  setPlaybackSpeed: (speed: number) => void;
  toggle3DMap: () => void;
  setWindLayerType: (type: 'grid' | 'wind' | null) => void;
  setShowPerimeterNrt: (enabled: boolean) => void;
  setShowFireline: (enabled: boolean) => void;
  setShowNewFirepix: (enabled: boolean) => void;
  setSatelliteImagery: (enabled: boolean) => void;
}

export type UISlice = UIState & UIActions;

export const createUISlice: StateCreator<UISlice> = (set) => ({
  viewMode: 'explorer',
  isPlaying: false,
  playbackSpeed: 1,
  windLayerType: null,
  show3DMap: false,
  showPerimeterNrt: true,
  showFireline: false,
  showNewFirepix: false,
  showSatelliteImagery: false,
  timeRange: {
    start: getCurrentYearStart(),
    end: getToday(),
  },
  setViewMode: (mode) => set({ viewMode: mode }),
  setTimeRange: (range) => set({ timeRange: range }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  toggle3DMap: () => set((state) => ({ show3DMap: !state.show3DMap })),
  setWindLayerType: (type) => set({ windLayerType: type }),
  setShowPerimeterNrt: (enabled) => set({ showPerimeterNrt: enabled }),
  setShowFireline: (enabled) => set({ showFireline: enabled }),
  setShowNewFirepix: (enabled) => set({ showNewFirepix: enabled }),
  setSatelliteImagery: (enabled) => set({ showSatelliteImagery: enabled }),
});
