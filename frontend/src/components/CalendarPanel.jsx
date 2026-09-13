import Panel from './Panel.jsx'
import CalendarRow from './CalendarRow.jsx'
import { usePolling } from '../lib/usePolling.js'
import { POLL_INTERVALS_MS } from '../lib/pollIntervals.js'
import { formatEventDate, formatTime } from '../lib/formatDate.js'
import { ownerLabel, ownerColor, ownerInitial } from '../lib/owners.js'

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
      <div className="panel-list calendar-list">
        {events.map((event, i) => (
          <CalendarRow
            key={`${event.owner}-${event.start}-${i}`}
            owner={ownerLabel(event.owner)}
            initial={ownerInitial(event.owner)}
            color={ownerColor(event.owner)}
            title={event.title}
            time={
              event.allDay
                ? formatEventDate(event.start)
                : `${formatEventDate(event.start)} · ${formatTime(event.start)}`
            }
          />
        ))}
      </div>
    </Panel>
  )
}

export default CalendarPanel
