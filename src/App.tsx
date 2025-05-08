import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
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

function App() {
  return (
    <EnvProvider mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN} featuresApiEndpoint={import.meta.env.VITE_FEATURES_API_ENDPOINT}>
      <Router>
        <QueryClientProvider client={queryClient}>
          <AppStateProvider>
            <FiltersProvider>
              <EventsProvider>
                <MapProvider>
                  <Routes>
                    <Route path="/" element={<Explorer />} />
                  </Routes>
                </MapProvider>
              </EventsProvider>
            </FiltersProvider>
          </AppStateProvider>
        </QueryClientProvider>
      </Router>
    </EnvProvider>
  );
}

export default App;