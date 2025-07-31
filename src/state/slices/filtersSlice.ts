import { StateCreator } from 'zustand';

export interface FilterRange {
  min: number;
  max: number;
}

export const DEFAULT_RANGES = {
  fireArea: { min: 0, max: 10000 },
  duration: { min: 0, max: 100 },
  meanFrp: { min: 0, max: 1000 },
} as const;

export interface FiltersState {
  fireArea: FilterRange;
  duration: FilterRange;
  meanFrp: FilterRange;
  region: string | null;
  isActive: boolean | null;
  showAdvancedFilters: boolean;
}

export interface FiltersActions {
  setFireAreaRange: (range: FilterRange) => void;
  setDurationRange: (range: FilterRange) => void;
  setMeanFrpRange: (range: FilterRange) => void;
  setRegion: (region: string | null) => void;
  setIsActive: (isActive: boolean | null) => void;
  toggleAdvancedFilters: () => void;
  resetFilters: () => void;
}

export type FiltersSlice = FiltersState & FiltersActions;

export const createFiltersSlice: StateCreator<FiltersSlice> = (set) => ({
  fireArea: DEFAULT_RANGES.fireArea,
  duration: DEFAULT_RANGES.duration,
  meanFrp: DEFAULT_RANGES.meanFrp,
  region: null,
  isActive: null,
  showAdvancedFilters: false,
  setFireAreaRange: (range) => set({ fireArea: range }),
  setDurationRange: (range) => set({ duration: range }),
  setMeanFrpRange: (range) => set({ meanFrp: range }),
  setRegion: (region) => set({ region }),
  setIsActive: (isActive) => set({ isActive }),
  toggleAdvancedFilters: () =>
    set((state) => ({ showAdvancedFilters: !state.showAdvancedFilters })),
  resetFilters: () =>
    set({
      fireArea: DEFAULT_RANGES.fireArea,
      duration: DEFAULT_RANGES.duration,
      meanFrp: DEFAULT_RANGES.meanFrp,
      region: null,
      isActive: null,
    }),
});
