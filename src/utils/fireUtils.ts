import { handleError } from "./errorHandler";

export const fetchAlternativeFirePerimeters = async (
  fireId: string,
  baseUrl: string
) => {
  const url = `${baseUrl}/collections/public.eis_fire_snapshot_perimeter_nrt/items?filter=fireid%3D${fireId}&limit=500&f=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch alternative fire perimeters: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching alternative fire perimeters:', error);
    return null;
  }
};

export const fetchFirePerimeters = async (fireId: string, baseUrl: string) => {
  const url = `${baseUrl}/collections/public.eis_fire_lf_perimeter_nrt/items?filter=fireid%3D${fireId}&limit=500&f=geojson`;
  // NOTE-SANDRA: should naturally throw error here instead of catching, it is diluting the actual error happening
  // NOTE-SANDRA: Limit 500 is too much, it is working with limit 50
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch fire perimeters: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching fire perimeters:', error);
    handleError({message: error?.toString() || 'Unknown error', description: 'Error fetching fire perimeters'});
    return null;
  }
};

export interface MVTFeature {
  geometry: {
    type: string;
    coordinates?: unknown;
  };
  properties: {
    fireid?: number;
    farea?: number;
    isactive?: number;
    duration?: number;
    flinelen?: number;
    fperim?: number;
    geom_counts?: string;
    layerName?: string;
    low_confidence_grouping?: number;
    meanfrp?: number;
    n_newpixels?: number;
    n_pixels?: number;
    pixden?: number;
    primarykey?: string;
    region?: string;
    t?: string;
    [key: string]: unknown;
  };
  object?: {
    properties?: unknown;
    geometry?: unknown;
  };
  type?: string;
}

export const getFeatureProperties = (feature: MVTFeature | null) => {
  if (!feature) return {};
  return (
    feature.properties || (feature.object && feature.object.properties) || {}
  );
};

export const getFireId = (feature: MVTFeature) => {
  const props = getFeatureProperties(feature);
  return props.fireid?.toString() || '';
};

export const getSelectedFireObservationTime = (feature: MVTFeature) => {
  const props = getFeatureProperties(feature);
  return props.t?.toString() || '';
};

export const fitMapToBounds = (feature: any) => {
  if (!feature?.geometry) return null;

  try {
    let coordinates: number[][] = [];

    if (feature.geometry.type === 'Polygon') {
      coordinates = feature.geometry.coordinates[0];
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach((polygon) => {
        coordinates = [...coordinates, ...polygon[0]];
      });
    } else if (feature.geometry.type === 'Point') {
      const [lon, lat] = feature.geometry.coordinates;

      const bounds = {
        bounds: [
          [lon - 0.05, lat - 0.05],
          [lon + 0.05, lat + 0.05],
        ],
      };

      const fitBoundsEvent = new CustomEvent('fitbounds', {
        detail: bounds,
      });
      window.dispatchEvent(fitBoundsEvent);
      return bounds;
    }

    if (coordinates.length === 0) return null;

    const lons = coordinates.map((c) => c[0]);
    const lats = coordinates.map((c) => c[1]);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const bounds = {
      bounds: [
        [minLon, minLat],
        [maxLon, maxLat],
      ],
    };

    const fitBoundsEvent = new CustomEvent('fitbounds', {
      detail: bounds,
    });
    window.dispatchEvent(fitBoundsEvent);

    return bounds;
  } catch (error) {
    console.error('Error calculating bounds:', error);
    return null;
  }
};

export const fetchLayerPaginated = async (
  base: string,
  layer: string,
  fireId: string,
  format: 'geojson' | 'csv',
  pageSize = 30
) => {
  const metaUrl = `${base}/${layer}/items?filter=fireid%3D${fireId}&sortby=-t&limit=1&f=geojson`;
  const metaJson = await fetch(metaUrl).then((r) => r.json());
  const total = metaJson.numberMatched ?? 0;

  if (format === 'geojson') {
    const coll = { type: 'FeatureCollection', features: [] as any[] };

    for (let offset = 0; offset < total; offset += pageSize) {
      const page = await fetch(
        `${base}/${layer}/items?filter=fireid%3D${fireId}&limit=${pageSize}&sortby=-t&offset=${offset}&f=geojson`
      ).then((r) => r.json());

      if (Array.isArray(page.features)) coll.features.push(...page.features);
    }

    return new Blob([JSON.stringify(coll)], { type: 'application/geo+json' });
  }

  let csv = '';
  for (let offset = 0; offset < total; offset += pageSize) {
    const txt = await fetch(
      `${base}/${layer}/items?filter=fireid%3D${fireId}&limit=${pageSize}&sortby=-t&offset=${offset}&f=csv`
    ).then((r) => r.text());

    csv += offset === 0 ? txt : txt.split('\n').slice(1).join('\n');
  }
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
};
