import CalendarPanel from '../components/CalendarPanel.jsx'
import WeatherPanel from '../components/WeatherPanel.jsx'
import BusPanel from '../components/BusPanel.jsx'
import WastePanel from '../components/WastePanel.jsx'

function Dashboard({ onOpenSettings }) {
  return (
    <div id="dashboard-grid">
      <CalendarPanel />
      <WeatherPanel />
      <BusPanel />
      <WastePanel />
      <button type="button" id="settings-button" onClick={onOpenSettings}>
        Asetukset
      </button>
    </div>
  )
}

export default Dashboard
