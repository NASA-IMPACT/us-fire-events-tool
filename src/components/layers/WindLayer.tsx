import * as WeatherLayers from 'weatherlayers-gl';
import { ClipExtension } from '@deck.gl/extensions';
import { isMobile } from 'react-device-detect';

/**
 * Creates a wind particle layer
 *
 * @param {Object} options - Layer configuration options
 * @param {Date} options.timeMarker - Timestamp for fetching weather data
 * @param {number} options.particleCount - Number of particles to render
 * @param {number} options.speedFactor - Particle speed multiplier
 * @param {number} options.opacity - Layer opacity (0-100)
 * @return {Promise<ParticleLayer>} Configured particle layer
 */

export const createWindLayer = async ({
  timeMarker,
  particleCount = 2000,
  speedFactor = 10,
  opacity = 92,
}) => {
  try {
    const hr = timeMarker.getUTCHours();
    const cycleHour = Math.floor(hr / 6) * 6;
    const runHourStr = cycleHour.toString().padStart(2, '0');

    const runDate = new Date(
      Date.UTC(
        timeMarker.getUTCFullYear(),
        timeMarker.getUTCMonth(),
        timeMarker.getUTCDate(),
        cycleHour
      )
    );

    const runDateStr = runDate.toISOString().split('T')[0].replace(/-/g, '');

    const forecastHour = Math.round((timeMarker - runDate) / 3600000)
      .toString()
      .padStart(2, '0');

    const imageUrl = `https://titiler.xyz/cog/preview.png?rescale=-127,128&url=vrt:///vsicurl/https://noaa-hrrr-bdp-pds.s3.amazonaws.com/hrrr.${runDateStr}/conus/hrrr.t${runHourStr}z.wrfsfcf${forecastHour}.grib2?bands=10,11&format=png`;

    let image;

    try {
      image = await WeatherLayers.loadTextureData(imageUrl);
    } catch (err) {
      console.error('loadTextureData failed:', err);
    }

    return new WeatherLayers.ParticleLayer({
      id: 'wind-particles',
      image: image,
      imageType: 'VECTOR',
      imageUnscale: [-127, 128],
      bounds: [-134.1214, 21.1222, -60.8912, 52.6287],
      clipBounds: [-134.1214, 21.1222, -60.8912, 52.6287],
      extensions: [new ClipExtension()],
      numParticles: isMobile ? 500 : particleCount,
      color: [97, 173, 234, 255],
      fadeOpacity: opacity / 100,
      dropRate: 0.003,
      dropRateBump: 0.01,
      speedFactor: isMobile ? 5 : speedFactor,
      lineWidth: {
        type: 'exponential',
        value: 2.0,
        slope: 0.5,
        min: 1.0,
        max: 4.5,
      },
      maxAge: isMobile ? 8 : 15,
      paths: isMobile ? 10 : 25,
      iconAtlas: '',
      iconMapping: {},
      fadeIn: true,
      useWorkers: true,
      updateRate: isMobile ? 32 : 16,
      blendMode: 'screen',
      particleGradient: {
        0.0: [50, 50, 50, 0],
        0.1: [50, 50, 50, 255],
        0.4: [30, 30, 30, 255],
        0.7: [0, 0, 0, 255],
        1.0: [0, 0, 0, 0],
      },
      colorScale: {
        type: 'linear',
        domain: [0, 30],
        range: [
          [50, 50, 50, 50],
          [0, 0, 0],
        ],
      },
    });
  } catch (error) {
    console.error('Error initializing wind layer:', error);
    return null;
  }
};
