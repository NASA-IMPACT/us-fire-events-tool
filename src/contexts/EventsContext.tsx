import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchFireEvents, fetchFireStatistics,
  EventFeature,
  EventFilterParams
} from '../api/events';
import { useAppState } from './AppStateContext';

export interface GroupedEvents {
  [fireId: string]: {
    events: EventFeature[];
    totalArea: number;
    maxArea: number;
    isActive: boolean;
  };
}

interface EventsContextValue {
  events: EventFeature[];
  selectedEvent: EventFeature | null;
  eventTimeSeries: EventFeature[];
  groupedEvents: GroupedEvents;
  isLoading: boolean;
  error: Error | null;
  totalEvents: number;
  activeEvents: number;
  inactiveEvents: number;
  totalArea: number;
  applyFilters: (filters: EventFilterParams) => void;
  currentFilters: EventFilterParams;
}

const EventsContext = createContext<EventsContextValue | undefined>(undefined);

export const EventsProvider = ({ children }: { children: ReactNode }) => {
  const { timeRange, selectedEventId } = useAppState();
  const [filters, setFilters] = useState<EventFilterParams>({
    dateRange: [timeRange.start, timeRange.end]
  });

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      dateRange: [timeRange.start, timeRange.end]
    }));
  }, [timeRange]);

  const {
    data: events = [],
    isLoading: isLoadingEvents,
    error: eventsError
  } = useQuery({
    queryKey: ['fireEvents', filters],
    queryFn: () => fetchFireEvents(filters),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: statistics,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['fireStatistics', timeRange],
    queryFn: () => fetchFireStatistics(timeRange.start, timeRange.end),
    staleTime: 5 * 60 * 1000,
  });

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    const found = events.find(event => event.properties.fireid === selectedEventId) || null;
    return found;
  }, [selectedEventId, events]);

  const applyFilters = (newFilters: EventFilterParams) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const eventTimeSeries = useMemo(() => {
    if (selectedEventId) {
      const eventFireId = selectedEvent?.properties.fireid.toString();
      if (eventFireId) {
        return events.filter(e => e.properties.fireid.toString() === eventFireId);
      }
      return [];
    }
    return events;
  }, [events, selectedEvent, selectedEventId]);

  const groupedEvents = useMemo<GroupedEvents>(() => {
    return events.reduce((groups, event) => {
      const fireId = event.properties.fireid.toString();

      if (!groups[fireId]) {
        groups[fireId] = {
          events: [],
          totalArea: 0,
          maxArea: 0,
          isActive: false
        };
      }

      groups[fireId].events.push(event);
      groups[fireId].totalArea += event.properties.farea || 0;
      groups[fireId].maxArea = Math.max(groups[fireId].maxArea, event.properties.farea || 0);
      groups[fireId].isActive = groups[fireId].isActive || event.properties.isactive === 1;

      return groups;
    }, {} as GroupedEvents);
  }, [events]);

  const totalEvents = events.length;
  const activeEvents = events.filter(event => event.properties.isactive === 1).length;
  const inactiveEvents = totalEvents - activeEvents;
  const totalArea = events.reduce((sum, event) => sum + (event.properties.farea || 0), 0);

  const isLoading = isLoadingEvents || isLoadingStats;
  const error = eventsError || statsError;

  const value: EventsContextValue = {
    events,
    selectedEvent,
    eventTimeSeries,
    groupedEvents,
    isLoading,
    error,
    totalEvents,
    activeEvents,
    inactiveEvents,
    totalArea: statistics?.totalArea || totalArea,
    applyFilters,
    currentFilters: filters
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