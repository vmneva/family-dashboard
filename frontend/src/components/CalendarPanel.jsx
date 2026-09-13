import Panel from './Panel.jsx'
import ListRow from './ListRow.jsx'
import { usePolling } from '../lib/usePolling.js'
import { POLL_INTERVALS_MS } from '../lib/pollIntervals.js'
import { formatWeekdayDate, formatTime } from '../lib/formatDate.js'
import { ownerLabel, ownerColor } from '../lib/owners.js'

function CalendarPanel() {
  const { data, error, loading } = usePolling('/api/calendar', POLL_INTERVALS_MS.calendar)
  const events = data?.events ?? []

  return (
    <Panel
      id="panel-calendar"
      title="Kalenteri"
      loading={loading}
      error={error}
      isEmpty={events.length === 0}
      emptyMessage="Ei tulevia tapahtumia"
      note={data?.errors?.length ? 'Osa kalentereista ei saatavilla' : null}
    >
      <div className="panel-list">
        {events.map((event, i) => (
          <ListRow
            key={`${event.owner}-${event.start}-${i}`}
            accent={ownerColor(event.owner)}
            primary={event.title}
            secondary={ownerLabel(event.owner)}
            meta={
              event.allDay
                ? formatWeekdayDate(event.start)
                : `${formatWeekdayDate(event.start)} ${formatTime(event.start)}`
            }
          />
        ))}
      </div>
    </Panel>
  )
}

export default CalendarPanel
