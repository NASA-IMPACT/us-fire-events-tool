import * as WeatherLayers from 'weatherlayers-gl';
import { ClipExtension } from '@deck.gl/extensions';
import { USA_BBOX } from './config/constants';
import { getClosestWeatherData, WeatherDataset } from '../../api/weather';

/**
 * Creates a wind particle layer
 *
 * @param {Object} options - Layer configuration options
 * @param {Date} options.timeRangeEnd - End time for fetching weather data
 * @param {number} options.particleCount - Number of particles to render
 * @param {number} options.speedFactor - Particle speed multiplier
 * @param {number} options.opacity - Layer opacity (0-100)
 * @return {Promise<ParticleLayer>} Configured particle layer
 */
export const createWindLayer = async ({
  timeRangeEnd,
  particleCount = 4000,
  speedFactor = 20,
  opacity = 92
}) => {
  try {
    const { data } = await getClosestWeatherData(
      WeatherDataset.WIND_10M,
      timeRangeEnd
    );

    return new WeatherLayers.ParticleLayer({
      id: 'wind-particles',
      image: data.image,
      imageType: 'VECTOR',
      imageUnscale: data.imageUnscale,
      bounds: data.bounds,
      extensions: [new ClipExtension()],
      clipBounds: USA_BBOX,
      numParticles: particleCount,
      color: [70, 70, 70, 255],
      fadeOpacity: opacity / 100,
      dropRate: 0.003,
      dropRateBump: 0.01,
      speedFactor,
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
  } catch (error) {
    console.error('Error initializing wind layer:', error);
    return null;
  }
};