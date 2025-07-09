import type { InjectionKey } from "vue";
import type { QTableColumn } from "quasar";
import type { Client, Site } from "src/core/clients/types";

interface BaseOption {
  label: string;
  value: number | string;
}
export interface SelectableOption extends BaseOption {
  type: "option";
  img_right?: string;
  category: string;
}

export interface HeaderOption extends BaseOption {
  type: "header";
}

export type Option = SelectableOption | HeaderOption;

export function isSelectableOption(option: Option): option is SelectableOption {
  return option.type === "option";
}

export function isHeaderOption(option: Option): option is HeaderOption {
  return option.type === "header";
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

// file browser types
import { type QTreeNode } from "quasar";

export interface LazyLoadCallbackParams {
  path: string;
  isDone(nodes: QTreeFileNode[]): void;
  isFail(): void;
}

export interface FileSystemNodeTable {
  id: string;
  name: string;
  path: string;
  type: "folder" | "file";
  asset_id?: string;
  size?: string | undefined;
}

export interface QTreeFileNode extends QTreeNode<unknown> {
  id: string;
  path: string;
  type: "folder" | "file";
  size?: string;
  asset_id?: string | undefined;
  children?: QTreeFileNode[];
}
