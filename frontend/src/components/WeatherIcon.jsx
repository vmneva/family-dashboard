// Maps the backend's weather condition code (see routes/weather.js) to a
// small inline icon so we don't need an icon-font/library dependency.
const ICON_PATHS = {
  clear: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </>
  ),
  "partly-cloudy": (
    <>
      <path d="M9 8.5a3.5 3.5 0 1 1 3.9 3.48" />
      <path d="M8.5 20h8a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.4 11.1 3.5 3.5 0 0 0 8.5 20Z" />
    </>
  ),
  cloudy: (
    <path d="M7 19h9.5a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.65 9.53 4 4 0 0 0 7 19Z" />
  ),
  fog: (
    <>
      <path d="M7 14h9.5a3.5 3.5 0 0 0 .3-6.98A5 5 0 0 0 7.4 8.9" />
      <path d="M4 17h16M6 20h12" />
    </>
  ),
  drizzle: (
    <>
      <path d="M7 12h9.5a3.5 3.5 0 0 0 .3-6.98A5 5 0 0 0 7.4 6.9 4 4 0 0 0 6.5 12Z" />
      <path d="M8 17v2M12 17v2M16 17v2" />
    </>
  ),
  rain: (
    <>
      <path d="M7 12h9.5a3.5 3.5 0 0 0 .3-6.98A5 5 0 0 0 7.4 6.9 4 4 0 0 0 6.5 12Z" />
      <path d="M8 16l-1 3M12 16l-1 3M16 16l-1 3" />
    </>
  ),
  snow: (
    <>
      <path d="M7 12h9.5a3.5 3.5 0 0 0 .3-6.98A5 5 0 0 0 7.4 6.9 4 4 0 0 0 6.5 12Z" />
      <path d="M8 17v3M6.6 18.5h2.8M12 17v3M10.6 18.5h2.8M16 17v3M14.6 18.5h2.8" />
    </>
  ),
  thunderstorm: (
    <>
      <path d="M7 11h9.5a3.5 3.5 0 0 0 .3-6.98A5 5 0 0 0 7.4 5.9 4 4 0 0 0 6.5 11Z" />
      <path d="M13 13l-3 4h3l-2 4" />
    </>
  ),
  unknown: (
    <path d="M7 19h9.5a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.65 9.53 4 4 0 0 0 7 19Z" />
  ),
};

function WeatherIcon({ code, className }) {
  const content = ICON_PATHS[code] || ICON_PATHS.unknown;

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}

export default WeatherIcon;
