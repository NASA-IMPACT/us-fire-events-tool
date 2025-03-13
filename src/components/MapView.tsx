import { useEffect, useState, useRef, useCallback } from 'react';
import { ClipExtension } from '@deck.gl/extensions';
import * as WeatherLayersClient from 'weatherlayers-gl/client';
import * as WeatherLayers from 'weatherlayers-gl';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/mapbox';
import { MVTLayer } from '@deck.gl/geo-layers';
import { WebMercatorViewport } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getFireId, useEvents } from '../contexts/EventsContext';
import { useAppState } from '../contexts/AppStateContext';
import { useFilters } from '../contexts/FiltersContext';
import _ from 'lodash';
import { GeoJsonLayer } from '@deck.gl/layers';
import { useMap } from '../contexts/MapContext';

const INITIAL_VIEW_STATE = {
    longitude: -95.7129,
    latitude: 37.0902,
    zoom: 3,
    pitch: 0,
    bearing: 0,
    maxZoom: 20,
    minZoom: 0,
};

const USA_BBOX = [-125.0, 24.5, -66.0, 49.5];
const INTERACTION_TIMEOUT = 500;
const FEATURES_COLLECTION_DEBOUNCE = 1500;
const TILE_URL = 'https://firenrt.delta-backend.com/collections/public.eis_fire_snapshot_perimeter_nrt/tiles/{z}/{x}/{y}';
const MAP_STYLE = 'mapbox://styles/devseed/cm7ueetbz00cc01qsdityey6n';

const MapView = () => {
    const { firePerimeters, updateEvents, selectEvent } = useEvents();
    const { showWindLayer, show3DMap, setMapBounds, timeRange, setViewMode } = useAppState();
    const {
        fireArea,
        duration,
        meanFrp,
        searchTerm,
        region,
        isActive,
        showAdvancedFilters
    } = useFilters();
    const { layerOpacity } = useMap()

    const [layers, setLayers] = useState([]);
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    const [windLayer, setWindLayer] = useState(null);
    const [, setIsLayersLoading] = useState(false);
    const [isInteracting, setIsInteracting] = useState(false);

    const deckRef = useRef(null);
    const interactionTimeoutRef = useRef(null);
    const lastBoundsRef = useRef(null);
    const loadedTilesRef = useRef(new Set());
    const allFeaturesRef = useRef([]);
    const collectVisibleFeaturesRef = useRef(null);

    const filterDependencies = [
        timeRange,
        showAdvancedFilters,
        fireArea,
        duration,
        meanFrp,
        region,
        isActive,
        searchTerm
    ];

    const updateBounds = useCallback((viewState) => {
        const viewport = new WebMercatorViewport(viewState);
        const bounds = viewport.getBounds();
        lastBoundsRef.current = bounds;

        if (!isInteracting) {
            setMapBounds(bounds);
        }
    }, [setMapBounds, isInteracting]);

    const updateContextAfterInteraction = useCallback(() => {
        if (!lastBoundsRef.current || !deckRef.current) return;

        setMapBounds(lastBoundsRef.current);

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
    }, [setMapBounds, updateEvents]);

    useEffect(() => {
        collectVisibleFeaturesRef.current = _.debounce(() => {
            if (!isInteracting) {
                updateContextAfterInteraction();
            }
        }, FEATURES_COLLECTION_DEBOUNCE);

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
            initializeWindLayer();
        } else if (!showWindLayer) {
            setWindLayer(null);
        }

        async function initializeWindLayer() {
            setIsLayersLoading(true);
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
                    numParticles: 4000,
                    color: [70, 70, 70, 255],
                    fadeOpacity: 0.92,
                    dropRate: 0.003,
                    dropRateBump: 0.01,
                    speedFactor: 20,
                    lineWidth: { type: 'exponential', value: 2.0, slope: 0.5, min: 1.0, max: 4.5 },
                    maxAge: 15,
                    paths: 25,
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
            } catch (error) {
                console.error('Error initializing wind layer:', error);
            } finally {
                setIsLayersLoading(false);
            }
        }
    }, [windLayer, showWindLayer]);

    const handleTileLoad = useCallback((tile) => {
        if (!tile?.data?.length) return;

        loadedTilesRef.current.add(tile.id);
        allFeaturesRef.current = [...allFeaturesRef.current, ...tile.data];

        if (!isInteracting) {
            collectVisibleFeatures();
        }
    }, [collectVisibleFeatures, isInteracting]);

    const featurePassesFilters = useCallback((feature) => {
        if (!feature?.properties) return false;

        const featureTime = new Date(feature.properties.t).getTime();
        const isInTimeRange =
            featureTime >= timeRange.start.getTime() &&
            featureTime <= timeRange.end.getTime();

        if (!isInTimeRange) return false;

        if (showAdvancedFilters) {
            const area = feature.properties.farea || 0;
            if (area < fireArea.min || area > fireArea.max) return false;

            const durationInDays = feature.properties.duration || 0;
            if (durationInDays < duration.min || durationInDays > duration.max) return false;

            const frp = feature.properties.meanfrp || 0;
            if (frp < meanFrp.min || frp > meanFrp.max) return false;

            if (region && feature.properties.region !== region) return false;

            if (isActive !== null && feature.properties.isactive !== isActive) return false;

            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const nameMatch =
                    feature.properties.primarykey &&
                    feature.properties.primarykey.toLowerCase().includes(searchLower);
                const idMatch =
                    feature.properties.fireid &&
                    feature.properties.fireid.toLowerCase().includes(searchLower);

                if (!nameMatch && !idMatch) return false;
            }
        }

        return true;
    }, filterDependencies);

    const zoomToFeature = useCallback((feature) => {
        if (!feature?.geometry) return;

        try {
            let coordinates = [];

            if (feature.geometry.type === 'Polygon') {
                coordinates = feature.geometry.coordinates[0];
            } else if (feature.geometry.type === 'MultiPolygon') {
                feature.geometry.coordinates.forEach(polygon => {
                    coordinates = [...coordinates, ...polygon[0]];
                });
            }

            if (coordinates.length === 0) return;

            const lons = coordinates.map(c => c[0]);
            const lats = coordinates.map(c => c[1]);
            const minLon = Math.min(...lons);
            const maxLon = Math.max(...lons);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);

            const padding = 40;
            const newViewport = new WebMercatorViewport(viewState)
                .fitBounds(
                    [[minLon, minLat], [maxLon, maxLat]],
                    { padding }
                );

            setViewState({
                ...viewState,
                longitude: newViewport.longitude,
                latitude: newViewport.latitude,
                zoom: newViewport.zoom
            });
        } catch (error) {
            console.error('Error zooming to feature:', error);
        }
    }, [viewState]);

    const handleClick = useCallback((info) => {
        const { object } = info;
        if (!object || !featurePassesFilters(object)) return;

        const fireId = getFireId(object);
        if (!fireId) {
            console.error("No fire ID found for the selected feature");
            return;
        }

        selectEvent(fireId);
        zoomToFeature(object);
        setViewMode('detail');
    }, [featurePassesFilters, zoomToFeature, selectEvent, setViewMode]);

    useEffect(() => {
        const newLayers = [];

        newLayers.push(createFirePerimetersLayer());

        if (firePerimeters) {
            newLayers.push(createSelectedPerimetersLayer());
        }

        if (windLayer && showWindLayer) {
            newLayers.push(windLayer);
        }

        setLayers(newLayers);

        if (!isInteracting) {
            collectVisibleFeatures();
        }

        function createFirePerimetersLayer() {
            return new MVTLayer({
                id: 'fire-perimeters-mvt',
                data: TILE_URL,
                getFillColor: (feature) => {
                    const passes = featurePassesFilters(feature);
                    return passes ? [255, 140, 0, 180] : [255, 140, 0, 0];
                },
                getLineColor: (feature) => {
                    const passes = featurePassesFilters(feature);
                    return passes ? [255, 69, 0, 255] : [255, 69, 0, 0];
                },
                lineWidthMinPixels: 1,
                pickable: true,
                opacity: layerOpacity / 100,
                autoHighlight: true,
                highlightColor: [255, 255, 255, 120],
                onClick: handleClick,
                updateTriggers: {
                    getFillColor: filterDependencies,
                    getLineColor: filterDependencies
                },
                onTileLoad: handleTileLoad
            });
        }

        function createSelectedPerimetersLayer() {
            const sortedPerimeters = Array.isArray(firePerimeters.features)
                ? [...firePerimeters.features].sort((a, b) => {
                    const timeA = new Date(a.properties.t).getTime();
                    const timeB = new Date(b.properties.t).getTime();
                    return timeB - timeA;
                })
                : firePerimeters;

            return new GeoJsonLayer({
                id: 'fire-perimeters',
                data: sortedPerimeters,
                filled: true,
                getFillColor: (feature) => {
                    return featurePassesFilters(feature) ?
                        [136, 140, 160, 255] :
                        [219, 86, 66, 255];
                },
                getLineColor: (feature) => {
                    return featurePassesFilters(feature) ?
                        [115, 120, 124, 255] :
                        [246, 184, 68, 255];
                },
                lineWidthMinPixels: 2,
                opacity: layerOpacity / 100,
                pickable: true,
                updateTriggers: {
                    getFillColor: filterDependencies,
                    getLineColor: filterDependencies
                }
            });
        }

    }, [
        windLayer,
        showWindLayer,
        firePerimeters,
        handleTileLoad,
        isInteracting,
        featurePassesFilters,
        collectVisibleFeatures,
        handleClick,
        layerOpacity,
        show3DMap,
        ...filterDependencies
    ]);

    useEffect(() => {
        if (show3DMap) {
            setViewState(prev => ({
                ...prev,
                pitch: 45,
                transitionDuration: 300,
            }));
        } else {
            setViewState(prev => ({
                ...prev,
                pitch: 0,
                transitionDuration: 300,
            }));
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
            }, INTERACTION_TIMEOUT);
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
            getCursor={({isHovering}) => isHovering ? 'pointer' : 'grab'}
        >
            <Map
                mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
                mapStyle={MAP_STYLE}
                projection="mercator"
                attributionControl={false}
                reuseMaps
            ></Map>
        </DeckGL>
    );
};

export default MapView;