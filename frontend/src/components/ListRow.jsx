// Shared row layout for panels that render a list of upcoming things
// (calendar events, bus departures, waste collections): an optional
// color accent, a primary/secondary text block, and a right-aligned meta.
function ListRow({ primary, secondary, meta, accent }) {
  return (
    <div className="list-row" style={accent ? { '--row-accent': accent } : undefined}>
      <div className="list-row-text">
        <span className="list-row-primary">{primary}</span>
        {secondary && <span className="list-row-secondary">{secondary}</span>}
      </div>
      {meta && <span className="list-row-meta">{meta}</span>}
    </div>
  )
}

export default ListRow
