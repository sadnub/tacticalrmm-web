/* eslint-disable @typescript-eslint/no-explicit-any */
import type { InjectionKey } from "vue";
import type { QTableColumn } from "quasar";
import type { Client, Site } from "src/core/clients/types";

export type Option =
  | { label: string; value: number | string; cat: string; img_right?: string }
  | { category: string };

export function isLabeledOption(option: Option): option is {
  label: string;
  value: number | string;
  cat: string;
  img_right?: string;
} {
  return (
    typeof option === "object" &&
    option !== null &&
    "label" in option &&
    typeof (option as any).label === "string" &&
    "value" in option &&
    (typeof (option as any).value === "number" || typeof (option as any).value === "string")
  );
}

export function isCategoryOption(option: Option): option is { category: string } {
  return (
    typeof option === "object" &&
    option !== null &&
    "category" in option &&
    typeof (option as any).category === "string"
  );
}

export interface ClientTreeNode {
  label: string;
  id: number;
  raw: string;
  header: "root" | "generic";
  icon: string;
  color?: "green" | "negative" | "warning";
  selectable?: boolean;
  children?: ClientTreeNode[];
  client?: Client;
  site?: Site;
}

export interface TacticalColumn extends QTableColumn {
  truncate?: boolean;
}

// for tactical table export csv injected method
export type TableExportFunction = () => void;
export const tableExportKey: InjectionKey<TableExportFunction> = Symbol("tableExport");
