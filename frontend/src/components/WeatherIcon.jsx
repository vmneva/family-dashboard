// Maps the backend's weather condition code (see routes/weather.js) to an
// emoji so conditions read clearly at a glance from across the room.
const ICON_EMOJI = {
  clear: "☀️",
  "partly-cloudy": "⛅",
  cloudy: "☁️",
  fog: "🌫️",
  drizzle: "🌦️",
  rain: "🌧️",
  snow: "❄️",
  thunderstorm: "⛈️",
  unknown: "❓",
};

function WeatherIcon({ code, className }) {
  const emoji = ICON_EMOJI[code] || ICON_EMOJI.unknown;

  return (
    <span className={className} role="img" aria-hidden="true">
      {emoji}
    </span>
  );
}

export default WeatherIcon;
