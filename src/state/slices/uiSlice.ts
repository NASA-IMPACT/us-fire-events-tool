import { getCurrentYearStart, getToday } from '@/utils/dateUtils';
import { StateCreator } from 'zustand';

export interface UIState {
  viewMode: 'explorer' | 'detail';
  isPlaying: boolean;
  playbackSpeed: number;
  windLayerType: 'grid' | 'wind' | null;
  show3DMap: boolean;
  showPerimeterNrt: boolean;
  showFireline: boolean;
  showNewFirepix: boolean;
  timeRange: { start: Date; end: Date };
  timeMarker: Date;
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
  setTimeMarker: (date: Date) => void;
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
  timeRange: {
    start: getCurrentYearStart(),
    end: getToday(),
  },
  timeMarker: new Date(),
  setViewMode: (mode) => set({ viewMode: mode }),
  setTimeRange: (range) => set({ timeRange: range }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  toggle3DMap: () => set((state) => ({ show3DMap: !state.show3DMap })),
  setWindLayerType: (type) => set({ windLayerType: type }),
  setShowPerimeterNrt: (enabled) => set({ showPerimeterNrt: enabled }),
  setShowFireline: (enabled) => set({ showFireline: enabled }),
  setShowNewFirepix: (enabled) => set({ showNewFirepix: enabled }),
  setTimeMarker: (date) => set({ timeMarker: date }),
});
