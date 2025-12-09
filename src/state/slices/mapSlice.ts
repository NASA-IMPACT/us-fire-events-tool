import { StateCreator } from 'zustand';
import { ViewState } from 'react-map-gl/mapbox';
import { INITIAL_VIEW_STATE } from '@/components/layers';

export interface MapState {
  // Real-time view state that updates continuously during map interactions
  viewState: ViewState;
  // Debounced view state used for URL synchronization, only updates after interactions complete.
  // This prevents browser history pollution and URL thrashing during dragging/zooming
  // Use this state for syncing with URL params
  viewStateForUrl: ViewState;
  mapBounds: [number, number, number, number] | null;
  layerOpacity: number;
}

export interface MapActions {
  setViewState: (viewState: ViewState, transitionOptions?: any) => void;
  setViewStateForUrl: (viewState: ViewState) => void;
  setMapBounds: (bounds: [number, number, number, number] | null) => void;
  setLayerOpacity: (opacity: number) => void;
  // Updates the settled view state for URL syncing in a debounced way after all user interactions complete
  updateViewStateForUrl: (updates: Partial<ViewState>) => void;
}

export type MapSlice = MapState & MapActions;

export const createMapSlice: StateCreator<MapSlice> = (set) => ({
  viewState: INITIAL_VIEW_STATE,
  viewStateForUrl: INITIAL_VIEW_STATE,
  mapBounds: null,
  layerOpacity: 100,
  setViewState: (viewState, transitionOptions) =>
    set({
      viewState: { ...INITIAL_VIEW_STATE, ...viewState, ...transitionOptions },
    }),
  setViewStateForUrl: (viewState) => set({ viewStateForUrl: viewState }),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
  setLayerOpacity: (opacity) => {
    if (typeof opacity !== 'number' || isNaN(opacity)) {
      return;
    }

    const clampedOpacity = Math.max(0, Math.min(100, opacity));
    set({ layerOpacity: clampedOpacity });
  },
  updateViewStateForUrl: (updates) =>
    set((state) => ({
      viewStateForUrl: { ...state.viewStateForUrl, ...updates },
    })),
});
