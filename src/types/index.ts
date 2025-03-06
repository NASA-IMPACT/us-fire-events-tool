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