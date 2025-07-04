/* eslint-disable @typescript-eslint/no-explicit-any */
import { exportFile, Notify, type QTableColumn } from "quasar";

function formatCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  let stringValue = String(value);

  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    stringValue = stringValue.replace(/"/g, '""');
    stringValue = `"${stringValue}"`;
  }
  return stringValue;
}

export function exportToCsv(columns: QTableColumn[], rows: readonly any[], exportFileName: string) {
  const header = columns.map((col) => formatCsvCell(col.label)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const field = col.field instanceof Function ? col.field(row) : row[col.field];
          return formatCsvCell(field);
        })
        .join(","),
    )
    .join("\n");

  const csvContent = `${header}\n${body}`;

  const status = exportFile(exportFileName, csvContent, "text/csv");

  if (status !== true) {
    Notify.create({
      message: "Browser denied file download...",
      color: "negative",
      icon: "warning",
    });
  }
}
