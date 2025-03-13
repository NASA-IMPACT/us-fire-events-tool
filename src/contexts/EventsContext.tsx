import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback, useRef } from 'react';
import { EventFilterParams } from '../api/events';
import { useAppState } from './AppStateContext';

export interface MVTFeature {
  geometry: {
    type: string;
    coordinates?: any;
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
    [key: string]: any;
  };
  object?: {
    properties?: any;
    geometry?: any;
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

interface EventsContextValue {
  events: MVTFeature[];
  updateEvents: (mvtFeatures: any[]) => void;
  eventTimeSeries: MVTFeature[];
  groupedEvents: GroupedEvents;
  totalEvents: number;
  activeEvents: number;
  inactiveEvents: number;
  totalArea: number;
  applyFilters: (filters: EventFilterParams) => void;
  currentFilters: EventFilterParams;
  selectedEventId: string | null;
  selectEvent: (eventId: string | null) => void;
  getFilteredEvents: (start: Date, end: Date) => MVTFeature[];
  firePerimeters: GeoJSON.FeatureCollection | null;
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

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

export const fetchFirePerimeters = async (fireId: string) => {
  const url = `https://firenrt.delta-backend.com/collections/public.eis_fire_lf_perimeter_nrt/items?filter=fireid%3D${fireId}&limit=50&f=geojson`;

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

export const fetchAlternativeFirePerimeters = async (fireId: string) => {
  const url = `https://firenrt.delta-backend.com/collections/public.eis_fire_snapshot_perimeter_nrt/items?filter=fireid%3D${fireId}&limit=50&f=geojson`;

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

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const { timeRange } = useAppState();
  const [filters, setFilters] = useState<EventFilterParams>({
    dateRange: [timeRange.start, timeRange.end]
  });

  const [events, setEvents] = useState<MVTFeature[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const prevFeaturesRef = useRef<MVTFeature[]>([]);
  const pendingFeaturesRef = useRef<MVTFeature[] | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);
  const [firePerimeters, setFirePerimeters] = useState<GeoJSON.FeatureCollection | null>(null);

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      dateRange: [timeRange.start, timeRange.end]
    }));
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
        setEvents(newFeatures);
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
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const selectEvent = useCallback(async (eventId: string | null) => {
    setSelectedEventId(eventId);

    if (eventId) {
      let perimeters = await fetchFirePerimeters(eventId);

      if (!perimeters || !perimeters.features || perimeters.features.length === 0) {
        perimeters = await fetchAlternativeFirePerimeters(eventId);
      }

      setFirePerimeters(perimeters);
    } else {
      setFirePerimeters(null);
    }
  }, []);


  const getFilteredEvents = useCallback((start: Date, end: Date) => {
    return events.filter(event => {
      const props = getFeatureProperties(event);
      const eventTime = new Date(props.t).getTime();
      return eventTime >= start.getTime() && eventTime <= end.getTime();
    });
  }, [events]);


  const eventTimeSeries = useMemo(() => {
    return events;
  }, [events]);

  const groupedEvents = useMemo<GroupedEvents>(() => {
    return events.reduce((groups, event) => {
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
  }, [events]);

  const metrics = useMemo(() => {
    const totalEvents = events.length;
    const activeEvents = events.filter(event => Number(getFeatureProperties(event).isactive) === 1).length;
    const inactiveEvents = totalEvents - activeEvents;
    const totalArea = events.reduce((sum, event) => sum + (getFeatureProperties(event).farea || 0), 0);

    return { totalEvents, activeEvents, inactiveEvents, totalArea };
  }, [events]);

  const value: EventsContextValue = {
    events,
    updateEvents,
    eventTimeSeries,
    groupedEvents,
    totalEvents: metrics.totalEvents,
    activeEvents: metrics.activeEvents,
    inactiveEvents: metrics.inactiveEvents,
    totalArea: metrics.totalArea,
    applyFilters,
    currentFilters: filters,
    selectedEventId,
    selectEvent,
    getFilteredEvents,
    firePerimeters
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