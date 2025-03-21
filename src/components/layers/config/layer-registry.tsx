import { LAYER_TYPES } from './constants';
import { createMVTLayer } from '../MVTLayer';
import { createGeoJsonLayer2D } from '../GeoJsonLayer';
import { createGeoJsonLayer3D } from '../GeoJsonLayer3D';
import { createWindLayer } from '../WindLayer';
import { createTerrainLayer } from '../TerrainLayer';
import { PathStyleExtension } from '@deck.gl/extensions';

/**
 * Registry of all available layers and their configurations
 */
export const layerRegistry = {
  [LAYER_TYPES.TERRAIN]: {
    id: LAYER_TYPES.TERRAIN,
    name: 'Terrain Elevation',
    render: createTerrainLayer,
    defaultProps: {
      id: 'terrain-layer'
    },
    requiresData: false
  },
  [LAYER_TYPES.MVT]: {
    id: LAYER_TYPES.MVT,
    name: 'Map Vector Tile',
    render: createMVTLayer,
    defaultProps: {
      id: 'fire-perimeters-mvt',
    },
    requiresData: true
  },

  [LAYER_TYPES.GEOJSON_2D]: {
    id: LAYER_TYPES.GEOJSON_2D,
    name: 'GeoJSON 2D',
    render: createGeoJsonLayer2D,
    defaultProps: {
      id: 'fire-perimeters',
      extensions: [new PathStyleExtension({ dash: true })]
    },
    requiresData: true
  },

  [LAYER_TYPES.GEOJSON_3D]: {
    id: LAYER_TYPES.GEOJSON_3D,
    name: 'GeoJSON 3D',
    render: createGeoJsonLayer3D,
    defaultProps: {
      id: 'fire-perimeters-3d',
      opacity: 100,
      extensions: [new PathStyleExtension({ dash: true })]
    },
    requiresData: true
  },

  [LAYER_TYPES.WIND]: {
    id: LAYER_TYPES.WIND,
    name: 'Wind Particles',
    render: createWindLayer,
    defaultProps: {
      id: 'wind-particles'
    },
    requiresData: false
  },
};

/**
 * Get a layer definition from the registry
 * @param {string} type - The layer type
 * @returns {object} Layer definition or null if not found
 */
export const getLayerDefinition = (type) => {
  return layerRegistry[type] || null;
};

/**
 * Get list of all available layer types
 * @returns {object[]} Array of layer definitions
 */
export const getAvailableLayers = () => {
  return Object.values(layerRegistry);
};