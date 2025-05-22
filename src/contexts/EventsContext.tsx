import { createContext, useContext, useReducer, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { useAppState } from './AppStateContext';
import { useEnv } from './EnvContext';

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

export interface GroupedEvents {
  [fireId: string]: {
    events: MVTFeature[];
    totalArea: number;
    maxArea: number;
    isActive: boolean;
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
interface EventsState {
  events: MVTFeature[];
  filters: EventFilterParams;
  selectedEventId: string | null;
  firePerimeters: GeoJSON.FeatureCollection | null;
  firePerimetersLoading: boolean;
}

type EventsAction =
  | { type: 'SET_EVENTS'; payload: MVTFeature[] }
  | { type: 'APPLY_FILTERS'; payload: EventFilterParams }
  | { type: 'SELECT_EVENT'; payload: string | null }
  | { type: 'SET_FIRE_PERIMETERS'; payload: GeoJSON.FeatureCollection | null }
  | { type: 'SET_FIRE_PERIMETERS_LOADING'; payload: boolean };

interface EventsContextValue extends Omit<EventsState, 'filters'> {
  updateEvents: (mvtFeatures: MVTFeature[]) => void;
  groupedEvents: GroupedEvents;
  totalEvents: number;
  activeEvents: number;
  inactiveEvents: number;
  totalArea: number;
  applyFilters: (filters: EventFilterParams) => void;
  currentFilters: EventFilterParams;
  selectEvent: (eventId: string | null) => void;
  getFilteredEvents: (start: Date, end: Date) => MVTFeature[];
}

export const getFeatureProperties = (feature: MVTFeature | null) => {
  if (!feature) return {};
  return feature.properties || (feature.object && feature.object.properties) || {};
};

export const getFeatureGeometry = (feature: MVTFeature) => {
  return feature.geometry || (feature.object && feature.object.geometry) || { type: 'Polygon' };
};

export const getFireId = (feature: MVTFeature) => {
  const props = getFeatureProperties(feature);
  return props.fireid?.toString() || '';
};

export const isFeatureActive = (feature: MVTFeature) => {
  const props = getFeatureProperties(feature);
  return Number(props.isactive) === 1;
};

export const getFeatureArea = (feature: MVTFeature) => {
  const props = getFeatureProperties(feature);
  return props.farea || 0;
};

const areFeatureArraysEqual = (prevFeatures: MVTFeature[], nextFeatures: MVTFeature[]) => {
  if (prevFeatures.length !== nextFeatures.length) return false;
  return true;
};

export const fetchFirePerimeters = async (fireId: string, baseUrl: string) => {
  const url = `${baseUrl}/collections/public.eis_fire_lf_perimeter_nrt/items?filter=fireid%3D${fireId}&limit=500&f=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch fire perimeters: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching fire perimeters:", error);
    return null;
  }
};

export const fetchAlternativeFirePerimeters = async (fireId: string, baseUrl: string) => {
  const url = `${baseUrl}/collections/public.eis_fire_snapshot_perimeter_nrt/items?filter=fireid%3D${fireId}&limit=500&f=geojson`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch alternative fire perimeters: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching alternative fire perimeters:", error);
    return null;
  }
};

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

const eventsReducer = (state: EventsState, action: EventsAction): EventsState => {
  switch (action.type) {
    case 'SET_EVENTS':
      return {
        ...state,
        events: action.payload
      };
    case 'APPLY_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };
    case 'SELECT_EVENT':
      return {
        ...state,
        selectedEventId: action.payload
      };
    case 'SET_FIRE_PERIMETERS':
      return {
        ...state,
        firePerimeters: action.payload
      };
    case 'SET_FIRE_PERIMETERS_LOADING':
      return {
        ...state,
        firePerimetersLoading: action.payload
      };
    default:
      return state;
  }
};

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const { timeRange } = useAppState();
  const { featuresApiEndpoint } = useEnv();

  const initialState: EventsState = {
    events: [],
    filters: {
      dateRange: [timeRange.start, timeRange.end]
    },
    selectedEventId: null,
    firePerimeters: null
  };

  const [state, dispatch] = useReducer(eventsReducer, initialState);
  const prevFeaturesRef = useRef<MVTFeature[]>([]);
  const pendingFeaturesRef = useRef<MVTFeature[] | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    dispatch({
      type: 'APPLY_FILTERS',
      payload: {
        dateRange: [timeRange.start, timeRange.end]
      }
    });
  }, [timeRange]);

  const updateEvents = useCallback((mvtFeatures: MVTFeature[]) => {
    const validFeatures = mvtFeatures.filter(feature => {
      const props = getFeatureProperties(feature);
      return !!props.fireid;
    });

    pendingFeaturesRef.current = validFeatures;

    if (updateTimeoutRef.current !== null) {
      window.clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = window.setTimeout(() => {
      const newFeatures = pendingFeaturesRef.current;

      if (newFeatures && !areFeatureArraysEqual(prevFeaturesRef.current, newFeatures)) {
        dispatch({ type: 'SET_EVENTS', payload: newFeatures });
        prevFeaturesRef.current = newFeatures;
      }

      pendingFeaturesRef.current = null;
      updateTimeoutRef.current = null;
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current !== null) {
        window.clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const applyFilters = useCallback((newFilters: EventFilterParams) => {
    dispatch({ type: 'APPLY_FILTERS', payload: newFilters });
  }, []);

  const selectEvent = useCallback(async (eventId: string | null) => {
    dispatch({ type: 'SELECT_EVENT', payload: eventId });

    if (eventId) {
      dispatch({ type: 'SET_FIRE_PERIMETERS_LOADING', payload: true });

      let perimeters = await fetchFirePerimeters(eventId, featuresApiEndpoint);

      if (!perimeters || !perimeters.features || perimeters.features.length === 0) {
        perimeters = await fetchAlternativeFirePerimeters(eventId, featuresApiEndpoint);
      }

      dispatch({ type: 'SET_FIRE_PERIMETERS', payload: perimeters });
      dispatch({ type: 'SET_FIRE_PERIMETERS_LOADING', payload: false });
    } else {
      dispatch({ type: 'SET_FIRE_PERIMETERS', payload: null });
    }
  }, []);

  const getFilteredEvents = useCallback((start: Date, end: Date) => {
    return state.events.filter(event => {
      const props = getFeatureProperties(event);
      const eventTime = new Date(props.t).getTime();
      return eventTime >= start.getTime() && eventTime <= end.getTime();
    });
  }, [state.events]);

  const groupedEvents = useMemo<GroupedEvents>(() => {
    return state.events.reduce((groups, event) => {
      const props = getFeatureProperties(event);
      const fireId = props.fireid?.toString() || '';

      if (!fireId) return groups;

      if (!groups[fireId]) {
        groups[fireId] = {
          events: [],
          totalArea: 0,
          maxArea: 0,
          isActive: false
        };
      }

      groups[fireId].events.push(event);
      groups[fireId].totalArea += props.farea || 0;
      groups[fireId].maxArea = Math.max(groups[fireId].maxArea, props.farea || 0);
      groups[fireId].isActive = groups[fireId].isActive || Number(props.isactive) === 1;

      return groups;
    }, {} as GroupedEvents);
  }, [state.events]);

  const metrics = useMemo(() => {
    const totalEvents = state.events.length;
    const activeEvents = state.events.filter(event => Number(getFeatureProperties(event).isactive) === 1).length;
    const inactiveEvents = totalEvents - activeEvents;
    const totalArea = state.events.reduce((sum, event) => sum + (getFeatureProperties(event).farea || 0), 0);

    return { totalEvents, activeEvents, inactiveEvents, totalArea };
  }, [state.events]);

  const value: EventsContextValue = {
    events: state.events,
    updateEvents,
    groupedEvents,
    totalEvents: metrics.totalEvents,
    activeEvents: metrics.activeEvents,
    inactiveEvents: metrics.inactiveEvents,
    totalArea: metrics.totalArea,
    applyFilters,
    currentFilters: state.filters,
    selectedEventId: state.selectedEventId,
    selectEvent,
    getFilteredEvents,
    firePerimeters: state.firePerimeters,
    firePerimetersLoading: state.firePerimetersLoading
  };

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};