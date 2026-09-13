import Panel from './Panel.jsx'
import ListRow from './ListRow.jsx'
import { usePolling } from '../lib/usePolling.js'
import { POLL_INTERVALS_MS } from '../lib/pollIntervals.js'
import { formatWeekdayDate, formatRelativeDays } from '../lib/formatDate.js'
import { wasteTypeLabel } from '../lib/waste.js'

function WastePanel() {
  const { data, error, loading } = usePolling('/api/waste', POLL_INTERVALS_MS.waste)
  const collections = data?.collections ?? []

  return (
    <Panel
      id="panel-waste"
      title="Jäte"
      loading={loading}
      error={error}
      isEmpty={collections.length === 0}
      emptyMessage="Ei tulevia tyhjennyksiä"
    >
      <div className="panel-list">
        {collections.map((collection) => (
          <ListRow
            key={`${collection.type}-${collection.date}`}
            primary={wasteTypeLabel(collection.type)}
            meta={`${formatWeekdayDate(collection.date)} · ${formatRelativeDays(collection.daysUntil)}`}
          />
        ))}
      </div>
    </Panel>
  )
}

export default WastePanel
