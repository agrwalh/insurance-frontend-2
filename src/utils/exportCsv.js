function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value).replace(/\r?\n|\r/g, " ");
  if (/[",]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export function exportToCsv(filename, rows = [], columns = []) {
  if (!rows.length) {
    alert("No rows available to export.");
    return;
  }

  const header = columns.map((column) => escapeCsvValue(column.header)).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCsvValue(column.value(row))).join(","))
    .join("\n");

  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}