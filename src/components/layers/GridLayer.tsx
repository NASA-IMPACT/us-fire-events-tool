import * as WeatherLayers from 'weatherlayers-gl';
import { ClipExtension } from '@deck.gl/extensions';
import { USA_BBOX } from './config/constants';
import { _TerrainExtension as TerrainExtension } from '@deck.gl/extensions';

/**
 * Creates a grid wind layer
 *
 * @param {Object} options - Layer configuration options
 * @param {Date} options.timeMarker - End time for fetching weather data
 * @param {number} options.particleCount - Number of particles to render
 * @param {number} options.speedFactor - Particle speed multiplier
 * @param {number} options.opacity - Layer opacity (0-100)
 * @return {Promise<ParticleLayer>} Configured particle layer
 */
export const createGridLayer = async ({ timeMarker, opacity = 92 }) => {
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

    return new WeatherLayers.GridLayer({
      id: 'grid-particles',
      image,
      imageType: 'VECTOR',
      imageUnscale: [-127, 128],
      bounds: [-130, 20, -60, 55],
      density: -1,
      extensions: [new ClipExtension(), new TerrainExtension()],
      clipBounds: USA_BBOX,
      style: WeatherLayers.GridStyle.ARROW,
      iconBounds: [0, 30],
      iconSize: [8, 24],
      iconColor: [97, 173, 234, 255],
      opacity: opacity / 100,
    });
  } catch (error) {
    console.error('Error initializing wind layer:', error);
    return null;
  }
};
