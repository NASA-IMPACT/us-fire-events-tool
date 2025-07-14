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
