import { create } from 'zustand';
import { StoreApi, UseBoundStore } from 'zustand';
import { createUISlice, UISlice } from './slices/uiSlice';
import { createMapSlice, MapSlice } from './slices/mapSlice';
import { createEventsSlice, EventsSlice } from './slices/eventsSlice';
import {
  createFiltersSlice,
  FiltersSlice,
  FilterRange,
  DEFAULT_RANGES,
} from './slices/filtersSlice';
import { createEnvSlice, EnvSlice } from './slices/envSlice';

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

// Auto-generate store selectors following this guideline:
// https://zustand.docs.pmnd.rs/guides/auto-generating-selectors
const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (const k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }
  return store;
};

type FireExplorerStore = UISlice &
  MapSlice &
  EventsSlice &
  FiltersSlice &
  EnvSlice;

const useFireExplorerStoreBase = create<FireExplorerStore>()(
  (set, get, ...rest) => {
    const uiSlice = createUISlice(set, get, ...rest);
    const mapSlice = createMapSlice(set, get, ...rest);
    const eventsSlice = createEventsSlice(set, get, ...rest);
    const filtersSlice = createFiltersSlice(set, get, ...rest);
    const envSlice = createEnvSlice(set, get, ...rest);

    return {
      ...uiSlice,
      ...mapSlice,
      ...eventsSlice,
      ...filtersSlice,
      ...envSlice,
      selectEvent: async (
        eventId: string | null,
        featuresApiEndpoint?: string
      ) => {
        uiSlice.setViewMode(eventId ? 'detail' : 'explorer');
        await eventsSlice.selectEvent(eventId, featuresApiEndpoint);
      },
    };
  }
);

export const useFireExplorerStore = createSelectors(useFireExplorerStoreBase);

export type { FilterRange, FireExplorerStore };
export { DEFAULT_RANGES };
