import * as XLSX from 'xlsx';

export function downloadExcel(
  sheets: Array<{ name: string; rows: Record<string, unknown>[] }>,
  filename: string,
) {
  const wb = XLSX.utils.book_new();

  for (const { name, rows } of sheets) {
    if (rows.length === 0) {
      // Empty sheet placeholder
      const ws = XLSX.utils.aoa_to_sheet([['Veri yok']]);
      XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
      continue;
    }
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto column width
    const cols = Object.keys(rows[0]);
    ws['!cols'] = cols.map(key => ({
      wch: Math.max(
        key.length,
        ...rows.map(r => String(r[key] ?? '').length),
      ) + 2,
    }));

    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
