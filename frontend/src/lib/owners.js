const OWNERS = {
  mom: { label: 'Äiti', color: 'var(--owner-mom)' },
  dad: { label: 'Isä', color: 'var(--owner-dad)' },
}

export function ownerLabel(owner) {
  return OWNERS[owner]?.label ?? owner
}

export function ownerColor(owner) {
  return OWNERS[owner]?.color ?? 'var(--border)'
}
