import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppStateProvider } from './contexts/AppStateContext';
import { FiltersProvider } from './contexts/FiltersContext';
import { EventsProvider } from './contexts/EventsContext';
import { MapProvider } from './contexts/MapContext';
import { EnvProvider } from './contexts/EnvContext';
import Explorer from './views/Explorer';
import './App.scss';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

type Props = {
  mapboxAccessToken: string;
  featuresApiEndpoint: string;
};

export default function FireTool({ mapboxAccessToken, featuresApiEndpoint }: Props) {
  return (
    <EnvProvider mapboxAccessToken={mapboxAccessToken} featuresApiEndpoint={featuresApiEndpoint}>
      <QueryClientProvider client={queryClient}>
        <AppStateProvider>
          <FiltersProvider>
            <EventsProvider>
              <MapProvider>
                <Explorer />
              </MapProvider>
            </EventsProvider>
          </FiltersProvider>
        </AppStateProvider>
      </QueryClientProvider>
    </EnvProvider>
  );
}
