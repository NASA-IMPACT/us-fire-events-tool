import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFireExplorerStore } from './state/useFireExplorerStore';
import Explorer from './views/Explorer';
import './App.scss';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppContent = () => {
  const setEnvConfig = useFireExplorerStore.use.setEnvConfig();

  useEffect(() => {
    setEnvConfig({
      mapboxAccessToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
      featuresApiEndpoint: import.meta.env.VITE_FEATURES_API_ENDPOINT || '',
    });
  }, [setEnvConfig]);

  return <Explorer />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
