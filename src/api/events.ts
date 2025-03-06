import { fetchFromOgcApi, formatBbox } from './client';

const LF_PERIMETER_COLLECTION = 'public.eis_fire_lf_perimeter_nrt';
const SNAPSHOT_PERIMETER_COLLECTION = 'public.eis_fire_snapshot_perimeter_nrt';

const USA_BBOX: [number, number, number, number] = [-125.0, 24.5, -66.0, 49.5];

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

export async function fetchFireEvents(params: EventFilterParams = {}): Promise<EventFeature[]> {
 const apiParams: Record<string, any> = {
   limit: params.limit || 100,
   f: 'geojson',
 };

 if (params.dateRange) {
  //  apiParams.datetime = `${formatDate(params.dateRange[0])}/${formatDate(params.dateRange[1])}`;
 }

 // Always use USA bbox if no specific bbox is provided
 const boundingBox = params.bbox || USA_BBOX;
 apiParams.bbox = formatBbox(boundingBox);

 const filters: string[] = [];

 if (params.fireAreaRange) {
   filters.push(`farea>=${params.fireAreaRange[0]} AND farea<=${params.fireAreaRange[1]}`);
 }

 if (params.durationRange) {
   filters.push(`duration>=${params.durationRange[0]} AND duration<=${params.durationRange[1]}`);
 }

 if (params.meanFrpRange) {
   filters.push(`meanfrp>=${params.meanFrpRange[0]} AND meanfrp<=${params.meanFrpRange[1]}`);
 }

 if (params.isActive !== undefined) {
   filters.push(`isactive=${params.isActive ? 1 : 0}`);
 }

 if (params.region) {
   filters.push(`region='${params.region}'`);
 }

 if (filters.length > 0) {
   apiParams.filter = filters.join(' AND ');
 }

 return;
 const response = await fetchFromOgcApi<EventCollection>(
   `/collections/${SNAPSHOT_PERIMETER_COLLECTION}/items`,
   apiParams
 );

 return response.features;
}

export async function fetchFireStatistics(
 startDate: Date,
 endDate: Date,
 params: EventFilterParams = {}
): Promise<{
 totalEvents: number;
 activeEvents: number;
 totalArea: number;
 maxArea: number;
 avgDuration: number;
}> {
 const updatedParams = {
   ...params,
   bbox: params.bbox || USA_BBOX
 };

 const events = await fetchFireEvents({
   dateRange: [startDate, endDate],
   limit: 100,
   useHistorical: updatedParams.useHistorical,
   zoom: updatedParams.zoom,
   bbox: updatedParams.bbox
 });

 const activeEvents = events.filter(event => event.properties.isactive === 1);
 const totalArea = events.reduce((sum, event) => sum + (event.properties.farea || 0), 0);

 const areas = events.map(event => event.properties.farea || 0);
 const maxArea = areas.length > 0 ? Math.max(...areas) : 0;

 const durations = events.map(event => event.properties.duration || 0);
 const avgDuration = durations.length > 0
   ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
   : 0;

 return {
   totalEvents: events.length,
   activeEvents: activeEvents.length,
   totalArea,
   maxArea,
   avgDuration
 };
}