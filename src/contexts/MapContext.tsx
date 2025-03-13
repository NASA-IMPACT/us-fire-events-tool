import { createContext, useContext, useReducer, useEffect, ReactNode, useRef, useCallback } from 'react';
import { ViewState } from 'react-map-gl/mapbox';
import { useAppState } from './AppStateContext';
import { useEvents } from './EventsContext';

const DEFAULT_VIEW_STATE: ViewState = {
  longitude: -95.7129,
  latitude: 37.0902,
  zoom: 3,
  pitch: 0,
  bearing: 0
};

const DEFAULT_OPACITY = 100;

interface MapState {
  viewState: ViewState;
  layers: any[];
  windLayer: any | null;
  isLayersLoading: boolean;
  layerOpacity: number;
}

type MapAction =
  | { type: 'SET_VIEW_STATE'; payload: ViewState }
  | { type: 'SET_LAYERS'; payload: any[] }
  | { type: 'SET_WIND_LAYER'; payload: any | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LAYER_OPACITY'; payload: number }
  | { type: 'RESET_VIEW' }
  | { type: 'FLY_TO_COORDINATES'; payload: { longitude: number; latitude: number; zoom?: number } }
  | { type: 'FLY_TO_BOUNDS'; payload: [number, number, number, number] };

const initialState: MapState = {
  viewState: DEFAULT_VIEW_STATE,
  layers: [],
  windLayer: null,
  isLayersLoading: false,
  layerOpacity: DEFAULT_OPACITY
};

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'SET_VIEW_STATE':
      return { ...state, viewState: action.payload };

    case 'SET_LAYERS':
      return { ...state, layers: action.payload };

    case 'SET_WIND_LAYER':
      return { ...state, windLayer: action.payload };

    case 'SET_LOADING':
      return { ...state, isLayersLoading: action.payload };

    case 'SET_LAYER_OPACITY':
      return { ...state, layerOpacity: action.payload };

    case 'RESET_VIEW':
      return {
        ...state,
        viewState: {
          ...DEFAULT_VIEW_STATE
        }
      };

    case 'FLY_TO_COORDINATES': {
      const { longitude, latitude, zoom = 10 } = action.payload;
      return {
        ...state,
        viewState: {
          ...state.viewState,
          longitude,
          latitude,
          zoom
        }
      };
    }

    case 'FLY_TO_BOUNDS': {
      const [minLng, minLat, maxLng, maxLat] = action.payload;
      const centerLng = (minLng + maxLng) / 2;
      const centerLat = (minLat + maxLat) / 2;

      const maxDelta = Math.max(
        Math.abs(maxLng - minLng),
        Math.abs(maxLat - minLat)
      );
      const zoom = Math.floor(8 - Math.log2(maxDelta));

      return {
        ...state,
        viewState: {
          ...state.viewState,
          longitude: centerLng,
          latitude: centerLat,
          zoom: Math.min(Math.max(zoom, 3), 15)
        }
      };
    }

    default:
      return state;
  }
}

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
  layerOpacity: number;
  setLayerOpacity: (opacity: number) => void;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const {
    show3DMap,
    showSatelliteImagery
  } = useAppState();

  const { events } = useEvents();
  const deckRef = useRef<DeckGL>(null);

  const [state, dispatch] = useReducer(mapReducer, initialState);
  const { viewState, layers, isLayersLoading, layerOpacity } = state;

  const mapboxStyle = showSatelliteImagery
    ? 'mapbox://styles/mapbox/satellite-v9'
    : 'mapbox://styles/mapbox/dark-v10';

  useEffect(() => {
    dispatch({
      type: 'SET_VIEW_STATE',
      payload: {
        ...viewState,
        pitch: show3DMap ? 45 : 0
      }
    });
  }, [show3DMap]);

  const setViewState = useCallback((newViewState: ViewState) => {
    dispatch({ type: 'SET_VIEW_STATE', payload: newViewState });
  }, []);

  const flyToEvent = useCallback((eventId: string) => {
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

      dispatch({
        type: 'FLY_TO_BOUNDS',
        payload: [
          minLng - padding,
          minLat - padding,
          maxLng + padding,
          maxLat + padding
        ]
      });
    }
  }, [events]);

  const flyToCoordinates = useCallback((longitude: number, latitude: number, zoom: number = 10) => {
    dispatch({
      type: 'FLY_TO_COORDINATES',
      payload: { longitude, latitude, zoom }
    });
  }, []);

  const flyToBounds = useCallback((bounds: [number, number, number, number]) => {
    dispatch({ type: 'FLY_TO_BOUNDS', payload: bounds });
  }, []);

  const resetView = useCallback(() => {
    dispatch({ type: 'RESET_VIEW' });
  }, []);

  const setLayerOpacity = useCallback((opacity: number) => {
    dispatch({ type: 'SET_LAYER_OPACITY', payload: opacity });
  }, []);

  const exportMapImage = async (): Promise<string | null> => {
    if (!deckRef.current) {
      return null;
    }

    try {
      // TODO: Placeholder for the actual implementation
      // of the export functionality for gifs / videos
      return null;
    } catch (error) {
      console.error('Error exporting map image:', error);
      return null;
    }
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
    resetView,
    layerOpacity,
    setLayerOpacity
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