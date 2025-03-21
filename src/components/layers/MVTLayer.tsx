import { MVTLayer } from '@deck.gl/geo-layers';

/**
 * Creates an MVT layer for fire perimeters visualization
 *
 * @param {Object} options - Layer configuration options
 * @param {string} options.id - Layer ID
 * @param {string} options.url - Tile URL template
 * @param {Function} options.filterFunction - Function to filter features
 * @param {number} options.opacity - Layer opacity (0-100)
 * @param {Function} options.onTileLoad - Called when a tile is loaded
 * @param {Function} options.onClick - Called when a feature is clicked
 * @return {MVTLayer} Configured MVT layer
 */
export const createMVTLayer = ({
  id = 'fire-perimeters-mvt',
  filterFunction,
  opacity = 100,
  onTileLoad,
  onClick,
  updateTriggers = {}
}) => {
  return new MVTLayer({
    id,
    data: `https://firenrt.delta-backend.com/collections/public.eis_fire_snapshot_perimeter_nrt/tiles/{z}/{x}/{y}`,
    getFillColor: (feature) => {
      const passes = filterFunction ? filterFunction(feature) : true;
      return passes ? [255, 140, 0, 180] : [255, 140, 0, 0];
    },
    getLineColor: (feature) => {
      const passes = filterFunction ? filterFunction(feature) : true;
      return passes ? [255, 69, 0, 255] : [255, 69, 0, 0];
    },
    lineWidthMinPixels: 1,
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