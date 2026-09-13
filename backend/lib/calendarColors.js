// Colors auto-assigned to calendars by their position in config.calendars,
// so users can add/name calendars freely without also picking a color.
// Mirrors frontend/src/lib/calendarColors.js — kept in sync manually since
// the frontend and backend are separate npm projects.
const CALENDAR_COLORS = [
  "#c2568b",
  "#3f7fbf",
  "#2a9d8f",
  "#a9744f",
  "#8a5fbf",
  "#4b9b4b",
];

function calendarColorForIndex(index) {
  return CALENDAR_COLORS[index % CALENDAR_COLORS.length];
}

module.exports = { CALENDAR_COLORS, calendarColorForIndex };
