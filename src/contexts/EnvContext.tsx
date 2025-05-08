import React, { createContext, useContext } from 'react';

type EnvContextType = {
  featuresApiEndpoint: string;
  mapboxAccessToken: string;
};

const EnvContext = createContext<EnvContextType | undefined>(undefined);

export const EnvProvider = ({
  featuresApiEndpoint,
  mapboxAccessToken,
  children,
}: {
  featuresApiEndpoint: string;
  mapboxAccessToken: string;
  children: React.ReactNode;
}) => {
  return (
    <EnvContext.Provider value={{ featuresApiEndpoint, mapboxAccessToken }}>
      {children}
    </EnvContext.Provider>
  );
};

export const useEnv = () => {
  const context = useContext(EnvContext);
  if (!context) throw new Error('useEnv must be used within EnvProvider');
  return context;
};
