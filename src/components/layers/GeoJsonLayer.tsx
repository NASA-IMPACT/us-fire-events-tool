import { GeoJsonLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';

/**
 * Creates a GeoJson layer for fire perimeters visualization
 * with different styling for past, current, and future perimeters
 *
 * @param {Object} options - Layer configuration options
 * @param {string} options.id - Layer ID
 * @param {Object} options.data - GeoJSON data to visualize
 * @param {Function} options.filterFunction - Function to filter features
 * @param {number} options.opacity - Layer opacity (0-100)
 * @param {Function} options.onClick - Called when a feature is clicked
 * @param {Object} options.updateTriggers - Update triggers for callbacks
 * @param {Object} options.timeMarker - Current time range for visualization
 * @return {GeoJsonLayer} Configured GeoJSON layer
 */
export const createGeoJsonLayer2D = ({
  id = 'fire-perimeters-2d',
  data,
  filterFunction,
  opacity = 100,
  onClick,
  updateTriggers = {},
  timeMarker,
}) => {
  const sortedData = Array.isArray(data?.features)
    ? {
        ...data,
        features: [...data.features].sort((a, b) => {
          const timeA = new Date(a.properties.t).getTime();
          const timeB = new Date(b.properties.t).getTime();
          return timeB - timeA;
        }),
      }
    : data;

  const getPerimeterState = (feature) => {
    if (!feature?.properties?.t) return 'current';

    const featureTime = new Date(feature.properties.t).getTime();
    const currentTime = timeMarker?.getTime() || Date.now();

    if (featureTime < currentTime) {
      return 'past';
    } else if (featureTime === currentTime) {
      return 'current';
    } else {
      return 'future';
    }
  };

  return new GeoJsonLayer({
    id,
    data: sortedData,
    filled: true,
    stroked: true,
    getFillColor: (feature) => {
      const state = getPerimeterState(feature);

      switch (state) {
        case 'past':
          return [136, 140, 160, 255];
        case 'current':
          return [219, 86, 66, 255];
        case 'future':
          return [255, 255, 255, 5];
        default:
          return [136, 140, 160, 255];
      }
    },

    getLineColor: (feature) => {
      const state = getPerimeterState(feature);

      switch (state) {
        case 'past':
          return [115, 120, 124, 255];
        case 'current':
          return [246, 184, 68, 255];
        case 'future':
          return [146, 151, 154, 255];
        default:
          return [115, 120, 124, 255];
      }
    },

    getLineWidth: (feature) => {
      const state = getPerimeterState(feature);
      return state === 'current' ? 30 : 1.5;
    },

    getDashArray: (feature) => {
      const state = getPerimeterState(feature);

      switch (state) {
        case 'past':
          return [5, 5];
        case 'current':
          return [0, 0];
        case 'future':
          return [5, 5];
        default:
          return [0, 0];
      }
    },

    lineWidthMinPixels: 1,
    material: {
      ambient: 0.8,
      diffuse: 0.6,
      shininess: 10,
    },
    opacity: opacity / 100,
    pickable: true,

    updateTriggers: {
      getFillColor: [
        filterFunction,
        timeMarker?.getTime(),
        ...(updateTriggers.getFillColor || []),
      ],
      getLineColor: [
        filterFunction,
        timeMarker?.getTime(),
        ...(updateTriggers.getLineColor || []),
      ],
      getLineWidth: [
        timeMarker?.getTime(),
        ...(updateTriggers.getLineWidth || []),
      ],
      getDashArray: [
        timeMarker?.getTime(),
        ...(updateTriggers.getDashArray || []),
      ],
    },
    extensions: [new PathStyleExtension({ dash: true })],
    parameters: {
      depthTest: false,
    },
    onClick,
  });
};
