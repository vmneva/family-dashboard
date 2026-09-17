import CalendarPanel from '../components/CalendarPanel.jsx'
import WeatherPanel from '../components/WeatherPanel.jsx'
import BusPanel from '../components/BusPanel.jsx'
import WastePanel from '../components/WastePanel.jsx'
import DashboardHeader from '../components/DashboardHeader.jsx'

function Dashboard({ onOpenSettings }) {
  return (
    <div id="dashboard-grid">
      <DashboardHeader />
      <CalendarPanel onOpenSettings={onOpenSettings} />
      <WeatherPanel />
      <BusPanel />
      <WastePanel onOpenSettings={onOpenSettings} />
    </div>
  )
}

export default Dashboard
