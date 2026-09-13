import Panel from './Panel.jsx'
import ListRow from './ListRow.jsx'
import { usePolling } from '../lib/usePolling.js'
import { POLL_INTERVALS_MS } from '../lib/pollIntervals.js'
import { formatTime, formatMinutesUntil } from '../lib/formatDate.js'

function BusPanel() {
  const { data, error, loading } = usePolling('/api/buses', POLL_INTERVALS_MS.buses)
  const departures = data ?? []

  return (
    <Panel
      id="panel-bus"
      title="Bussit"
      loading={loading}
      error={error}
      isEmpty={departures.length === 0}
      emptyMessage="Ei tulevia lähtöjä"
    >
      <div className="panel-list">
        {departures.map((departure, i) => (
          <ListRow
            key={`${departure.route}-${departure.departureTime}-${i}`}
            primary={departure.route}
            secondary={departure.destination}
            meta={`${formatTime(departure.departureTime)} · ${formatMinutesUntil(departure.minutesUntil)}`}
          />
        ))}
      </div>
    </Panel>
  )
}

export default BusPanel
