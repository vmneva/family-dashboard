// Shared row layout for panels that render a list of upcoming things
// (calendar events, bus departures, waste collections): an optional
// colored chip, a primary/secondary text block, and a right-aligned meta.
function ListRow({ primary, secondary, meta, chip }) {
  return (
    <div className="list-row">
      {chip && (
        <span
          className={chip.className ? `chip ${chip.className}` : 'chip'}
          style={{ background: chip.color }}
        >
          {chip.label}
        </span>
      )}
      <div className="list-row-text">
        <span className="list-row-primary">{primary}</span>
        {secondary && <span className="list-row-secondary">{secondary}</span>}
      </div>
      {meta && <span className="list-row-meta">{meta}</span>}
    </div>
  )
}

export default ListRow
