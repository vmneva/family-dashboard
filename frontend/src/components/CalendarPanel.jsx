import Panel from './Panel.jsx'
import CalendarRow from './CalendarRow.jsx'
import SettingsIcon from './SettingsIcon.jsx'
import { usePolling } from '../lib/usePolling.js'
import { POLL_INTERVALS_MS } from '../lib/pollIntervals.js'
import { formatEventDate, formatTime } from '../lib/formatDate.js'

function CalendarPanel({ onOpenSettings }) {
  const { data, error, loading } = usePolling('/api/calendar', POLL_INTERVALS_MS.calendar)
  const events = data?.events ?? []

  return (
    <Panel
      id="panel-calendar"
      title="Kalenteri"
      headerRight={
        <button
          type="button"
          className="panel-settings-button"
          onClick={onOpenSettings}
          aria-label="Muokkaa kalentereita"
        >
          <SettingsIcon className="panel-settings-icon" />
        </button>
      }
      loading={loading}
      error={error}
      isEmpty={events.length === 0}
      emptyMessage="Ei tulevia tapahtumia"
      note={data?.errors?.length ? 'Osa kalentereista ei saatavilla' : null}
    >
      <div className="panel-list calendar-list">
        {events.map((event, i) => (
          <CalendarRow
            key={`${event.calendarId}-${event.start}-${i}`}
            owner={event.calendarName}
            initial={event.initial}
            color={event.color}
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
