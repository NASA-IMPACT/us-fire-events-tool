import { createContext, useContext, useState, ReactNode } from 'react';

export interface FilterRange {
  min: number;
  max: number;
}

export interface FiltersState {
  fireArea: FilterRange;
  duration: FilterRange;
  meanFrp: FilterRange;
  searchTerm: string;
  region: string | null;
  isActive: boolean | null;
  showAdvancedFilters: boolean;
}

export const DEFAULT_RANGES = {
  fireArea: { min: 0, max: 100 },
  duration: { min: 0, max: 30 },
  meanFrp: { min: 0, max: 1000 },
};

interface FiltersContextValue extends FiltersState {
  setFireAreaRange: (range: FilterRange) => void;
  setDurationRange: (range: FilterRange) => void;
  setMeanFrpRange: (range: FilterRange) => void;
  setSearchTerm: (term: string) => void;
  setRegion: (region: string | null) => void;
  setIsActive: (isActive: boolean | null) => void;
  toggleAdvancedFilters: () => void;
}

const FiltersContext = createContext<FiltersContextValue | undefined>(
  undefined
);

const defaultFilters: FiltersState = {
  fireArea: DEFAULT_RANGES.fireArea,
  duration: DEFAULT_RANGES.duration,
  meanFrp: DEFAULT_RANGES.meanFrp,
  searchTerm: '',
  region: null,
  isActive: null,
  showAdvancedFilters: false,
};

export const FiltersProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);

  const setFireAreaRange = (range: FilterRange) => {
    setFilters((prev) => ({ ...prev, fireArea: range }));
  };

  const setDurationRange = (range: FilterRange) => {
    setFilters((prev) => ({ ...prev, duration: range }));
  };

  const setMeanFrpRange = (range: FilterRange) => {
    setFilters((prev) => ({ ...prev, meanFrp: range }));
  };

  const setSearchTerm = (term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  };

  const setRegion = (region: string | null) => {
    setFilters((prev) => ({ ...prev, region }));
  };

  const setIsActive = (isActive: boolean | null) => {
    setFilters((prev) => ({ ...prev, isActive }));
  };

  const toggleAdvancedFilters = () => {
    setFilters((prev) => ({
      ...prev,
      showAdvancedFilters: !prev.showAdvancedFilters,
    }));
  };

  const value: FiltersContextValue = {
    ...filters,
    setFireAreaRange,
    setDurationRange,
    setMeanFrpRange,
    setSearchTerm,
    setRegion,
    setIsActive,
    toggleAdvancedFilters,
  };

  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
};
