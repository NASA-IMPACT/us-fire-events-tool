import { StateCreator } from 'zustand';
import {
  MVTFeature,
  fetchFirePerimeters,
  fetchAlternativeFirePerimeters,
  fitMapToBounds,
} from '../../utils/fireUtils';

export interface EventsState {
  selectedEventId: string | null;
  events: MVTFeature[];
  firePerimeters: GeoJSON.FeatureCollection | null;
  firePerimetersLoading: boolean;
}

export interface EventsActions {
  selectEvent: (
    eventId: string | null,
    featuresApiEndpoint?: string
  ) => Promise<void>;
  updateEvents: (events: MVTFeature[]) => void;
  setFirePerimeters: (perimeters: GeoJSON.FeatureCollection | null) => void;
  setFirePerimetersLoading: (loading: boolean) => void;
}

export type EventsSlice = EventsState & EventsActions;

export const createEventsSlice: StateCreator<
  EventsSlice,
  [],
  [],
  EventsSlice
> = (set, get) => ({
  selectedEventId: null,
  events: [],
  firePerimeters: null,
  firePerimetersLoading: false,
  selectEvent: async (eventId: string | null, featuresApiEndpoint?: string) => {
    set({
      selectedEventId: eventId,
    });

    if (eventId && featuresApiEndpoint) {
      set({ firePerimetersLoading: true });

      try {
        let perimeters = await fetchFirePerimeters(
          eventId,
          featuresApiEndpoint
        );

        if (!perimeters?.features?.length) {
          perimeters = await fetchAlternativeFirePerimeters(
            eventId,
            featuresApiEndpoint
          );
        }

        set({
          firePerimeters: perimeters,
          firePerimetersLoading: false,
        });

        if (perimeters?.features?.length > 0) {
          fitMapToBounds(perimeters.features[perimeters.features.length - 1]);
        }
      } catch (error) {
        console.error('Error fetching fire perimeters:', error);
        set({
          firePerimeters: null,
          firePerimetersLoading: false,
        });
      }
    } else {
      set({ firePerimeters: null });
    }
  },
  updateEvents: (events) => set({ events }),
  setFirePerimeters: (perimeters) => set({ firePerimeters: perimeters }),
  setFirePerimetersLoading: (loading) =>
    set({ firePerimetersLoading: loading }),
});
