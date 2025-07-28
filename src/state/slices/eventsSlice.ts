import { StateCreator } from 'zustand';
import {
  MVTFeature,
  fetchAlternativeFirePerimeters,
  fitMapToBounds,
  fetchLayerPaginated,
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
        const perimetersBlob = await fetchLayerPaginated(
          `${featuresApiEndpoint}/collections`,
          'public.eis_fire_lf_perimeter_nrt',
          eventId,
          'geojson'
        );
        let perimeters = await perimetersBlob.text().then(JSON.parse);

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
          const sorted = [...perimeters.features].sort(
            (a, b) =>
              new Date(b.properties.t).getTime() -
              new Date(a.properties.t).getTime()
          );
          fitMapToBounds(sorted[0]);
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
