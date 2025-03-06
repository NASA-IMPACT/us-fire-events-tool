import * as WeatherLayersClient from 'weatherlayers-gl/client';

const DEFAULT_ACCESS_TOKEN = import.meta.env.VITE_WEATHER_LAYERS_TOKEN as string;

export enum WeatherDataset {
  WIND_10M = 'gfs/wind_10m_above_ground',
  WIND_80M = 'gfs/wind_80m_above_ground',
  TEMPERATURE = 'gfs/temperature_2m_above_ground',
  PRECIPITATION = 'gfs/precipitation_rate_surface',
  RELATIVE_HUMIDITY = 'gfs/relative_humidity_2m_above_ground'
}

let weatherClient: WeatherLayersClient.Client | null = null;

export function initWeatherClient(accessToken = DEFAULT_ACCESS_TOKEN): WeatherLayersClient.Client {
  if (!weatherClient) {
    weatherClient = new WeatherLayersClient.Client({
      accessToken,
      datetimeInterpolate: true
    });
  }
  return weatherClient;
}

export async function getAvailableDatetimes(
  dataset: WeatherDataset,
  referenceDate: Date,
  hoursBeforeAfter: number = 24
): Promise<string[]> {
  const client = initWeatherClient();
  const datetimeRange = WeatherLayersClient.offsetDatetimeRange(
    referenceDate.toISOString(),
    -hoursBeforeAfter,
    hoursBeforeAfter
  );

  try {
    const { datetimes } = await client.loadDatasetSlice(dataset, datetimeRange);
    return datetimes;
  } catch (error) {
    console.error('Error fetching weather datetimes:', error);
    throw error;
  }
}

export async function loadWeatherData(
  dataset: WeatherDataset,
  datetime: string
) {
  const client = initWeatherClient();

  try {
    return await client.loadDatasetData(dataset, datetime);
  } catch (error) {
    console.error('Error loading weather data:', error);
    throw error;
  }
}

export async function loadWindData(datetime: string) {
  return loadWeatherData(WeatherDataset.WIND_10M, datetime);
}

export async function getClosestWeatherData(
  dataset: WeatherDataset,
  targetDate: Date,
  hoursRange: number = 12
) {
  try {
    const datetimes = await getAvailableDatetimes(dataset, targetDate, hoursRange);
    if (datetimes.length === 0) {
      throw new Error('No weather data available for the specified date range');
    }

    const targetTime = targetDate.getTime();
    let closestDatetime = datetimes[0];
    let minDiff = Math.abs(new Date(closestDatetime).getTime() - targetTime);

    for (let i = 1; i < datetimes.length; i++) {
      const diff = Math.abs(new Date(datetimes[i]).getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestDatetime = datetimes[i];
      }
    }

    return {
      datetime: closestDatetime,
      data: await loadWeatherData(dataset, closestDatetime)
    };
  } catch (error) {
    console.error('Error getting closest weather data:', error);
    throw error;
  }
}

export async function getWeatherAnimationData(
  dataset: WeatherDataset,
  startDate: Date,
  endDate: Date,
  frameCount: number = 10
) {
  const client = initWeatherClient();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const timeStep = (endTime - startTime) / (frameCount - 1);

  try {
    const frames = [];

    const datetimeRange = WeatherLayersClient.offsetDatetimeRange(
      startDate.toISOString(),
      0,
      Math.ceil((endTime - startTime) / (60 * 60 * 1000))
    );

    const { datetimes } = await client.loadDatasetSlice(dataset, datetimeRange);

    for (let i = 0; i < frameCount; i++) {
      const targetTime = startTime + (timeStep * i);
      const targetDate = new Date(targetTime);

      let closestDatetime = datetimes[0];
      let minDiff = Math.abs(new Date(closestDatetime).getTime() - targetTime);

      for (let j = 1; j < datetimes.length; j++) {
        const diff = Math.abs(new Date(datetimes[j]).getTime() - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestDatetime = datetimes[j];
        }
      }

      const data = await client.loadDatasetData(dataset, closestDatetime);
      frames.push({
        datetime: closestDatetime,
        data
      });
    }

    return frames;
  } catch (error) {
    console.error('Error getting weather animation data:', error);
    throw error;
  }
}

export async function checkWeatherAvailability(
  dataset: WeatherDataset,
  bbox: [number, number, number, number],
  targetDate: Date
): Promise<boolean> {
  try {
    const { data } = await getClosestWeatherData(dataset, targetDate);

    const [minLon, minLat, maxLon, maxLat] = bbox;
    const [dataMinLon, dataMinLat, dataMaxLon, dataMaxLat] = data.bounds;

    return (
      minLon >= dataMinLon &&
      minLat >= dataMinLat &&
      maxLon <= dataMaxLon &&
      maxLat <= dataMaxLat
    );
  } catch (error) {
    console.error('Error checking weather availability:', error);
    return false;
  }
}