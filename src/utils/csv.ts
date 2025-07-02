/* eslint-disable @typescript-eslint/no-explicit-any */
import { exportFile, Notify, type QTableColumn } from "quasar";

function formatCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  let stringValue = String(value);

  // If the value contains a comma, a double quote, or a newline, wrap it in double quotes.
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    // Escape any existing double quotes by doubling them up.
    stringValue = stringValue.replace(/"/g, '""');
    stringValue = `"${stringValue}"`;
  }
  return stringValue;
}

export function exportToCsv(columns: QTableColumn[], rows: readonly any[], exportFileName: string) {
  // Create CSV content
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
