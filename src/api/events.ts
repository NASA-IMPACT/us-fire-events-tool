

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
 properties: {
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
 };
}

export interface EventFilterParams {
 bbox?: [number, number, number, number];
 dateRange?: [Date, Date];
 fireAreaRange?: [number, number];
 durationRange?: [number, number];
 meanFrpRange?: [number, number];
 isActive?: boolean;
 region?: string;
 searchTerm?: string;
 limit?: number;
 zoom?: number;
 useHistorical?: boolean;
 forceCollection?: string;
}
