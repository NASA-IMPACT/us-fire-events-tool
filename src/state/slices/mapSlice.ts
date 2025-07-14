import { StateCreator } from 'zustand';
import { ViewState } from 'react-map-gl/mapbox';

export interface MapState {
  viewState: ViewState;
  mapBounds: [number, number, number, number] | null;
  layerOpacity: number;
}

export interface MapActions {
  setViewState: (viewState: ViewState) => void;
  setMapBounds: (bounds: [number, number, number, number] | null) => void;
  setLayerOpacity: (opacity: number) => void;
}

export type MapSlice = MapState & MapActions;

export const createMapSlice: StateCreator<MapSlice> = (set) => ({
  viewState: {
    longitude: -95.7129,
    latitude: 37.0902,
    zoom: 3,
    pitch: 0,
    bearing: 0,
    padding: {
      top: undefined,
      bottom: undefined,
      left: undefined,
      right: undefined,
    },
  },
  mapBounds: null,
  layerOpacity: 100,
  setViewState: (viewState) => set({ viewState }),
  setMapBounds: (bounds) => set({ mapBounds: bounds }),
  setLayerOpacity: (opacity) => set({ layerOpacity: opacity }),
});
