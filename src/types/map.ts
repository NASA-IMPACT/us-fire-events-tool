import { ViewState } from 'react-map-gl/mapbox';

export interface MapViewState extends ViewState {
  transitionDuration?: number;
  transitionInterpolator?: any;
  transitionEasing?: (t: number) => number;
}

export type BoundingBox = [number, number, number, number];

export enum MapStyle {
  DARK = 'mapbox://styles/mapbox/dark-v10',
  LIGHT = 'mapbox://styles/mapbox/light-v10',
  SATELLITE = 'mapbox://styles/mapbox/satellite-v9',
  SATELLITE_STREETS = 'mapbox://styles/mapbox/satellite-streets-v11',
  OUTDOORS = 'mapbox://styles/mapbox/outdoors-v11'
}

export interface LayerVisibility {
  perimeters: boolean;
  fireLines: boolean;
  wind: boolean;
  pixels: boolean;
}

export interface PopupInfo {
  longitude: number;
  latitude: number;
  feature: any;
}

export interface MapClickInfo {
  x: number;
  y: number;
  longitude: number;
  latitude: number;
  coordinate: [number, number];
  index?: number;
  object?: any;
  picked?: boolean;
  layer?: any;
}

export interface LayerRenderOptions {
  fillOpacity: number;
  lineWidth: number;
  elevation: number;
  extruded: boolean;
}

export interface WindLayerOptions {
  numParticles: number;
  fadeOpacity: number;
  speedFactor: number;
  dropRate: number;
  dropRateBump: number;
  colorScale: {
    type: string;
    domain: number[];
    range: number[][];
  };
}