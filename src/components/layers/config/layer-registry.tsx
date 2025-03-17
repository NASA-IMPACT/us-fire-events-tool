import { LAYER_TYPES } from './constants';
import { createMVTLayer } from '../MVTLayer';
import { createGeoJsonLayer } from '../GeoJsonLayer';
import { createWindLayer } from '../WindLayer';

/**
 * Registry of all available layers and their configurations
 */
export const layerRegistry = {
  [LAYER_TYPES.MVT]: {
    id: LAYER_TYPES.MVT,
    name: 'Map Vector Tile',
    render: createMVTLayer,
    defaultProps: {
      id: 'fire-perimeters-mvt',
      url: 'https://firenrt.delta-backend.com/collections/public.eis_fire_snapshot_perimeter_nrt/tiles/{z}/{x}/{y}'
    },
    visConfigSettings: {
      opacity: {
        type: 'number',
        defaultValue: 100,
        label: 'Opacity',
        range: [0, 100]
      },
      outline: {
        type: 'boolean',
        defaultValue: true,
        label: 'Show Outline'
      },
      fillColor: {
        type: 'color',
        defaultValue: [255, 140, 0, 180],
        label: 'Fill Color'
      },
      lineColor: {
        type: 'color',
        defaultValue: [255, 69, 0, 255],
        label: 'Line Color'
      }
    },
    requiresData: true
  },

  [LAYER_TYPES.GEOJSON]: {
    id: LAYER_TYPES.GEOJSON,
    name: 'GeoJSON',
    render: createGeoJsonLayer,
    defaultProps: {
      id: 'fire-perimeters'
    },
    visConfigSettings: {
      opacity: {
        type: 'number',
        defaultValue: 100,
        label: 'Opacity',
        range: [0, 100]
      },
      fillColor: {
        type: 'color',
        defaultValue: [136, 140, 160, 255],
        label: 'Fill Color'
      },
      lineColor: {
        type: 'color',
        defaultValue: [115, 120, 124, 255],
        label: 'Line Color'
      },
      lineWidth: {
        type: 'number',
        defaultValue: 2,
        label: 'Line Width',
        range: [0, 10]
      }
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
    visConfigSettings: {
      opacity: {
        type: 'number',
        defaultValue: 92,
        label: 'Opacity',
        range: [0, 100]
      },
      particleSpeed: {
        type: 'number',
        defaultValue: 20,
        label: 'Particle Speed',
        range: [1, 50]
      },
      particleCount: {
        type: 'number',
        defaultValue: 4000,
        label: 'Particle Count',
        range: [500, 10000]
      }
    },
    requiresData: false
  }
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