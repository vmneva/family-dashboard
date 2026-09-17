import { usePolling } from "../lib/usePolling.js";
import { POLL_INTERVALS_MS } from "../lib/pollIntervals.js";
import { useClock } from "../lib/useClock.js";
import { formatWeekdayDate, formatTime } from "../lib/formatDate.js";

// Dashboard-wide clock/location, shown top-right above the panel grid.
// Reads locationName off /api/weather (the only endpoint that has it)
// rather than duplicating it into every panel's response shape.
function DashboardHeader() {
  const { data } = usePolling("/api/weather", POLL_INTERVALS_MS.weather);
  const now = useClock();

  return (
    <div id="dashboard-header">
      {data?.locationName && (
        <div className="dashboard-header-location">{data.locationName}</div>
      )}
      <div className="dashboard-header-time">{formatTime(now)}</div>
      <div className="dashboard-header-date">{formatWeekdayDate(now)}</div>
    </div>
  );
}

export default DashboardHeader;
