import { GeoJsonLayer } from '@deck.gl/layers';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';

/**
 * Creates a GeoJson layer for fire perimeters visualization
 * with optional TerrainExtension support for 3D terrain rendering
 *
 * @param {Object} options - Layer configuration options
 * @param {string} options.id - Layer ID
 * @param {Object} options.data - GeoJSON data to visualize
 * @param {Function} options.filterFunction - Function to filter features
 * @param {number} options.opacity - Layer opacity (0-100)
 * @param {Function} options.onClick - Called when a feature is clicked
 * @param {Object} options.updateTriggers - Update triggers for callbacks
 * @param {boolean} options.show3DMap - Whether to show 3D terrain
 * @return {GeoJsonLayer} Configured GeoJSON layer
 */
export const createGeoJsonLayer3D = ({
  id = 'fire-perimeters-3d',
  data,
  filterFunction,
  opacity = 100,
  onClick,
  updateTriggers = {}
}) => {
  const sortedData = Array.isArray(data?.features)
    ? {
        ...data,
        features: [...data.features].sort((a, b) => {
          const timeA = new Date(a.properties.t).getTime();
          const timeB = new Date(b.properties.t).getTime();
          return timeB - timeA;
        })
      }
    : data;

  return new GeoJsonLayer({
    id,
    data: sortedData,
    filled: true,
    getFillColor: (feature) => {
      return filterFunction && filterFunction(feature)
        ? [136, 140, 160, 255]
        : [219, 86, 66, 255];
    },
    getLineColor: (feature) => {
      return filterFunction && filterFunction(feature)
        ? [115, 120, 124, 255]
        : [246, 184, 68, 255];
    },
    lineWidthMinPixels: 2,
    opacity: opacity / 100,
    pickable: true,
    updateTriggers: {
      getFillColor: [filterFunction, ...(updateTriggers.getFillColor || [])],
      getLineColor: [filterFunction, ...(updateTriggers.getLineColor || [])]
    },
    onClick,
    extensions: [new TerrainExtension()]
  });
};