# AeroTemp — Advanced Weather Intelligence Dashboard

AeroTemp is a premium, weather analytics and forecast application designed to showcase advanced front-end engineering, keyless API integrations, responsive data visualization, and interactive historical comparisons.

![AeroTemp Dashboard Mockup](weather_dashboard_mockup.png)

## 🌟 Key Features

*   **Interactive Geocoding & Autocomplete**: Start typing any city name worldwide to receive real-time, matched suggestions powered by Open-Meteo's Geocoding service.
*   **Weather Time Machine (Historical Comparison)**: Select any calendar date back to **1940** to retrieve historical weather logs for the current location. The portal calculates and displays side-by-side comparative deltas (e.g. max/min temperatures, precipitation, wind speed) and indicates whether it was warmer or colder than today.
*   **Atmospheric & Environmental Analytics**:
    *   **Air Quality Index (AQI)**: A full breakdown of major atmospheric pollutants (PM2.5, PM10, NO₂, O₃) mapped against safety thresholds.
    *   **UV Index Tracker**: Peak daily UV readings paired with recommended sun safety measures.
    *   **Wind Compass**: A dynamically rotating CSS compass needle that indicates exact wind directions.
    *   **Daylight Progress Meter**: Computes and shows exact sunrise/sunset times and daylight duration.
*   **Dynamic Responsive Charts**: Integrated **Chart.js** tabs allowing users to analyze hourly trends for:
    *   *Temperature* (smooth bezier curve line chart with gradient fill)
    *   *Precipitation Probability* (percentage bar chart)
    *   *Wind Speed* (line chart)
*   **My Locations (Bookmarked Sidebar)**: Save and toggle between your favorite cities. Saved cities are persisted locally across sessions using `localStorage`.
*   **Dual System Unit Toggle**: Instantly switch the entire dashboard and charts between **Metric** (°C, km/h, mm) and **Imperial** (°F, mph, inches).
*   **Aesthetics-Driven Themes**: Includes custom vanilla CSS gradients and floating glow elements. The UI automatically transitions between themes (Clear Day, Clear Night, Cloudy, Rainy, Snowy, and Stormy) based on active weather reports.

---

## 🛠️ Technology Stack

*   **HTML**: For structure and layout.
*   **CSS**: For the visual design, modern look, and responsive layouts.
*   **JavaScript**: For search autocomplete, weather comparisons, and interactive features.
*   **Chart.js**: For rendering interactive weather trend charts.
*   **Lucide Icons**: For clean and modern weather icons.
*   **Open-Meteo API**: For fetching live weather data, air quality index, and historical records.
*   **Python**: To run a simple local web server that hosts the dashboard.

---

## 🚀 How to Run Locally

1. Open a terminal/command prompt in the `WeatherDashboard` directory.
2. Run the server using Python:
   ```bash
   python server.py
   ```
3. The server will start on port `8080` and **automatically open** the application in your default browser at:
   ```url
   http://localhost:8080/
   ```

### Stopping the Server
To stop the server, press `Ctrl + C` in your terminal.
