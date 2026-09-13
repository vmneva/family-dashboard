import Panel from "./Panel.jsx";
import ListRow from "./ListRow.jsx";
import { usePolling } from "../lib/usePolling.js";
import { POLL_INTERVALS_MS } from "../lib/pollIntervals.js";
import {
  formatShortWeekdayDate,
  formatRelativeDays,
} from "../lib/formatDate.js";
import {
  wasteTypeLabel,
  wasteTypeColor,
  wasteUrgencyColor,
} from "../lib/waste.js";

function WastePanel() {
  const { data, error, loading } = usePolling(
    "/api/waste",
    POLL_INTERVALS_MS.waste,
  );
  const collections = data?.collections ?? [];

  return (
    <Panel
      id="panel-waste"
      title="Jätehuolto"
      loading={loading}
      error={error}
      isEmpty={collections.length === 0}
      emptyMessage="Ei tulevia tyhjennyksiä"
    >
      <div className="panel-list">
        {collections.map((collection) => (
          <ListRow
            key={`${collection.type}-${collection.date}`}
            chip={{
              label: wasteTypeLabel(collection.type),
              color: wasteTypeColor(collection.type),
            }}
            meta={
              <>
                <span
                  className="waste-meta-days"
                  style={{ color: wasteUrgencyColor(collection.daysUntil) }}
                >
                  {formatRelativeDays(collection.daysUntil)}
                </span>
                <span className="waste-meta-date">
                  {formatShortWeekdayDate(collection.date)}
                </span>
              </>
            }
          />
        ))}
      </div>
    </Panel>
  );
}

export default WastePanel;
