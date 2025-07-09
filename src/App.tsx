import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppStateProvider } from './contexts/AppStateContext';
import { FiltersProvider } from './contexts/FiltersContext';
import { EventsProvider } from './contexts/EventsContext';
import { MapProvider } from './contexts/MapContext';
import { EnvProvider } from './contexts/EnvContext';
import { ThemeProvider } from './contexts/ThemeContext';
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

function App() {
  return (
    <ThemeProvider>
      <EnvProvider mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN} featuresApiEndpoint={import.meta.env.VITE_FEATURES_API_ENDPOINT}>
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
    </ThemeProvider>
  );
}

export default App;