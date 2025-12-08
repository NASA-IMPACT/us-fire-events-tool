import { FlyToInterpolator, TRANSITION_EVENTS } from '@deck.gl/core';

export const LAYER_TYPES = {
  MVT: 'mvt',
  GEOJSON_2D: 'geojson-2d',
  GEOJSON_3D: 'geojson-3d',
  WIND: 'wind',
  GRID: 'grid',
  TERRAIN: 'terrain',
};

export const INTERACTION_TIMEOUT = 500;
export const DATA_FETCH_DEBOUNCE = 500;

export const USA_BBOX = [-165.0, 24.5, -66.0, 69.5];

export const MAP_VIEWPORT_PADDING = 40;

export const INITIAL_VIEW_STATE = {
  longitude: -95.7129,
  latitude: 37.0902,
  zoom: 3,
  pitch: 0,
  bearing: 0,
  padding: {
    top: MAP_VIEWPORT_PADDING,
    bottom: MAP_VIEWPORT_PADDING,
    left: MAP_VIEWPORT_PADDING,
    right: MAP_VIEWPORT_PADDING,
  },
  minZoom: 2,
  maxZoom: 10,
};

export const FLY_TO_TRANSITION = {
  transitionInterpolator: new FlyToInterpolator({ speed: 2 }),
  transitionDuration: 'auto',
  transitionInterruption: TRANSITION_EVENTS.IGNORE,
};

export const MAP_STYLE = 'mapbox://styles/covid-nasa/cmb6kewie00nq01r2b84y3gsj';
