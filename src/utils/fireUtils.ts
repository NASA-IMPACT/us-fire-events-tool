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
        padding: 40,
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
      padding: 40,
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
