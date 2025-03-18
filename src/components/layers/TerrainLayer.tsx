import { TerrainLayer } from '@deck.gl/geo-layers';

/**
 * Creates a TerrainLayer for 3D elevation visualization
 *
 * @param {Object} options - Layer configuration options
 * @param {string} options.id - Layer ID
 * @param {number} options.opacity - Layer opacity (0-100)
 * @param {Object} options.viewState - Current view state for appropriate LOD
 * @return {TerrainLayer} Configured TerrainLayer
 */
export const createTerrainLayer = ({
  id = 'terrain',
  opacity = 100,
  viewState
}) => {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  if (!mapboxToken) {
    console.error('Mapbox token is required for TerrainLayer');
    return null;
  }

  return new TerrainLayer({
    id,
    minZoom: 0,
    maxZoom: 23,
    strategy: 'no-overlap',
    elevationDecoder: {
        rScaler: 256,
        gScaler: 1,
        bScaler: 1 / 256,
        offset: -32768
    },
    terrainDrawMode: 'drape',
    elevationData: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`,
    texture: `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${mapboxToken}`,
    operation: 'terrain+draw'
  });
};