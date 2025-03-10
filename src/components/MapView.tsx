import { useEffect, useState, useRef, useCallback } from 'react';
import { ClipExtension } from '@deck.gl/extensions';
import * as WeatherLayersClient from 'weatherlayers-gl/client';
import * as WeatherLayers from 'weatherlayers-gl';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/mapbox';
import { MVTLayer } from '@deck.gl/geo-layers';
import { WebMercatorViewport } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapViewState } from '@deck.gl/core';
import { useEvents } from '../contexts/EventsContext';
import { useAppState } from '../contexts/AppStateContext';
import _ from 'lodash';

const INITIAL_VIEW_STATE: MapViewState = {
    longitude: -95.7129,
    latitude: 37.0902,
    zoom: 3,
    pitch: 0,
    bearing: 0,
    maxZoom: 20,
    minZoom: 0,
    maxPitch: 0,
    minPitch: 0,
    transitionDuration: 300
};

const USA_BBOX = [-125.0, 24.5, -66.0, 49.5];

const MapView = () => {
    const { updateEvents } = useEvents();
    const { showWindLayer, show3DMap, setMapBounds, timeRange } = useAppState();

    const [layers, setLayers] = useState([]);
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    const [windLayer, setWindLayer] = useState(null);
    const [, setIsLayersLoading] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);
    const deckRef = useRef(null);
    const interactionTimeoutRef = useRef<number | null>(null);
    const lastBoundsRef = useRef(null);

    const collectVisibleFeaturesRef = useRef(null);

    const updateBounds = useCallback((viewState) => {
        const viewport = new WebMercatorViewport(viewState);
        const bounds = viewport.getBounds();

        lastBoundsRef.current = bounds;

        if (!isInteracting) {
            setMapBounds(bounds);
        }
    }, [setMapBounds, isInteracting]);

    const updateContextAfterInteraction = useCallback(() => {
        if (lastBoundsRef.current) {
          setMapBounds(lastBoundsRef.current);
        }

        if (deckRef.current) {
          const { width, height } = deckRef.current.deck;

          const features = deckRef.current.pickObjects({
            x: 0,
            y: 0,
            width,
            height,
            layerIds: ['fire-perimeters-mvt'],
            ignoreVisibility: true
          });

          updateEvents(features);
        }
      }, [setMapBounds, updateEvents]);


    useEffect(() => {
        collectVisibleFeaturesRef.current = _.debounce(() => {
            if (isInteracting) return;

            updateContextAfterInteraction();
        }, 600);

        return () => {
            if (collectVisibleFeaturesRef.current) {
                collectVisibleFeaturesRef.current.cancel();
            }
        };
    }, [isInteracting, updateContextAfterInteraction]);

    const collectVisibleFeatures = useCallback(() => {
        if (collectVisibleFeaturesRef.current) {
            collectVisibleFeaturesRef.current();
        }
    }, []);

    useEffect(() => {
        if (showWindLayer && !windLayer) {
            setIsLayersLoading(true);
            const initWindLayer = async () => {
                try {
                    const client = new WeatherLayersClient.Client({
                        accessToken: import.meta.env.VITE_WEATHER_LAYERS_TOKEN,
                        datetimeInterpolate: true,
                    });

                    const dataset = 'gfs/wind_10m_above_ground';
                    const currentDate = new Date().toISOString();
                    const datetimeRange = WeatherLayersClient.offsetDatetimeRange(currentDate, 0, 24);
                    const { datetimes } = await client.loadDatasetSlice(dataset, datetimeRange);
                    const data = await client.loadDatasetData(dataset, datetimes[0]);

                    const particleLayer = new WeatherLayers.ParticleLayer({
                        id: 'wind-particles',
                        image: data.image,
                        imageType: 'VECTOR',
                        imageUnscale: data.imageUnscale,
                        bounds: data.bounds,
                        extensions: [new ClipExtension()],
                        clipBounds: USA_BBOX,
                        numParticles: 5000,
                        color: [50, 50, 50, 255],
                        fadeOpacity: 0.92,
                        dropRate: 0.003,
                        dropRateBump: 0.01,
                        speedFactor: 20,
                        lineWidth: { type: 'exponential', value: 2.0, slope: 0.5, min: 1.0, max: 4.5 },
                        maxAge: 30,
                        paths: 30,
                        fadeIn: true,
                        useWorkers: true,
                        updateRate: 16,
                        blendMode: 'screen',
                        particleGradient: {
                            0.0: [50, 50, 50, 0],
                            0.1: [50, 50, 50, 255],
                            0.4: [30, 30, 30, 255],
                            0.7: [0, 0, 0, 255],
                            1.0: [0, 0, 0, 0]
                        },
                        colorScale: { type: 'linear', domain: [0, 30], range: [[50, 50, 50, 50], [0, 0, 0]] }
                    });

                    setWindLayer(particleLayer);
                    setIsLayersLoading(false);
                } catch (error) {
                    console.error('Error initializing wind layer:', error);
                    setIsLayersLoading(false);
                }
            };
            initWindLayer();
        } else if (!showWindLayer) {
            setWindLayer(null);
        }
    }, [windLayer, showWindLayer]);

    const handleTileLoad = useCallback((tile) => {
        loadedTilesRef.current.add(tile.id);
        allFeaturesRef.current = [...allFeaturesRef.current, ...newFeatures];

        if (tile && tile.data && tile.data.length > 0) {
            if (!isInteracting) {
                collectVisibleFeatures();
            }
        }
    }, [collectVisibleFeatures, isInteracting]);

    useEffect(() => {
        const newLayers = [
            new MVTLayer({
                id: 'fire-perimeters-mvt',
                data: 'https://firenrt.delta-backend.com/collections/public.eis_fire_snapshot_perimeter_nrt/tiles/{z}/{x}/{y}',
                getFillColor: (feature) => {
                    const featureTime = new Date(feature.properties.t).getTime();
                    const isInRange = featureTime >= timeRange.start.getTime() && featureTime <= timeRange.end.getTime();
                    return isInRange ? [255, 140, 0, 180] : [255, 140, 0, 0];
                },
                getLineColor: (feature) => {
                    const featureTime = new Date(feature.properties.t).getTime();
                    const isInRange = featureTime >= timeRange.start.getTime() && featureTime <= timeRange.end.getTime();
                    return isInRange ? [255, 69, 0, 255] : [255, 69, 0, 0];
                },
                lineWidthMinPixels: 1,
                pickable: true,
                autoHighlight: true,
                highlightColor: [255, 255, 255, 120],

                updateTriggers: {
                    getFillColor: timeRange,
                    getLineColor: timeRange
                },

                onTileLoad: (tile) => {
                    if (tile && tile.data && tile.data.length > 0) {
                        if (!isInteracting) {
                            collectVisibleFeatures();
                        }
                    }
                }
            })

        ];

        if (windLayer && showWindLayer) {
            newLayers.push(windLayer);
        }

        setLayers(newLayers);
    }, [windLayer, showWindLayer, handleTileLoad, isInteracting, timeRange]);

    useEffect(() => {
        if (show3DMap) {
            setViewState(prev => ({ ...prev, pitch: 45, transitionDuration: 300 }));
        } else {
            setViewState(prev => ({ ...prev, pitch: 0, transitionDuration: 300 }));
        }
    }, [show3DMap]);

    const handleInteractionStateChange = useCallback(({ isDragging, isPanning, isRotating, isZooming }) => {
        const isCurrentlyInteracting = isDragging || isPanning || isRotating || isZooming;

        if (interactionTimeoutRef.current !== null) {
            window.clearTimeout(interactionTimeoutRef.current);
            interactionTimeoutRef.current = null;
        }

        setIsInteracting(isCurrentlyInteracting);

        if (!isCurrentlyInteracting) {
            interactionTimeoutRef.current = window.setTimeout(() => {
                updateContextAfterInteraction();
            }, 500);
        }
    }, [updateContextAfterInteraction]);

    const handleViewStateChange = useCallback(({ viewState }) => {
        setViewState(viewState);

        updateBounds(viewState);
    }, [updateBounds]);

    return (
        <DeckGL
            ref={deckRef}
            viewState={viewState}
            onViewStateChange={handleViewStateChange}
            onInteractionStateChange={handleInteractionStateChange}
            layers={layers}
            controller={{ doubleClickZoom: false }}
        >
            <Map
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                mapStyle="mapbox://styles/devseed/cm7ueetbz00cc01qsdityey6n"
                projection="mercator"
                attributionControl={false}
                reuseMaps
            />
        </DeckGL>
    );
};

export default MapView;