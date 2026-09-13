function Settings({ onBack }) {
  return (
    <div id="settings-page">
      <h1>Asetukset</h1>
      <button type="button" onClick={onBack}>
        Takaisin
      </button>
    </div>
  )
}

export default Settings
