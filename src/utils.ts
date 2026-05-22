export function fmt(n: number | string | undefined | null): string {
  const num = typeof n === 'string' ? parseFloat(n.replace(/[^0-9.]/g, '')) : (n ?? 0);
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('es-CO');
}

export function unf(s: string | undefined | null): number {
  return parseFloat(String(s || 0).replace(/[^0-9.]/g, '')) || 0;
}

export function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function todayFmt(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function todayShort(): string {
  return new Date().toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}
