import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { ViewState } from 'react-map-gl/mapbox';
import { ClipExtension } from '@deck.gl/extensions';
import * as WeatherLayers from 'weatherlayers-gl';
import { getClosestWeatherData, WeatherDataset } from '../api/weather';
import { useAppState } from './AppStateContext';
import { useEvents } from './EventsContext';

const DEFAULT_VIEW_STATE: ViewState = {
  longitude: -95.7129,
  latitude: 37.0902,
  zoom: 3,
  pitch: 0,
  bearing: 0,
  transitionDuration: 300
};

interface MapContextValue {
  viewState: ViewState;
  setViewState: (viewState: ViewState) => void;
  layers: any[];
  deckRef: React.RefObject<DeckGL>;
  mapboxStyle: string;
  isLayersLoading: boolean;
  flyToEvent: (eventId: string) => void;
  flyToCoordinates: (longitude: number, latitude: number, zoom?: number) => void;
  flyToBounds: (bounds: [number, number, number, number]) => void;
  exportMapImage: () => Promise<string | null>;
  resetView: () => void;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const {
    showWindLayer,
    show3DMap,
    showSatelliteImagery,
    timeRange,
  } = useAppState();

  const { events } = useEvents();

  const [viewState, setViewState] = useState<ViewState>(DEFAULT_VIEW_STATE);
  const [layers, setLayers] = useState<any[]>([]);
  const [windLayer, setWindLayer] = useState<any | null>(null);
  const [isLayersLoading, setIsLayersLoading] = useState(false);
  const deckRef = useRef<DeckGL>(null);

  const mapboxStyle = showSatelliteImagery
    ? 'mapbox://styles/mapbox/satellite-v9'
    : 'mapbox://styles/mapbox/dark-v10';

  useEffect(() => {
    if (showWindLayer) {
      setIsLayersLoading(true);

      const initWindLayer = async () => {
        try {
          const { data } = await getClosestWeatherData(
            WeatherDataset.WIND_10M,
            timeRange.end
          );

          const particleLayer = new WeatherLayers.ParticleLayer({
            id: 'wind-particles',
            image: data.image,
            imageType: 'VECTOR',
            imageUnscale: data.imageUnscale,
            bounds: data.bounds,
            extensions: [new ClipExtension()],
            clipBounds: [-181, -85.051129, 181, 85.051129],

            numParticles: 10000,
            color: [135, 206, 235, 255],
            fadeOpacity: 0.92,
            dropRate: 0.003,
            dropRateBump: 0.01,

            speedFactor: 20,
            lineWidth: {
              type: 'exponential',
              value: 2.0,
              slope: 0.5,
              min: 1.0,
              max: 4.5
            },

            maxAge: 30,
            paths: 30,
            fadeIn: true,

            useWorkers: true,
            updateRate: 16,

            blendMode: 'screen',
            particleGradient: {
              0.0: [173, 216, 230, 0],
              0.1: [173, 216, 230, 255],
              0.4: [135, 206, 235, 255],
              0.7: [0, 191, 255, 255],
              1.0: [0, 191, 255, 0]
            },

            colorScale: {
              type: 'linear',
              domain: [0, 30],
              range: [
                [173, 216, 230, 0],
                [0, 0, 255]
              ]
            }
          });

          setWindLayer(particleLayer);
        } catch (error) {
          console.error('Error initializing wind layer:', error);
        } finally {
          setIsLayersLoading(false);
        }
      };

      initWindLayer();

      return () => {
        setWindLayer(null);
      };
    }
  }, [showWindLayer, timeRange.end]);

  useEffect(() => {
    const newLayers = [];

    if (windLayer && showWindLayer) {
      newLayers.push(windLayer);
    }

    setLayers(newLayers);
  }, [events, windLayer, showWindLayer]);

  useEffect(() => {
    if (show3DMap) {
      setViewState(prev => ({
        ...prev,
        pitch: 45,
        transitionDuration: 300
      }));
    } else {
      setViewState(prev => ({
        ...prev,
        pitch: 0,
        transitionDuration: 300
      }));
    }
  }, [show3DMap]);

  const flyToEvent = (eventId: string) => {
    const event = events.find(e => e.properties.fireid === eventId);

    if (event) {
      const coordinates = event.geometry.coordinates[0];

      let minLng = Infinity;
      let minLat = Infinity;
      let maxLng = -Infinity;
      let maxLat = -Infinity;

      coordinates.forEach((coord: number[]) => {
        const [lng, lat] = coord;
        minLng = Math.min(minLng, lng);
        minLat = Math.min(minLat, lat);
        maxLng = Math.max(maxLng, lng);
        maxLat = Math.max(maxLat, lat);
      });

      const padding = 0.5;

      flyToBounds([
        minLng - padding,
        minLat - padding,
        maxLng + padding,
        maxLat + padding
      ]);
    }
  };

  const flyToCoordinates = (longitude: number, latitude: number, zoom: number = 10) => {
    setViewState({
      ...viewState,
      longitude,
      latitude,
      zoom,
      transitionDuration: 1000
    });
  };

  const flyToBounds = (bounds: [number, number, number, number]) => {
    const [minLng, minLat, maxLng, maxLat] = bounds;

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    const maxDelta = Math.max(
      Math.abs(maxLng - minLng),
      Math.abs(maxLat - minLat)
    );
    const zoom = Math.floor(8 - Math.log2(maxDelta));

    setViewState({
      ...viewState,
      longitude: centerLng,
      latitude: centerLat,
      zoom: Math.min(Math.max(zoom, 3), 15),
      transitionDuration: 1000
    });
  };

  const exportMapImage = async (): Promise<string | null> => {
    if (!deckRef.current) {
      return null;
    }

    try {
      // Placeholder for the actual implementation
      return null;
    } catch (error) {
      console.error('Error exporting map image:', error);
      return null;
    }
  };

  const resetView = () => {
    setViewState({
      ...DEFAULT_VIEW_STATE,
      transitionDuration: 1000
    });
  };

  const value: MapContextValue = {
    viewState,
    setViewState,
    layers,
    deckRef,
    mapboxStyle,
    isLayersLoading,
    flyToEvent,
    flyToCoordinates,
    flyToBounds,
    exportMapImage,
    resetView
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};