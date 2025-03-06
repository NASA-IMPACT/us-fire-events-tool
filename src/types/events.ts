export interface EventCollection {
  type: string;
  features: EventFeature[];
  numberMatched: number;
  numberReturned: number;
  links: Array<{
    href: string;
    rel: string;
    type?: string;
    title?: string;
  }>;
}

export interface EventFeature {
  type: string;
  id: string;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
  properties: EventProperties;
}

export interface EventProperties {
  id: string;
  fireid: string | number;
  t: string;
  farea?: number;
  duration?: number;
  meanfrp?: number;
  fperim?: number;
  n_pixels?: number;
  n_newpixels?: number;
  isactive?: number;
  region?: string;
  pixden?: number;
  flinelen?: number;
  [key: string]: any;
}

export interface EventFilter {
  dateRange?: [Date, Date];
  fireAreaRange?: [number, number];
  durationRange?: [number, number];
  meanFrpRange?: [number, number];
  region?: string;
  isActive?: boolean;
  searchTerm?: string;
}

export interface GroupedEvent {
  fireId: string;
  events: EventFeature[];
  totalArea: number;
  maxArea: number;
  isActive: boolean;
  latestTimestamp: string;
  duration: number;
  meanFrp: number;
}

export interface TimeSeriesDataPoint {
  timestamp: number;
  farea: number;
  duration: number;
  meanfrp: number;
  fperim: number;
  n_pixels: number;
  [key: string]: number;
}

export interface EventStatistics {
  totalEvents: number;
  activeEvents: number;
  inactiveEvents: number;
  totalArea: number;
  maxArea: number;
  avgDuration: number;
  avgMeanFrp: number;
}

export interface RangeValue {
  min: number;
  max: number;
}