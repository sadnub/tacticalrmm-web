export interface Policy {
  id: number;
  name: string;
  desc: string | null;
  active: boolean;
  enforced: boolean;
  alert_template: number | null;
  excluded_sites: number[];
  excluded_clients: number[];
  excluded_agents: string[];
  winupdatepolicy?: WinPatchPolicy[];
}

export type WinPatchPolicySeverity = "manual" | "approve" | "ignore" | "inherit";

export type WinPatchPolicyRunTime = "daily" | "monthly" | "inherit";
export interface WinPatchPolicy {
  id?: number;
  policy?: number;
  critical: WinPatchPolicySeverity;
  important: WinPatchPolicySeverity;
  moderate: WinPatchPolicySeverity;
  low: WinPatchPolicySeverity;
  other: WinPatchPolicySeverity;
  run_time_hour: number;
  run_time_frequency: WinPatchPolicyRunTime;
  run_time_days: number[];
  run_time_day: number;
  reboot_after_install: string;
  reprocess_failed_inherit: boolean;
  reprocess_failed: boolean;
  reprocess_failed_times: number;
  email_if_fail: boolean;
}

export interface ResetPatchPolicyRequest {
  site?: number | null;
  client?: number | null;
}

// Policy related types
export interface PolicyRelated {
  default_server_policy: boolean;
  default_workstation_policy: boolean;
  server_clients: Array<{ id: number; name: string }>;
  workstation_clients: Array<{ id: number; name: string }>;
  server_sites: Array<{ id: number; name: string; client_name: string }>;
  workstation_sites: Array<{ id: number; name: string; client_name: string }>;
  agents: Array<{ pk: string; hostname: string; client: string; site: string }>;
}

// Tree structure types for policy overview
export interface PolicyTreeClient {
  name: string;
  server_policy?: Policy;
  workstation_policy?: Policy;
  sites: PolicyTreeSite[];
}

export interface PolicyTreeSite {
  name: string;
  server_policy?: Policy;
  workstation_policy?: Policy;
}

export interface PolicyTreeItem {
  label: string;
  id: number;
  icon: string;
  selectable: boolean;
  children?: PolicyTreeItem[];
  key: string;
}
