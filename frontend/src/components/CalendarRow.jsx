// Calendar-specific row: a colored owner-initial avatar, a small date/time
// line, and the event title given its own full-width line below — unlike
// the generic ListRow, the title needs room to stay readable and not clip.
function CalendarRow({ time, title, owner, initial, color }) {
  return (
    <div className="calendar-row">
      <span className="calendar-avatar" style={{ background: color }} aria-label={owner}>
        {initial}
      </span>
      <div className="calendar-row-body">
        <span className="calendar-row-time">{time}</span>
        <span className="calendar-row-title">{title}</span>
      </div>
    </div>
  )
}

export default CalendarRow
