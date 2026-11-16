/**
 * Generic CSV export utility for admin tables
 */

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: string; label: string }[],
  filename: string
) {
  if (data.length === 0) return;

  const formulaPrefix = /^[\u0000-\u0020\uFEFF]*[=+@-]/;

  const header = columns.map((c) => `"${c.label}"`).join(',');
  const rows = data.map((row) =>
    columns
      .map((c) => {
        const value = c.key.split('.').reduce((obj: any, k) => obj?.[k], row);
        const raw = value == null ? '' : String(value);
        const safe = typeof value === 'string' && formulaPrefix.test(raw) ? `'${raw}` : raw;
        const str = safe.replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
