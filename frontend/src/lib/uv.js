const UV_LEVELS = [
  { max: 2, label: 'Matala', className: 'uv-low' },
  { max: 5, label: 'Kohtalainen', className: 'uv-moderate' },
  { max: 7, label: 'Korkea', className: 'uv-high' },
  { max: 10, label: 'Erittäin korkea', className: 'uv-very-high' },
  { max: Infinity, label: 'Äärimmäinen', className: 'uv-extreme' },
]

export function getUvLevel(value) {
  if (value === null || value === undefined) return null
  return UV_LEVELS.find((level) => value <= level.max) ?? null
}
