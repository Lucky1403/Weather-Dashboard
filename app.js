import { WeatherAPI } from './api.js';

// ==========================================================================
// Application State
// ==========================================================================
const state = {
  currentLocation: null,    // { name, country, admin1, latitude, longitude, timezone }
  weatherData: null,        // Full Open-Meteo forecast JSON
  airQualityData: null,     // Full Open-Meteo AQI JSON
  savedCities: [],          // Array of location objects
  isImperial: false,        // false = Metric (°C, km/h, mm), true = Imperial (°F, mph, in)
  activeChartTab: 'temp',   // 'temp' | 'precip' | 'wind'
  chartInstance: null,      // Chart.js instance
  historicalResult: null    // Historical data comparison cache
};

// WMO Weather Code Translation Table
const WEATHER_CODES = {
  0: { label: 'Clear Sky', theme: 'clear-day', icon: 'sun' },
  1: { label: 'Mainly Clear', theme: 'clear-day', icon: 'cloud-sun' },
  2: { label: 'Partly Cloudy', theme: 'cloudy', icon: 'cloud' },
  3: { label: 'Overcast', theme: 'cloudy', icon: 'cloud' },
  45: { label: 'Foggy', theme: 'cloudy', icon: 'cloud-fog' },
  48: { label: 'Depositing Rime Fog', theme: 'cloudy', icon: 'cloud-fog' },
  51: { label: 'Light Drizzle', theme: 'rainy', icon: 'cloud-drizzle' },
  53: { label: 'Moderate Drizzle', theme: 'rainy', icon: 'cloud-drizzle' },
  55: { label: 'Dense Drizzle', theme: 'rainy', icon: 'cloud-drizzle' },
  56: { label: 'Light Freezing Drizzle', theme: 'rainy', icon: 'cloud-snow' },
  57: { label: 'Dense Freezing Drizzle', theme: 'rainy', icon: 'cloud-snow' },
  61: { label: 'Slight Rain', theme: 'rainy', icon: 'cloud-rain' },
  63: { label: 'Moderate Rain', theme: 'rainy', icon: 'cloud-rain' },
  65: { label: 'Heavy Rain', theme: 'rainy', icon: 'cloud-rain' },
  66: { label: 'Light Freezing Rain', theme: 'rainy', icon: 'cloud-snow' },
  67: { label: 'Heavy Freezing Rain', theme: 'rainy', icon: 'cloud-snow' },
  71: { label: 'Slight Snowfall', theme: 'snowy', icon: 'snowflake' },
  73: { label: 'Moderate Snowfall', theme: 'snowy', icon: 'snowflake' },
  75: { label: 'Heavy Snowfall', theme: 'snowy', icon: 'snowflake' },
  77: { label: 'Snow Grains', theme: 'snowy', icon: 'snowflake' },
  80: { label: 'Slight Rain Showers', theme: 'rainy', icon: 'cloud-rain' },
  81: { label: 'Moderate Rain Showers', theme: 'rainy', icon: 'cloud-rain' },
  82: { label: 'Violent Rain Showers', theme: 'rainy', icon: 'cloud-lightning' },
  85: { label: 'Slight Snow Showers', theme: 'snowy', icon: 'snowflake' },
  86: { label: 'Heavy Snow Showers', theme: 'snowy', icon: 'snowflake' },
  95: { label: 'Thunderstorm', theme: 'stormy', icon: 'cloud-lightning' },
  96: { label: 'Thunderstorm with Hail', theme: 'stormy', icon: 'cloud-lightning' },
  99: { label: 'Heavy Thunderstorm with Hail', theme: 'stormy', icon: 'cloud-lightning' }
};

// SVG Icon Generator for Lucide icons
function getWeatherSVG(iconName, strokeColor = 'currentColor') {
  const icons = {
    'sun': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
    'cloud-sun': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-sun"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.9 10.1A5.5 5.5 0 0 0 9 16.5a1 1 0 0 0 .1 1.5 5 5 0 0 0 9.8-1.5A5.5 5.5 0 0 0 15.9 10.1Z"/><path d="M12 18H3a3 3 0 0 1 0-6h.05a5.5 5.5 0 0 1 10.2 0H14a3 3 0 0 1 3 3v1"/></svg>`,
    'cloud': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud"><path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.47 0-.89.09-1.3.27A6.49 6.49 0 0 0 2 13h0a5 5 0 0 0 5 5h10.5Z"/></svg>`,
    'cloud-fog': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-fog"><path d="M4 14.89A6 6 0 1 1 15.57 9H16a5 5 0 1 1 1 9.9"/><path d="M5 20h14"/><path d="M17 16H7"/></svg>`,
    'cloud-drizzle': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-drizzle"><path d="M4 14.89A6 6 0 1 1 15.57 9H16a5 5 0 1 1 1 9.9"/><path d="M8 19v2"/><path d="M12 21v2"/><path d="M16 19v2"/></svg>`,
    'cloud-rain': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-rain"><path d="M4 14.89A6 6 0 1 1 15.57 9H16a5 5 0 1 1 1 9.9"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`,
    'cloud-lightning': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-lightning"><path d="M6 16.3A5 5 0 1 1 10.2 6h.8a6 6 0 1 1 11 5.8 1 1 0 0 1-.8 1.2H16"/><path d="m13 14-3 5h4l-3 5"/></svg>`,
    'snowflake': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-snowflake"><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>`,
    'moon': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    'cloud-moon': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-moon"><path d="M10.18 17H3a3 3 0 0 1 0-6h.05a5.5 5.5 0 0 1 10.2 0H14a3 3 0 0 1 3 3v1"/><path d="M17 3a5 5 0 0 0 5 5 5 5 0 0 1-5-5Z"/><path d="M12 18H3a3 3 0 0 1 0-6h.05a5.5 5.5 0 0 1 10.2 0H14a3 3 0 0 1 3 3v1"/></svg>`,
    'navigation': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-navigation"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`
  };
  return icons[iconName] || icons['sun'];
}

// Translate UV index to descriptive badge text and class
function getUVCategory(uv) {
  if (uv <= 2) return { label: 'Low', class: 'badge-success' };
  if (uv <= 5) return { label: 'Moderate', class: 'badge-warning' };
  if (uv <= 7) return { label: 'High', class: 'badge-danger' };
  if (uv <= 10) return { label: 'Very High', class: 'badge-danger' };
  return { label: 'Extreme', class: 'badge-danger' };
}

// Translate AQI to descriptive badge text and class
// European AQI scale: 1-50 Good, 51-100 Fair, 101-150 Moderate, 151-200 Poor, 201+ Very Poor
function getAQICategory(aqi) {
  if (aqi <= 50) return { label: 'Good', class: 'badge-success' };
  if (aqi <= 100) return { label: 'Fair', class: 'badge-success' };
  if (aqi <= 150) return { label: 'Moderate', class: 'badge-warning' };
  if (aqi <= 200) return { label: 'Poor', class: 'badge-danger' };
  return { label: 'Very Poor', class: 'badge-danger' };
}

// Convert wind direction degrees to Compass Cardinals
function getWindDirectionCardinal(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 22.5) % 16;
  return directions[index];
}

// Temperature conversions
function formatTemp(tempC) {
  if (state.isImperial) {
    const tempF = (tempC * 9/5) + 32;
    return `${Math.round(tempF)}°F`;
  }
  return `${Math.round(tempC)}°C`;
}

// Wind speed conversion
function formatWind(speedKmh) {
  if (state.isImperial) {
    const speedMph = speedKmh * 0.621371;
    return `${Math.round(speedMph)} mph`;
  }
  return `${Math.round(speedKmh)} km/h`;
}

// Precipitation conversion
function formatPrecip(precipMm) {
  if (state.isImperial) {
    const precipIn = precipMm * 0.0393701;
    return `${precipIn.toFixed(2)} in`;
  }
  return `${precipMm.toFixed(1)} mm`;
}

// Format time from string or timestamp
function formatTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Format date to readable string
function formatDayName(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString([], { weekday: 'short' });
}

function formatDateFull(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

// ==========================================================================
// DOM Elements Setup
// ==========================================================================
const DOM = {
  searchInput: document.getElementById('search-input'),
  clearSearch: document.getElementById('clear-search'),
  searchSpinner: document.getElementById('search-spinner'),
  searchDropdown: document.getElementById('search-dropdown'),
  unitToggle: document.getElementById('unit-toggle'),
  savedCities: document.getElementById('saved-cities'),
  savedCount: document.getElementById('saved-count'),
  addCurrentCityBtn: document.getElementById('add-current-city'),
  
  // Dashboard Panels
  weatherDashboard: document.getElementById('weather-dashboard'),
  statusOverlay: document.getElementById('status-overlay'),
  welcomeView: document.getElementById('welcome-view'),
  loadingView: document.getElementById('loading-view'),
  errorView: document.getElementById('error-view'),
  errorMessage: document.getElementById('error-message'),
  errorRetryBtn: document.getElementById('error-retry-btn'),
  findMeBtn: document.getElementById('find-me-btn'),

  // Hero Card
  heroCity: document.getElementById('hero-city'),
  heroCountryRegion: document.getElementById('hero-country-region'),
  heroConditionPill: document.getElementById('hero-condition-pill'),
  heroTemp: document.getElementById('hero-temp'),
  heroFeelsLike: document.getElementById('hero-feels-like'),
  heroIconContainer: document.getElementById('hero-icon-container'),
  heroTempMin: document.getElementById('hero-temp-min'),
  heroTempMax: document.getElementById('hero-temp-max'),
  heroTime: document.getElementById('hero-time'),

  // Stats
  statHumidity: document.getElementById('stat-humidity'),
  statWind: document.getElementById('stat-wind'),
  statWindDir: document.getElementById('stat-wind-dir'),
  statUv: document.getElementById('stat-uv'),
  statUvBadge: document.getElementById('stat-uv-badge'),
  statAqi: document.getElementById('stat-aqi'),
  statAqiBadge: document.getElementById('stat-aqi-badge'),

  // Forecasts
  hourlyForecast: document.getElementById('hourly-forecast'),
  dailyForecast: document.getElementById('daily-forecast'),

  // Advanced Env Metrics
  envSunrise: document.getElementById('env-sunrise'),
  envSunset: document.getElementById('env-sunset'),
  envDaylight: document.getElementById('env-daylight'),
  polPm25: document.getElementById('pol-pm25'),
  polPm10: document.getElementById('pol-pm10'),
  polNo2: document.getElementById('pol-no2'),
  polO3: document.getElementById('pol-o3'),
  compassArrow: document.getElementById('compass-arrow'),
  envWindSpeed: document.getElementById('env-wind-speed'),
  envWindDirection: document.getElementById('env-wind-direction'),
  envPressure: document.getElementById('env-pressure'),

  // Time Machine
  historyDateInput: document.getElementById('history-date-input'),
  searchHistoryBtn: document.getElementById('search-history-btn'),
  tmStatus: document.getElementById('tm-status'),
  tmResults: document.getElementById('tm-results'),
  tmBanner: document.getElementById('tm-banner'),
  tmComparisonHeadline: document.getElementById('tm-comparison-headline'),
  tmComparisonSub: document.getElementById('tm-comparison-sub'),
  tmDisplayDate: document.getElementById('tm-display-date'),
  
  tmHistTemp: document.getElementById('tm-hist-temp'),
  tmHistIcon: document.getElementById('tm-hist-icon'),
  tmHistMax: document.getElementById('tm-hist-max'),
  tmHistMin: document.getElementById('tm-hist-min'),
  tmHistPrecip: document.getElementById('tm-hist-precip'),
  tmHistWind: document.getElementById('tm-hist-wind'),

  tmTodayTemp: document.getElementById('tm-today-temp'),
  tmTodayIcon: document.getElementById('tm-today-icon'),
  tmTodayMax: document.getElementById('tm-today-max'),
  tmTodayMin: document.getElementById('tm-today-min'),
  tmTodayPrecip: document.getElementById('tm-today-precip'),
  tmTodayWind: document.getElementById('tm-today-wind')
};

// ==========================================================================
// Initialization & Events
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Load saved locations from localStorage
  loadSavedCities();
  
  // Set maximum date for Time Machine to yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  DOM.historyDateInput.max = yesterday.toISOString().split('T')[0];
  
  // Register Event Listeners
  setupEventListeners();
  
  // Refresh Lucide Icons
  lucide.createIcons();
});

function setupEventListeners() {
  // Search box keyboard input (with debounce)
  let searchTimeout;
  DOM.searchInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (value.length > 0) {
      DOM.clearSearch.style.display = 'block';
    } else {
      DOM.clearSearch.style.display = 'none';
      DOM.searchDropdown.style.display = 'none';
    }
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      handleSearch(value);
    }, 400);
  });

  // Clear search button click
  DOM.clearSearch.addEventListener('click', () => {
    DOM.searchInput.value = '';
    DOM.clearSearch.style.display = 'none';
    DOM.searchDropdown.style.display = 'none';
    DOM.searchInput.focus();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!DOM.searchInput.contains(e.target) && !DOM.searchDropdown.contains(e.target)) {
      DOM.searchDropdown.style.display = 'none';
    }
  });

  // Metric/Imperial unit toggle
  DOM.unitToggle.addEventListener('change', (e) => {
    state.isImperial = e.target.checked;
    if (state.currentLocation && state.weatherData) {
      updateDashboardUI();
    }
  });

  // Add location to saved list
  DOM.addCurrentCityBtn.addEventListener('click', () => {
    toggleSaveCurrentCity();
  });

  // Time Machine date comparison search
  DOM.searchHistoryBtn.addEventListener('click', () => {
    handleTimeMachineSearch();
  });

  // Error retry button
  DOM.errorRetryBtn.addEventListener('click', () => {
    if (state.currentLocation) {
      loadLocationWeather(state.currentLocation);
    } else {
      showView('welcome');
    }
  });

  // Geolocate me button
  DOM.findMeBtn.addEventListener('click', () => {
    useGeolocation();
  });

  // Chart Tab Buttons
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      state.activeChartTab = e.target.dataset.chart;
      renderChart();
    });
  });
}

// ==========================================================================
// Search & Selection Handlers
// ==========================================================================
async function handleSearch(query) {
  if (query.length < 2) return;
  
  DOM.searchSpinner.style.display = 'block';
  const results = await WeatherAPI.searchLocations(query);
  DOM.searchSpinner.style.display = 'none';
  
  if (results.length === 0) {
    DOM.searchDropdown.innerHTML = '<div class="dropdown-item text-center">No locations found.</div>';
    DOM.searchDropdown.style.display = 'block';
    return;
  }
  
  DOM.searchDropdown.innerHTML = '';
  results.forEach(loc => {
    const item = document.createElement('div');
    item.className = 'dropdown-item';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'dropdown-city';
    nameSpan.textContent = loc.name;
    
    const detailsSpan = document.createElement('span');
    detailsSpan.className = 'dropdown-region';
    const parts = [loc.admin1, loc.country].filter(Boolean);
    detailsSpan.textContent = parts.join(', ');
    
    item.appendChild(nameSpan);
    item.appendChild(detailsSpan);
    
    item.addEventListener('click', () => {
      DOM.searchDropdown.style.display = 'none';
      DOM.searchInput.value = '';
      DOM.clearSearch.style.display = 'none';
      loadLocationWeather({
        name: loc.name,
        country: loc.country,
        admin1: loc.admin1,
        latitude: loc.latitude,
        longitude: loc.longitude,
        timezone: loc.timezone
      });
    });
    
    DOM.searchDropdown.appendChild(item);
  });
  
  DOM.searchDropdown.style.display = 'block';
}

async function useGeolocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }
  
  showView('loading');
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      // We reverse geocode or at least label as "Current Location"
      const loc = {
        name: 'My Location',
        country: 'GPS Coordinates',
        admin1: '',
        latitude: latitude,
        longitude: longitude,
        timezone: 'auto'
      };
      
      // Attempt to look up the actual city name using a quick coordinates call or just set it
      try {
        // Let's do a geocoding search for coordinates.
        // Geocoding API doesn't support reverse geocoding directly, but we can do a fallback or label it.
        // Open-Meteo geocoding search doesn't do reverse lookup easily, so "Current Location" is perfect.
        loadLocationWeather(loc);
      } catch (err) {
        loadLocationWeather(loc);
      }
    },
    (error) => {
      showView('error', `Geolocation error: ${error.message}. Please search for your city manually.`);
    }
  );
}

// ==========================================================================
// API Operations & Data Fetching
// ==========================================================================
async function loadLocationWeather(location) {
  state.currentLocation = location;
  showView('loading');
  
  // Clear any existing historical search results
  state.historicalResult = null;
  DOM.tmResults.style.display = 'none';
  DOM.historyDateInput.value = '';
  
  try {
    // Fetch forecast & air quality concurrently
    const [forecast, airQuality] = await Promise.all([
      WeatherAPI.getWeatherForecast(location.latitude, location.longitude, location.timezone),
      WeatherAPI.getAirQuality(location.latitude, location.longitude)
    ]);
    
    state.weatherData = forecast;
    state.airQualityData = airQuality;
    
    updateDashboardUI();
    showView('dashboard');
    updateSaveButtonState();
    
  } catch (error) {
    console.error(error);
    showView('error', `Failed to retrieve weather details for ${location.name}. Open-Meteo services may be offline.`);
  }
}

// ==========================================================================
// UI Rendering & Data Binding
// ==========================================================================
function updateDashboardUI() {
  const current = state.weatherData.current;
  const daily = state.weatherData.daily;
  const codeDetails = WEATHER_CODES[current.weather_code] || { label: 'Unspecified', theme: 'default', icon: 'sun' };

  // Set Theme
  updateTheme(codeDetails.theme, current.is_day);

  // Update Hero Card details
  DOM.heroCity.textContent = state.currentLocation.name;
  const regionParts = [state.currentLocation.admin1, state.currentLocation.country].filter(Boolean);
  DOM.heroCountryRegion.textContent = regionParts.join(', ');
  DOM.heroConditionPill.textContent = codeDetails.label;
  DOM.heroTemp.textContent = formatTemp(current.temperature_2m);
  DOM.heroFeelsLike.textContent = `Feels like ${formatTemp(current.apparent_temperature)}`;
  DOM.heroIconContainer.innerHTML = getWeatherSVG(codeDetails.icon, '#fff');
  
  DOM.heroTempMin.textContent = formatTemp(daily.temperature_2m_min[0]);
  DOM.heroTempMax.textContent = formatTemp(daily.temperature_2m_max[0]);
  DOM.heroTime.textContent = new Date(current.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Update Quick Stats Grid
  DOM.statHumidity.textContent = `${current.relative_humidity_2m}%`;
  DOM.statWind.textContent = formatWind(current.wind_speed_10m);
  DOM.statWindDir.textContent = getWindDirectionCardinal(current.wind_direction_10m);
  
  const todayUv = daily.uv_index_max[0];
  DOM.statUv.textContent = todayUv.toFixed(1);
  const uvCategory = getUVCategory(todayUv);
  DOM.statUvBadge.textContent = uvCategory.label;
  DOM.statUvBadge.className = `stat-badge ${uvCategory.class}`;

  if (state.airQualityData && state.airQualityData.current) {
    const aqi = state.airQualityData.current.us_aqi;
    DOM.statAqi.textContent = aqi;
    const aqiCategory = getAQICategory(aqi);
    DOM.statAqiBadge.textContent = aqiCategory.label;
    DOM.statAqiBadge.className = `stat-badge ${aqiCategory.class}`;
    
    // Pollutants breakdown
    const pol = state.airQualityData.current;
    DOM.polPm25.textContent = `${pol.pm2_5.toFixed(1)} µg/m³`;
    DOM.polPm10.textContent = `${pol.pm10.toFixed(1)} µg/m³`;
    DOM.polNo2.textContent = `${pol.nitrogen_dioxide.toFixed(1)} µg/m³`;
    DOM.polO3.textContent = `${pol.ozone.toFixed(1)} µg/m³`;
  } else {
    DOM.statAqi.textContent = 'N/A';
    DOM.statAqiBadge.textContent = 'Unknown';
    DOM.statAqiBadge.className = `stat-badge badge-warning`;
    DOM.polPm25.textContent = '--';
    DOM.polPm10.textContent = '--';
    DOM.polNo2.textContent = '--';
    DOM.polO3.textContent = '--';
  }

  // Sunrise/Sunset & Advanced Env
  DOM.envSunrise.textContent = formatTime(daily.sunrise[0]);
  DOM.envSunset.textContent = formatTime(daily.sunset[0]);
  
  const durationSec = daily.daylight_duration[0];
  const durHours = Math.floor(durationSec / 3600);
  const durMins = Math.round((durationSec % 3600) / 60);
  DOM.envDaylight.textContent = `${durHours}h ${durMins}m`;

  DOM.envWindSpeed.textContent = formatWind(current.wind_speed_10m);
  DOM.envWindDirection.textContent = `${current.wind_direction_10m}° (${getWindDirectionCardinal(current.wind_direction_10m)})`;
  DOM.envPressure.textContent = `${current.pressure_msl.toFixed(0)} hPa`;
  
  // Rotate compass arrow
  DOM.compassArrow.style.transform = `rotate(${current.wind_direction_10m}deg)`;

  // Render forecasts
  renderHourlyForecast();
  renderDailyForecast();

  // Render/Update Chart
  renderChart();

  // Refresh lucide icons inside generated DOMs
  lucide.createIcons();
}

function updateTheme(themeClass, isDay) {
  // Clear other theme classes
  document.body.className = '';
  
  // Determine if day or night theme overrides default sunny
  if (!isDay && themeClass === 'clear-day') {
    document.body.classList.add('theme-clear-night');
  } else {
    document.body.classList.add(`theme-${themeClass}`);
  }
}

// 24 Hour Scroll View
function renderHourlyForecast() {
  DOM.hourlyForecast.innerHTML = '';
  const hourly = state.weatherData.hourly;
  
  // Find current hour index
  const now = new Date();
  const currentHourString = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString().slice(0, 13);
  let startIndex = hourly.time.findIndex(t => t.startsWith(currentHourString));
  if (startIndex === -1) startIndex = 0;

  // Render next 24 hours
  for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
    const time = hourly.time[i];
    const temp = hourly.temperature_2m[i];
    const code = hourly.weather_code[i];
    const precipProb = hourly.precipitation_probability[i];
    const codeInfo = WEATHER_CODES[code] || { icon: 'sun' };

    const hourCard = document.createElement('div');
    hourCard.className = 'hourly-item';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'hourly-time';
    // Format to HH:MM
    const dateObj = new Date(time);
    timeSpan.textContent = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const iconDiv = document.createElement('div');
    iconDiv.className = 'hourly-icon';
    iconDiv.innerHTML = getWeatherSVG(codeInfo.icon);

    const tempSpan = document.createElement('span');
    tempSpan.className = 'hourly-temp';
    tempSpan.textContent = formatTemp(temp);

    const precipSpan = document.createElement('span');
    precipSpan.className = 'hourly-precip';
    precipSpan.textContent = precipProb > 0 ? `${precipProb}%` : '';

    hourCard.appendChild(timeSpan);
    hourCard.appendChild(iconDiv);
    hourCard.appendChild(tempSpan);
    hourCard.appendChild(precipSpan);

    DOM.hourlyForecast.appendChild(hourCard);
  }
}

// 7-Day Forecast Grid
function renderDailyForecast() {
  DOM.dailyForecast.innerHTML = '';
  const daily = state.weatherData.daily;

  for (let i = 0; i < daily.time.length; i++) {
    const time = daily.time[i];
    const minTemp = daily.temperature_2m_min[i];
    const maxTemp = daily.temperature_2m_max[i];
    const code = daily.weather_code[i];
    const precipSum = daily.precipitation_sum[i];
    const codeInfo = WEATHER_CODES[code] || { label: 'Unspecified', icon: 'sun' };

    const dailyRow = document.createElement('div');
    dailyRow.className = 'daily-item';

    // Day Name
    const daySpan = document.createElement('span');
    daySpan.className = 'daily-day';
    // If it's today, say "Today"
    if (i === 0) {
      daySpan.textContent = 'Today';
    } else {
      daySpan.textContent = formatDayName(time);
    }

    // Weather Icon + Condition group
    const iconGroup = document.createElement('div');
    iconGroup.className = 'daily-icon-group';
    
    const iconDiv = document.createElement('div');
    iconDiv.className = 'daily-icon';
    iconDiv.innerHTML = getWeatherSVG(codeInfo.icon);
    
    const statusSpan = document.createElement('span');
    statusSpan.className = 'daily-status';
    statusSpan.textContent = codeInfo.label;
    
    iconGroup.appendChild(iconDiv);
    iconGroup.appendChild(statusSpan);

    // Precipitation sum
    const precipSpan = document.createElement('span');
    precipSpan.className = 'daily-precip-sum';
    precipSpan.textContent = precipSum > 0 ? formatPrecip(precipSum) : '';

    // Temp Range
    const tempRange = document.createElement('div');
    tempRange.className = 'daily-temp-range';
    
    const minSpan = document.createElement('span');
    minSpan.className = 'daily-min';
    minSpan.textContent = formatTemp(minTemp);
    
    const maxSpan = document.createElement('span');
    maxSpan.className = 'daily-max';
    maxSpan.textContent = formatTemp(maxTemp);

    tempRange.appendChild(minSpan);
    tempRange.appendChild(maxSpan);

    dailyRow.appendChild(daySpan);
    dailyRow.appendChild(iconGroup);
    dailyRow.appendChild(precipSpan);
    dailyRow.appendChild(tempRange);

    DOM.dailyForecast.appendChild(dailyRow);
  }
}

// ==========================================================================
// Chart.js Data Visualization
// ==========================================================================
function renderChart() {
  if (!state.weatherData) return;

  const ctx = document.getElementById('weatherChart').getContext('2d');
  const hourly = state.weatherData.hourly;
  
  // Find current hour index
  const now = new Date();
  const currentHourString = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).toISOString().slice(0, 13);
  let startIndex = hourly.time.findIndex(t => t.startsWith(currentHourString));
  if (startIndex === -1) startIndex = 0;

  // Extract next 12 hourly data points for charting
  const count = 12;
  const times = hourly.time.slice(startIndex, startIndex + count).map(t => {
    return new Date(t).toLocaleTimeString([], { hour: 'numeric' });
  });

  let label = '';
  let data = [];
  let borderColor = '#3b82f6';
  let fillColor = 'rgba(59, 130, 246, 0.1)';
  let yAxisLabel = '';

  // Chart configuration based on active tab
  if (state.activeChartTab === 'temp') {
    label = 'Temperature';
    yAxisLabel = state.isImperial ? '°F' : '°C';
    data = hourly.temperature_2m.slice(startIndex, startIndex + count).map(temp => {
      return state.isImperial ? (temp * 9/5) + 32 : temp;
    });
    borderColor = '#f59e0b';
    fillColor = 'rgba(245, 158, 11, 0.1)';
  } else if (state.activeChartTab === 'precip') {
    label = 'Precipitation Probability';
    yAxisLabel = '%';
    data = hourly.precipitation_probability.slice(startIndex, startIndex + count);
    borderColor = '#06b6d4';
    fillColor = 'rgba(6, 182, 212, 0.1)';
  } else if (state.activeChartTab === 'wind') {
    label = 'Wind Speed';
    yAxisLabel = state.isImperial ? 'mph' : 'km/h';
    data = hourly.wind_speed_10m.slice(startIndex, startIndex + count).map(speed => {
      return state.isImperial ? speed * 0.621371 : speed;
    });
    borderColor = '#94a3b8';
    fillColor = 'rgba(148, 163, 184, 0.1)';
  }

  // Destroy previous chart instance to re-render fresh
  if (state.chartInstance) {
    state.chartInstance.destroy();
  }

  // Create new chart instance
  state.chartInstance = new Chart(ctx, {
    type: state.activeChartTab === 'precip' ? 'bar' : 'line',
    data: {
      labels: times,
      datasets: [{
        label: label,
        data: data,
        borderColor: borderColor,
        backgroundColor: fillColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        borderRadius: state.activeChartTab === 'precip' ? 4 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}${yAxisLabel}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
        }
      }
    }
  });
}
// ==========================================================================
// LocalStorage & Saved Cities List
// ==========================================================================
function loadSavedCities() {
  const data = localStorage.getItem('aero_temp_saved_cities_v2');
  if (data) {
    try {
      state.savedCities = JSON.parse(data);
    } catch (e) {
      state.savedCities = [];
    }
  } else {
    state.savedCities = [];
    saveCitiesToLocalStorage();
  }
  renderSavedCitiesList();
}

function saveCitiesToLocalStorage() {
  localStorage.setItem('aero_temp_saved_cities_v2', JSON.stringify(state.savedCities));
}

function renderSavedCitiesList() {
  DOM.savedCount.textContent = state.savedCities.length;
  DOM.savedCities.innerHTML = '';

  if (state.savedCities.length === 0) {
    DOM.savedCities.innerHTML = `
      <div class="empty-state">
        <i data-lucide="map-pin"></i>
        <p>No saved cities. Search and click "Save Location" to add cities here!</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  state.savedCities.forEach(loc => {
    const item = document.createElement('div');
    item.className = 'saved-city-item';
    if (state.currentLocation && state.currentLocation.latitude === loc.latitude && state.currentLocation.longitude === loc.longitude) {
      item.classList.add('active');
    }

    const info = document.createElement('div');
    info.className = 'saved-city-info';

    const name = document.createElement('span');
    name.className = 'saved-city-name';
    name.textContent = loc.name;

    const country = document.createElement('span');
    country.className = 'saved-city-country';
    const regionParts = [loc.admin1, loc.country].filter(Boolean);
    country.textContent = regionParts.join(', ');

    info.appendChild(name);
    info.appendChild(country);

    // Weather forecast details inside card (Static values initially, but can fetch if requested)
    const tempGroup = document.createElement('div');
    tempGroup.className = 'saved-city-temp-group';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'saved-city-delete';
    deleteBtn.innerHTML = `<i data-lucide="trash-2"></i>`;
    deleteBtn.title = "Remove location";
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevents loading city
      removeSavedCity(loc);
    });

    tempGroup.appendChild(deleteBtn);
    item.appendChild(info);
    item.appendChild(tempGroup);

    // Click on saved city item to load its forecast
    item.addEventListener('click', () => {
      loadLocationWeather(loc);
    });

    DOM.savedCities.appendChild(item);
  });

  lucide.createIcons();
}

function toggleSaveCurrentCity() {
  if (!state.currentLocation) return;
  const locIndex = state.savedCities.findIndex(c => c.latitude === state.currentLocation.latitude && c.longitude === state.currentLocation.longitude);
  
  if (locIndex === -1) {
    // Add to list
    state.savedCities.push(state.currentLocation);
  } else {
    // Remove from list
    state.savedCities.splice(locIndex, 1);
  }

  saveCitiesToLocalStorage();
  renderSavedCitiesList();
  updateSaveButtonState();
}

function removeSavedCity(loc) {
  state.savedCities = state.savedCities.filter(c => c.latitude !== loc.latitude || c.longitude !== loc.longitude);
  saveCitiesToLocalStorage();
  renderSavedCitiesList();
  updateSaveButtonState();
}

function updateSaveButtonState() {
  if (!state.currentLocation) return;
  const isSaved = state.savedCities.some(c => c.latitude === state.currentLocation.latitude && c.longitude === state.currentLocation.longitude);
  
  if (isSaved) {
    DOM.addCurrentCityBtn.className = 'btn btn-primary';
    DOM.addCurrentCityBtn.innerHTML = `<i data-lucide="bookmark-check"></i> Location Saved`;
  } else {
    DOM.addCurrentCityBtn.className = 'btn btn-secondary';
    DOM.addCurrentCityBtn.innerHTML = `<i data-lucide="bookmark-plus"></i> Save Location`;
  }
  lucide.createIcons();
}

// ==========================================================================
// Weather Time Machine (Historical Analysis)
// ==========================================================================
async function handleTimeMachineSearch() {
  if (!state.currentLocation || !DOM.historyDateInput.value) {
    alert("Please select a date to compare.");
    return;
  }

  const selectedDate = DOM.historyDateInput.value;
  DOM.tmStatus.style.display = 'flex';
  DOM.tmResults.style.display = 'none';

  try {
    const historicalData = await WeatherAPI.getHistoricalWeather(
      state.currentLocation.latitude,
      state.currentLocation.longitude,
      selectedDate
    );

    if (!historicalData || !historicalData.daily) {
      throw new Error('No historical data found');
    }

    state.historicalResult = historicalData.daily;
    renderTimeMachineResults(selectedDate);
    
  } catch (error) {
    console.error(error);
    alert("Unable to fetch historical records for this date. Some coordinates do not contain historical entries prior to 1940.");
    DOM.tmStatus.style.display = 'none';
  }
}

function renderTimeMachineResults(selectedDate) {
  DOM.tmStatus.style.display = 'none';
  DOM.tmResults.style.display = 'flex';

  const hist = state.historicalResult;
  const today = state.weatherData.daily;

  // Historical Day Weather Metrics
  const histMax = hist.temperature_2m_max[0];
  const histMin = hist.temperature_2m_min[0];
  const histPrecip = hist.precipitation_sum[0];
  const histWind = hist.wind_speed_10m_max[0];
  const histCode = hist.weather_code[0];
  const histCodeInfo = WEATHER_CODES[histCode] || { label: 'Unspecified', icon: 'sun' };

  // Calculate average temps for today vs historical
  const histAvg = (histMax + histMin) / 2;
  
  const todayMax = today.temperature_2m_max[0];
  const todayMin = today.temperature_2m_min[0];
  const todayAvg = (todayMax + todayMin) / 2;

  // Temperature Difference
  const tempDiff = Math.abs(todayAvg - histAvg);
  const isWarmer = histAvg > todayAvg;

  // Format Display Labels
  DOM.tmDisplayDate.textContent = formatDateFull(selectedDate);
  
  DOM.tmHistTemp.textContent = formatTemp(histAvg);
  DOM.tmHistIcon.innerHTML = getWeatherSVG(histCodeInfo.icon);
  DOM.tmHistMax.textContent = formatTemp(histMax);
  DOM.tmHistMin.textContent = formatTemp(histMin);
  DOM.tmHistPrecip.textContent = formatPrecip(histPrecip);
  DOM.tmHistWind.textContent = formatWind(histWind);

  DOM.tmTodayTemp.textContent = formatTemp(todayAvg);
  
  // Today's code details
  const todayCode = state.weatherData.current.weather_code;
  const todayCodeInfo = WEATHER_CODES[todayCode] || { icon: 'sun' };
  DOM.tmTodayIcon.innerHTML = getWeatherSVG(todayCodeInfo.icon);
  DOM.tmTodayMax.textContent = formatTemp(todayMax);
  DOM.tmTodayMin.textContent = formatTemp(todayMin);
  DOM.tmTodayPrecip.textContent = formatPrecip(today.precipitation_sum[0]);
  DOM.tmTodayWind.textContent = formatWind(today.wind_speed_10m_max[0]);

  // Set Banner Headline
  const diffStr = state.isImperial 
    ? `${Math.round(tempDiff * 9/5)}°F` 
    : `${tempDiff.toFixed(1)}°C`;
    
  if (tempDiff < 0.5) {
    DOM.tmComparisonHeadline.textContent = `It was roughly the same temperature on this day in history`;
    DOM.tmBanner.className = 'tm-comparison-banner';
    DOM.tmComparisonSub.textContent = `Both days averaged around ${formatTemp(todayAvg)}.`;
  } else if (isWarmer) {
    DOM.tmComparisonHeadline.textContent = `It was ${diffStr} warmer on this day in history`;
    DOM.tmBanner.className = 'tm-comparison-banner warmer';
    DOM.tmComparisonSub.innerHTML = `Compared to today's average temperature of <span class="today-ref-temp">${formatTemp(todayAvg)}</span>.`;
  } else {
    DOM.tmComparisonHeadline.textContent = `It was ${diffStr} colder on this day in history`;
    DOM.tmBanner.className = 'tm-comparison-banner colder';
    DOM.tmComparisonSub.innerHTML = `Compared to today's average temperature of <span class="today-ref-temp">${formatTemp(todayAvg)}</span>.`;
  }

  lucide.createIcons();
}

// ==========================================================================
// Views Manager
// ==========================================================================
function showView(viewName, message = '') {
  if (viewName === 'dashboard') {
    DOM.weatherDashboard.style.display = 'flex';
    DOM.statusOverlay.style.display = 'none';
  } else {
    DOM.weatherDashboard.style.display = 'none';
    DOM.statusOverlay.style.display = 'flex';
    
    DOM.welcomeView.style.display = viewName === 'welcome' ? 'flex' : 'none';
    DOM.loadingView.style.display = viewName === 'loading' ? 'flex' : 'none';
    DOM.errorView.style.display = viewName === 'error' ? 'flex' : 'none';
    
    if (viewName === 'error' && message) {
      DOM.errorMessage.textContent = message;
    }
  }
}
