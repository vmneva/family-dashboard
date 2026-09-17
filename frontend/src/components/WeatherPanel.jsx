import Panel from "./Panel.jsx";
import WeatherIcon from "./WeatherIcon.jsx";
import { usePolling } from "../lib/usePolling.js";
import { POLL_INTERVALS_MS } from "../lib/pollIntervals.js";
import { getUvLevel } from "../lib/uv.js";

function WeatherPanel() {
  const { data, error, loading } = usePolling(
    "/api/weather",
    POLL_INTERVALS_MS.weather,
  );
  const current = data?.current;
  const uvLevel = getUvLevel(data?.uvIndexMaxToday);

  return (
    <Panel
      id="panel-weather"
      title="Sää"
      loading={loading}
      error={error}
      isEmpty={current?.tempC == null}
    >
      <div className="weather-body">
        <div className="weather-main">
          <div className="weather-temp">{Math.round(current?.tempC)}°C</div>
          <WeatherIcon code={current?.conditionCode} className="weather-icon" />
        </div>
        <div className="weather-condition">{current?.condition}</div>
        <div className="weather-chips">
          <span className="chip chip-outline">
            💨 Tuuli {Math.round(current?.windKph / 3.6)} m/s
          </span>
          {data?.precipProbabilityMaxToday != null && (
            <span className="chip chip-outline">
              🌧️ {Math.round(data.precipProbabilityMaxToday)} % sateen
              mahdollisuus
            </span>
          )}
          {uvLevel && (
            <span className={`chip uv-badge ${uvLevel.className}`}>
              ☀️ UV maksimi {data.uvIndexMaxToday}
            </span>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default WeatherPanel;
