import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { ViewState } from 'react-map-gl/mapbox';
import { useAppState } from './AppStateContext';

const DEFAULT_VIEW_STATE: ViewState = {
  longitude: -95.7129,
  latitude: 37.0902,
  zoom: 3,
  pitch: 0,
  bearing: 0,
  padding: {
    top: undefined,
    bottom: undefined,
    right: undefined,
    left: undefined,
  },
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
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LAYER_OPACITY'; payload: number };

const initialState: MapState = {
  viewState: DEFAULT_VIEW_STATE,
  layers: [],
  windLayer: null,
  isLayersLoading: false,
  layerOpacity: DEFAULT_OPACITY,
};

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'SET_VIEW_STATE':
      return { ...state, viewState: action.payload };

    case 'SET_LAYERS':
      return { ...state, layers: action.payload };

    case 'SET_LAYER_OPACITY':
      return { ...state, layerOpacity: action.payload };

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
  layerOpacity: number;
  setLayerOpacity: (opacity: number) => void;
}

const MapContext = createContext<MapContextValue | undefined>(undefined);

export const MapProvider = ({ children }: { children: ReactNode }) => {
  const { show3DMap, showSatelliteImagery } = useAppState();

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
        pitch: show3DMap ? 45 : 0,
      },
    });
  }, [show3DMap]);

  const setViewState = useCallback((newViewState: ViewState) => {
    dispatch({ type: 'SET_VIEW_STATE', payload: newViewState });
  }, []);

  const setLayerOpacity = useCallback((opacity: number) => {
    dispatch({ type: 'SET_LAYER_OPACITY', payload: opacity });
  }, []);

  const value: MapContextValue = {
    viewState,
    setViewState,
    layers,
    deckRef,
    mapboxStyle,
    isLayersLoading,
    layerOpacity,
    setLayerOpacity,
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
