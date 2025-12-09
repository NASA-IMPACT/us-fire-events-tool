import { MVTLayer } from '@deck.gl/geo-layers';
import { DataFilterExtension } from '@deck.gl/extensions';
import { DATA_FETCH_DEBOUNCE, USA_BBOX } from './config/constants';
import type { PickingInfo } from '@deck.gl/core';

export interface FireFeatureProperties {
  fireid: string | number;
  t: string;
  primarykey?: string;
  [key: string]: any;
}

export interface FireFeature {
  properties: FireFeatureProperties;
}
export interface CreateMVTLayerProps {
  id?: string;
  data: string | string[];
  filterFunction?: (feature: FireFeature) => boolean;
  latestTimestampMap?: Record<string, string> | null;
  opacity?: number;
  onTileLoad?: (tile: any) => void;
  onClick?: (info: PickingInfo) => void;
  lineWidthMinPixels?: number;
  updateTriggers?: {
    getFilterValue?: any[];
  };
}

/**
 * Creates an MVT layer for fire-related visualization (perimeters, firelines, firepix).
 *
 * @param {Object} options - Layer configuration options
 * @param {string} options.id - Unique layer ID
 * @param {string} options.data - Tile URL template (e.g. MVT_URLS.fireline)
 * @param {Function} options.filterFunction - Feature filter logic for visibility/styling
 * @param {Object} [options.latestTimestampMap=null] - Map of {fireId: latestTimestamp} used to hide older historical perimeters
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
  latestTimestampMap = null,
  opacity = 100,
  onTileLoad,
  onClick,
  lineWidthMinPixels = 1,
  updateTriggers = {},
}: CreateMVTLayerProps) => {
  return new MVTLayer({
    id,
    data,
    extent: USA_BBOX,
    // We're setting the binary prop to be false to
    // access feature.properties in onTileLoad/filter
    binary: false,
    getFillColor: [255, 140, 0, 180],
    getLineColor: [255, 69, 0, 255],
    uniqueIdProperty: 'primarykey',
    lineWidthMinPixels,
    pickable: true,
    opacity: opacity / 100,
    autoHighlight: true,
    highlightColor: [255, 100, 50, 220],
    onClick,
    updateTriggers: {
      getFilterValue: [
        filterFunction,
        latestTimestampMap,
        ...(updateTriggers.getFilterValue || []),
      ],
    },
    // This function first applies user-defined filters (eg. slider ranges, time range).
    // Then, if a latestTimestampMap is provided it makes sure only the most recent version
    // of a fire polygon is visible by comparing the feature's timestamp ('t') against
    // the latest known time recorded for that specific fire ID.
    getFilterValue: (feature) => {
      if (filterFunction && !filterFunction(feature)) {
        return 0;
      }

      if (latestTimestampMap) {
        const id = feature.properties.fireid;
        const time = feature.properties.t;
        const latest = latestTimestampMap[id];

        if (latest && time < latest) {
          return 0;
        }
      }

      return 1;
    },
    filterRange: [1, 1],
    filterEnabled: true,
    onTileLoad,
    debounceTime: DATA_FETCH_DEBOUNCE,
    maxRequests: 6,
    tileSize: 4096,
    minZoom: 4,
    maxZoom: 10,
    extensions: [new DataFilterExtension({ filterSize: 1 })],
  });
};