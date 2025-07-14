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

type Props = {
  mapboxAccessToken: string;
  featuresApiEndpoint: string;
};

const ExplorerWithConfig = ({
  mapboxAccessToken,
  featuresApiEndpoint,
}: Props) => {
  const setEnvConfig = useFireExplorerStore.use.setEnvConfig();

  useEffect(() => {
    setEnvConfig({
      mapboxAccessToken,
      featuresApiEndpoint,
    });
  }, [setEnvConfig, mapboxAccessToken, featuresApiEndpoint]);

  return <Explorer />;
};

export default function WildfireExplorer({
  mapboxAccessToken,
  featuresApiEndpoint,
}: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ExplorerWithConfig
        mapboxAccessToken={mapboxAccessToken}
        featuresApiEndpoint={featuresApiEndpoint}
      />
    </QueryClientProvider>
  );
}
