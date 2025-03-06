const OGC_API_URL = 'https://firenrt.delta-backend.com';

export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const formatBbox = (bbox: [number, number, number, number]): string => {
  return bbox.join(',');
};

export async function fetchFromOgcApi<T>(
  path: string,
  params: Record<string, string | string[] | number | boolean | undefined> = {}
): Promise<T> {
  if (params.f === undefined) {
    params.f = 'geojson';
  }

  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, string | string[] | number | boolean>);

  const searchParams = new URLSearchParams();

  Object.entries(filteredParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => searchParams.append(key, v.toString()));
    } else {
      searchParams.append(key, value.toString());
    }
  });

  const url = `${OGC_API_URL}${path}?${searchParams.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}