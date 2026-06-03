/**
 * API Wrapper for Open-Meteo Services
 * Handles Geocoding, Forecast, Air Quality, and Historical weather lookups.
 */

export class WeatherAPI {
  static BASE_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  static BASE_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
  static BASE_AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
  static BASE_HISTORICAL_URL = 'https://archive-api.open-meteo.com/v1/archive';

  /**
   * Search for locations matching a query string
   * @param {string} query - The search query (e.g., 'New York')
   * @returns {Promise<Array>} List of matching locations
   */
  static async searchLocations(query) {
    if (!query || query.trim().length < 2) return [];
    try {
      const url = `${this.BASE_GEOCODING_URL}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Geocoding search failed');
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error in searchLocations:', error);
      return [];
    }
  }

  /**
   * Get weather forecast (current, hourly, daily) for a specific location
   * @param {number} latitude 
   * @param {number} longitude 
   * @param {string} timezone (e.g. 'auto' or a specific timezone name)
   * @returns {Promise<Object>} Weather data
   */
  static async getWeatherForecast(latitude, longitude, timezone = 'auto') {
    try {
      const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        timezone: timezone,
        current: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'is_day',
          'precipitation',
          'weather_code',
          'cloud_cover',
          'pressure_msl',
          'wind_speed_10m',
          'wind_direction_10m'
        ].join(','),
        hourly: [
          'temperature_2m',
          'relative_humidity_2m',
          'apparent_temperature',
          'precipitation_probability',
          'precipitation',
          'weather_code',
          'pressure_msl',
          'wind_speed_10m',
          'wind_direction_10m',
          'uv_index'
        ].join(','),
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'apparent_temperature_max',
          'apparent_temperature_min',
          'sunrise',
          'sunset',
          'daylight_duration',
          'uv_index_max',
          'precipitation_sum',
          'wind_speed_10m_max'
        ].join(','),
        forecast_days: 7
      });

      const url = `${this.BASE_FORECAST_URL}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Forecast fetch failed');
      return await response.json();
    } catch (error) {
      console.error('Error in getWeatherForecast:', error);
      throw error;
    }
  }

  /**
   * Get current air quality metrics for a specific location
   * @param {number} latitude 
   * @param {number} longitude 
   * @returns {Promise<Object>} Air Quality data
   */
  static async getAirQuality(latitude, longitude) {
    try {
      const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        current: [
          'european_aqi',
          'us_aqi',
          'pm2_5',
          'pm10',
          'nitrogen_dioxide',
          'sulphur_dioxide',
          'ozone',
          'carbon_monoxide'
        ].join(','),
        timezone: 'auto'
      });

      const url = `${this.BASE_AIR_QUALITY_URL}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Air quality fetch failed');
      return await response.json();
    } catch (error) {
      console.error('Error in getAirQuality:', error);
      return null;
    }
  }

  /**
   * Get historical weather for a specific location on a specific date
   * @param {number} latitude 
   * @param {number} longitude 
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Promise<Object>} Historical weather data
   */
  static async getHistoricalWeather(latitude, longitude, date) {
    try {
      const params = new URLSearchParams({
        latitude: latitude,
        longitude: longitude,
        start_date: date,
        end_date: date,
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'apparent_temperature_max',
          'apparent_temperature_min',
          'precipitation_sum',
          'wind_speed_10m_max'
        ].join(','),
        timezone: 'auto'
      });

      const url = `${this.BASE_HISTORICAL_URL}?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Historical weather fetch failed');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getHistoricalWeather:', error);
      throw error;
    }
  }
}
