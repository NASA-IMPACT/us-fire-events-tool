import { StateCreator } from 'zustand';

export interface EnvState {
  featuresApiEndpoint: string;
  mapboxAccessToken: string;
}

export interface EnvActions {
  setEnvConfig: (config: {
    featuresApiEndpoint: string;
    mapboxAccessToken: string;
  }) => void;
}

export type EnvSlice = EnvState & EnvActions;

export const createEnvSlice: StateCreator<EnvSlice> = (set) => ({
  featuresApiEndpoint: import.meta.env.VITE_FEATURES_API_ENDPOINT || '',
  mapboxAccessToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
  setEnvConfig: (config) =>
    set({
      featuresApiEndpoint: config.featuresApiEndpoint,
      mapboxAccessToken: config.mapboxAccessToken,
    }),
});
