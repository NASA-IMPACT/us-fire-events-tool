export const LAYER_TYPES = {
    MVT: 'mvt',
    GEOJSON_2D: 'geojson-2d',
    GEOJSON_3D: 'geojson-3d',
    WIND: 'wind',
    GRID: 'grid',
    TERRAIN: 'terrain',
};

export const INTERACTION_TIMEOUT = 500;
export const FEATURES_COLLECTION_DEBOUNCE = 1500;
export const WIND_DATA_FETCH_DEBOUNCE = 500;

export const USA_BBOX = [-125.0, 24.5, -66.0, 49.5];

export const INITIAL_VIEW_STATE = {
    longitude: -95.7129,
    latitude: 37.0902,
    zoom: 3,
    pitch: 0,
    bearing: 0,
    maxZoom: 20,
    minZoom: 0,
};

export const MAP_STYLE = 'mapbox://styles/devseed/cm7ueetbz00cc01qsdityey6n';