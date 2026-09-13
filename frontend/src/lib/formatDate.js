const weekdayDateFormatter = new Intl.DateTimeFormat("fi-FI", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const shortWeekdayDateFormatter = new Intl.DateTimeFormat("fi-FI", {
  weekday: "short",
  day: "numeric",
  month: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("fi-FI", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatWeekdayDate(date) {
  return weekdayDateFormatter.format(new Date(date));
}

export function formatShortWeekdayDate(date) {
  return shortWeekdayDateFormatter.format(new Date(date));
}

export function formatTime(date) {
  return timeFormatter.format(new Date(date)).replace(".", ":");
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Short, glanceable date label for the calendar panel: "tänään"/"huomenna"
// when applicable, otherwise "ke 16.9." — falls back to formatWeekdayDate's
// short variant so far-future events still read clearly.
export function formatEventDate(date) {
  const target = startOfDay(date);
  const diffDays = Math.round((target - startOfDay(new Date())) / 86400000);
  if (diffDays === 0) return "tänään";
  if (diffDays === 1) return "huomenna";
  return formatShortWeekdayDate(date);
}

export function formatRelativeDays(daysUntil) {
  if (daysUntil <= 0) return "tänään";
  if (daysUntil === 1) return "huomenna";
  return `${daysUntil} pv`;
}

export function formatMinutesUntil(minutes) {
  if (minutes <= 0) return "nyt";
  return `${minutes} min`;
}
