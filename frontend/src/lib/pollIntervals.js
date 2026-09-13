// How often each panel refetches, matched to how often its data actually
// changes (mirrors the backend cache TTLs in backend/routes/*).
export const POLL_INTERVALS_MS = {
  weather: 15 * 60 * 1000,
  buses: 60 * 1000,
  calendar: 7 * 60 * 1000,
  waste: 60 * 60 * 1000,
}
