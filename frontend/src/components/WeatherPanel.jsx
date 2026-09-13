import Panel from './Panel.jsx'
import { usePolling } from '../lib/usePolling.js'
import { POLL_INTERVALS_MS } from '../lib/pollIntervals.js'
import { getUvLevel } from '../lib/uv.js'

function WeatherPanel() {
  const { data, error, loading } = usePolling('/api/weather', POLL_INTERVALS_MS.weather)
  const current = data?.current
  const uvLevel = getUvLevel(data?.uvIndexNow)

  return (
    <Panel
      id="panel-weather"
      title="Sää"
      loading={loading}
      error={error}
      isEmpty={current?.tempC == null}
    >
      <div className="weather-body">
        <div className="weather-temp">{Math.round(current?.tempC)}°C</div>
        <div className="weather-condition">{current?.condition}</div>
        <div className="weather-wind">Tuuli {Math.round(current?.windKph)} km/h</div>
        {uvLevel && (
          <div className={`uv-badge ${uvLevel.className}`}>
            UV {data.uvIndexNow} · {uvLevel.label}
          </div>
        )}
      </div>
    </Panel>
  )
}

export default WeatherPanel
