const weekdayDateFormatter = new Intl.DateTimeFormat('fi-FI', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

const timeFormatter = new Intl.DateTimeFormat('fi-FI', {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatWeekdayDate(date) {
  return weekdayDateFormatter.format(new Date(date))
}

export function formatTime(date) {
  return timeFormatter.format(new Date(date))
}

export function formatRelativeDays(daysUntil) {
  if (daysUntil <= 0) return 'tänään'
  if (daysUntil === 1) return 'huomenna'
  return `${daysUntil} päivän päästä`
}

export function formatMinutesUntil(minutes) {
  if (minutes <= 0) return 'nyt'
  return `${minutes} min`
}
