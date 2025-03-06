import { useEffect, useState, useRef } from 'react';
import { ClipExtension } from '@deck.gl/extensions';
import * as WeatherLayersClient from 'weatherlayers-gl/client';
import * as WeatherLayers from 'weatherlayers-gl';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/mapbox';
import { MVTLayer } from '@deck.gl/geo-layers';
import { FlyToInterpolator, WebMercatorViewport } from '@deck.gl/core';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapViewState } from '@deck.gl/core';
import { useEvents } from '../contexts/EventsContext';
import { useAppState } from '../contexts/AppStateContext';

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
    const { selectedEvent } = useEvents();
    const { showWindLayer, show3DMap, setMapBounds } = useAppState();

    const [layers, setLayers] = useState([]);
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    const [windLayer, setWindLayer] = useState(null);
    const [, setIsLayersLoading] = useState(false);
    const deckRef = useRef(null);

    const updateBounds = (viewState) => {
        const viewport = new WebMercatorViewport(viewState);
        const bounds = viewport.getBounds();
        setMapBounds(bounds);
    };

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

    useEffect(() => {
        const newLayers = [
            new MVTLayer({
                id: 'fire-perimeters-mvt',
                data: 'https://firenrt.delta-backend.com/collections/public.eis_fire_snapshot_perimeter_nrt/tiles/{z}/{x}/{y}',
                getFillColor: [255, 140, 0, 180],
                getLineColor: [255, 69, 0, 255],
                lineWidthMinPixels: 1,
                pickable: true,
                autoHighlight: true,
                highlightColor: [255, 255, 255, 120]
            })
        ];

        if (windLayer && showWindLayer) {
            newLayers.push(windLayer);
        }

        setLayers(newLayers);
    }, [windLayer, showWindLayer]);

    useEffect(() => {
        if (show3DMap) {
            setViewState(prev => ({ ...prev, pitch: 45, transitionDuration: 300 }));
        } else {
            setViewState(prev => ({ ...prev, pitch: 0, transitionDuration: 300 }));
        }
    }, [show3DMap]);

    useEffect(() => {
        if (selectedEvent) {
            const coordinates = selectedEvent.geometry.coordinates[0];
            let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

            coordinates.forEach(([lng, lat]) => {
                minLng = Math.min(minLng, lng);
                minLat = Math.min(minLat, lat);
                maxLng = Math.max(maxLng, lng);
                maxLat = Math.max(maxLat, lat);
            });

            const centerLng = (minLng + maxLng) / 2;
            const centerLat = (minLat + maxLat) / 2;
            const maxDelta = Math.max(Math.abs(maxLng - minLng), Math.abs(maxLat - minLat));
            const zoom = Math.floor(8 - Math.log2(maxDelta));

            setViewState({
                ...viewState,
                longitude: centerLng,
                latitude: centerLat,
                zoom: Math.min(Math.max(zoom, 3), 15),
                transitionDuration: 1000,
                transitionInterpolator: new FlyToInterpolator(),
                transitionEasing: t => t
            });
        }
    }, [selectedEvent]);

    return (
        <DeckGL
            ref={deckRef}
            viewState={viewState}
            onViewStateChange={({ viewState }) => {
                setViewState(viewState);
                updateBounds(viewState);
            }}
            layers={layers}
            controller={{ doubleClickZoom: false }}
            getTooltip={({ object }) => object && `${object.properties.fireid || 'Fire'} - Area: ${object.properties.farea} km²`}
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
