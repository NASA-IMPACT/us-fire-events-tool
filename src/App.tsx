import { useEffect, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFireExplorerStore } from './state/useFireExplorerStore';
import Explorer from './views/Explorer';
import './App.scss';
import useToolState from './state/useToolState';
import { debounce } from 'lodash';

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
  const { state: toolState, setState: setToolState } = useToolState();

  useEffect(() => {
    setEnvConfig({
      mapboxAccessToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
      featuresApiEndpoint: import.meta.env.VITE_FEATURES_API_ENDPOINT || '',
    });
  }, [setEnvConfig]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('fireEventExplorer');
    if (encoded) {
      try {
        const parsed = JSON.parse(decodeURIComponent(encoded));

        if (parsed.timeRange) {
          parsed.timeRange = {
            start: new Date(parsed.timeRange.start),
            end: new Date(parsed.timeRange.end),
          };
        }

        setToolState({
          ...parsed,
          viewStateForUrl: parsed.viewState,
        });
      } catch (e) {
        console.error('Invalid fireEventExplorer param', e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const debouncedUpdateUrl = useCallback(
    debounce((state) => {
      const serializable = {
        ...state,
        timeRange: {
          start: state.timeRange?.start?.toISOString?.(),
          end: state.timeRange?.end?.toISOString?.(),
        },
        viewState: state.viewStateForUrl,
      };

      const encoded = encodeURIComponent(JSON.stringify(serializable));
      const params = new URLSearchParams(window.location.search);

      if (params.get('fireEventExplorer') !== encoded) {
        params.set('fireEventExplorer', encoded);
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedUpdateUrl(toolState);
  }, [toolState, debouncedUpdateUrl]);

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
