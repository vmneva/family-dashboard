const OWNERS = {
  mom: { label: 'Äiti', initial: 'Ä', color: 'var(--owner-mom)' },
  dad: { label: 'Isä', initial: 'I', color: 'var(--owner-dad)' },
}

export function ownerLabel(owner) {
  return OWNERS[owner]?.label ?? owner
}

export function ownerColor(owner) {
  return OWNERS[owner]?.color ?? 'var(--border)'
}

export function ownerInitial(owner) {
  return OWNERS[owner]?.initial ?? owner?.[0]?.toUpperCase() ?? '?'
}
