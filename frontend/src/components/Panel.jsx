// Shared dashboard panel chrome: title + one of loading/error/empty/content.
// Every panel (calendar/weather/bus/waste) renders through this so the
// "ei saatavilla" / loading states only need to be implemented once.
function Panel({ id, title, loading, error, isEmpty, emptyMessage = 'Ei tietoja', note, children }) {
  return (
    <section className="panel" id={id}>
      <h2 className="panel-title">{title}</h2>
      <div className="panel-body">
        {error ? (
          <p className="panel-message panel-message-error">Ei saatavilla</p>
        ) : loading ? (
          <p className="panel-message">Ladataan…</p>
        ) : isEmpty ? (
          <p className="panel-message">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
      {!loading && !error && note && <p className="panel-note">{note}</p>}
    </section>
  )
}

export default Panel
