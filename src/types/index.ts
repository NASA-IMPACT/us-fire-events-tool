export * from './events';
export * from './map';
export * from './app';

export interface WeatherData {
  image: any;
  imageType: string;
  imageUnscale: any;
  bounds: [number, number, number, number];
  type?: string;
}

export interface AnimationFrame {
  datetime: string;
  data: WeatherData;
}

export interface WithChildrenProps {
  children: React.ReactNode;
}

export interface ApiError {
  status: number;
  message: string;
  details?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: ApiError;
}

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
