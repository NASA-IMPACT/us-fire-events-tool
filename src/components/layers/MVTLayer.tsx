import { MVTLayer } from '@deck.gl/geo-layers';
import { USA_BBOX } from './config/constants';

/**
 * Creates an MVT layer for fire-related visualization (perimeters, firelines, firepix).
 *
 * @param {Object} options - Layer configuration options
 * @param {string} options.id - Unique layer ID
 * @param {string} options.data - Tile URL template (e.g. MVT_URLS.fireline)
 * @param {Function} options.filterFunction - Feature filter logic for visibility/styling
 * @param {number} [options.opacity=100] - Layer opacity (0–100)
 * @param {Function} options.onTileLoad - Callback fired when a tile finishes loading
 * @param {Function} options.onClick - Callback fired when a feature is clicked
 * @param {Object} [options.updateTriggers={}] - Update triggers for re-rendering (used with filters/time)
 * @returns {MVTLayer} Configured Deck.gl MVTLayer instance
 */
export const createMVTLayer = ({
  id = 'fire-perimeters-mvt',
  data,
  filterFunction,
  opacity = 100,
  onTileLoad,
  onClick,
  lineWidthMinPixels = 1,
  updateTriggers = {}
}) => {
  return new MVTLayer({
    id,
    data,
    extent: USA_BBOX,
    getFillColor: (feature) => {
      const passes = filterFunction ? filterFunction(feature) : true;
      return passes ? [255, 140, 0, 180] : [255, 140, 0, 0];
    },
    getLineColor: (feature) => {
      const passes = filterFunction ? filterFunction(feature) : true;
      return passes ? [255, 69, 0, 255] : [255, 69, 0, 0];
    },
    uniqueIdProperty: 'primarykey',
    lineWidthMinPixels,
    pickable: true,
    opacity: opacity / 100,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 120],
    onClick,
    updateTriggers: {
      getFillColor: [filterFunction, ...(updateTriggers.getFillColor || [])],
      getLineColor: [filterFunction, ...(updateTriggers.getLineColor || [])]
    },
    onTileLoad,
  });
};