// Preview-only: colors auto-assigned to calendars by their position in the
// settings list, so the swatch shown while editing matches what /api/calendar
// will actually attach to each event. Mirrors backend/lib/calendarColors.js —
// kept in sync manually since the frontend and backend are separate npm projects.
const CALENDAR_COLORS = [
  '#c2568b',
  '#3f7fbf',
  '#2a9d8f',
  '#a9744f',
  '#8a5fbf',
  '#4b9b4b',
]

export function calendarColorForIndex(index) {
  return CALENDAR_COLORS[index % CALENDAR_COLORS.length]
}
