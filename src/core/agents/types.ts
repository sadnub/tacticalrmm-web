import type { AlertTemplate } from "../alerts/types";
import type { Policy, WinPatchPolicy } from "../automation/types";
import type { CustomFieldValue } from "../settings/types";

export type AgentPlat = "windows" | "linux" | "darwin";
export type AgentMonitoringType = "server" | "workstation";
export type GoArch = "amd64" | "386" | "arm64" | "arm";

export interface Agent {
  id: number;
  version: string;
  operating_system?: string;
  plat: AgentPlat;
  goarch?: GoArch;
  hostname: string;
  agent_id: string;
  client_name: string;
  last_seen: string;
  services?: AgentService[];
  public_ip?: string;
  total_ram?: number;
  disks: {
    device: string;
    fstype: string;
    percent: number;
    total: number;
    free: number;
  }[];
  boot_time?: number;
  logged_in_username?: string;
  last_logged_in_user?: string;
  monitoring_type: AgentMonitoringType;
  description?: string;
  mesh_node_id?: string;
  overdue_email_alert: boolean;
  overdue_text_alert: boolean;
  overdue_dashboard_alert: boolean;
  offline_time: number;
  overdue_time: number;
  check_interval: number;
  needs_reboot: boolean;
  choco_installed: boolean;
  wmi_detail?: WMIDetail;
  patches_last_installed?: Date;
  time_zone?: string;
  maintenance_mode: boolean;
  block_policy_inheritance: boolean;
  alert_template?: AlertTemplate;
  site_name: string;
  site: number;
  client: number;
  policy?: number;
  patch_policy: number;
  custom_fields: AgentCustomFieldValue[];
  cpu_model: string[];
  status: "online" | "overdue" | "offline";
  make_model: string;
  local_ips: string[];
  checks: {
    total: number;
    passing: number;
    failing: number;
    warning: number;
    info: number;
    has_failing_checks: boolean;
  };
  has_patches_pending: boolean;
  pending_actions_count: number;
  physical_disks: string;
  graphics: string;
  winupdatepolicy: WinPatchPolicy[];
  effective_patch_policy: WinPatchPolicy;
  applied_policies: Record<string, Policy>;
}

export interface AgentEventLog {
  eventType: string;
  source: string;
  eventID: string;
  time: string;
  message: string;
}

export interface AgentProcess {
  name: string;
  cpu_percent: string;
  membytes: string;
  username: string;
  pid: number;
}

export interface WMIDetail {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  os: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cpu: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mem: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usb: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bios: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disk: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comp_sys: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  base_board: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comp_sys_prod: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  network_config: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  desktop_monitor: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  graphics: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  network_adapter: any[];
  serialnumber?: string | undefined;
}

export interface MeshUrls {
  file?: string;
  terminal?: string;
  control?: string;
  status?: "online" | "offline";
  hostname: string;
  client: string;
  site: string;
}

export interface WebVNCUrl {
  vnc?: string | undefined;
  hostname: string;
  client: string;
  site: string;
}

export type AgentServiceStartType = "automatic" | "manual" | "disabled" | "autodelay" | "auto";

export interface AgentService {
  display_name: string;
  name: string;
  start_type: AgentServiceStartType;
  status: "running" | "stopped";
  binpath: string;
  description: string;
  autodelay: boolean;
}

export type PatchAction = "inherit" | "approve" | "ignore" | "nothing";

export interface WindowsUpdate {
  id?: number;
  agent: string;
  guid: string;
  kb: string;
  title: string;
  installed: boolean;
  downloaded: boolean;
  description: string;
  severity: string;
  categories: string[];
  category_ids: string[];
  kb_article_ids: string[];
  more_info_urls: string[];
  support_url: string;
  revision_number: number;
  action: PatchAction;
  result: string;
  date_installed: string;
}

export interface AgentNote {
  id: number;
  agent_id: string;
  user: number;
  note: string;
  entry_time: string;
}

export interface AgentCustomFieldValue extends CustomFieldValue {
  agent?: number;
}

export type AgentHistoryType = "task_run" | "script_run" | "cmd_run";

export interface AgentHistory {
  id: number;
  agent: string;
  time: string;
  type: AgentHistoryType;
  command: string | null;
  username: string;
  results: string | null;
  script: number | null;
  script_results: {
    stdout?: string;
    stderr?: string;
    retcode?: number;
    execution_time?: string;
  } | null;
  custom_field: number | null;
  collector_all_output: boolean;
  save_to_agent_note: boolean;
}

export interface Software {
  name: string;
  size: string;
  version: string;
  install_date: string;
  uninstall: string;
  publisher: string;
}
export interface AgentSoftware {
  id: number;
  agent: string;
  software: Software[];
}

export type AgentRecoveryMode = "tacagent" | "mesh";

export type BulkActionMode = "script" | "command" | "patch";

export type CommandShellType = "cmd" | "powershell" | "/bin/bash" | "custom";
export interface RunBulkActionRequest {
  mode: BulkActionMode;
  target: "client" | "site" | "agents" | "all";
  monType: AgentMonitoringType | "all";
  osType: AgentPlat;
  cmd: string;
  shell: CommandShellType;
  custom_shell?: string | null;
  custom_field?: number | null;
  collector_all_output: boolean;
  save_to_agent_note: boolean;
  patchMode: "scan" | "install";
  offlineAgents: boolean;
  client?: number | null;
  site?: number | null;
  agents: string[];
  script?: number | null;
  timeout: number;
  args: string[];
  env_vars: string[];
  run_as_user: boolean;
}

export interface RunScriptRequest {
  output: "wait" | "forget" | "email" | "collector" | "note";
  emails: string[];
  emailMode: string;
  custom_field: number | null;
  save_all_output: boolean;
  script: number | null;
  args: string[];
  env_vars: string[];
  timeout: number;
  run_as_user: boolean;
  run_on_server: boolean;
}

export interface AgentVersionsResponse {
  versions: string[];
  version: string | null;
  agents: Agent[];
}

export interface AgentCommandRequest {
  cmd: string;
  timeout: number;
  shell: CommandShellType;
  custom_shell: string | null;
  run_as_user: boolean;
}

export interface UpdateAgentRequest {
  id: number;
  hostname: string;
  site: number;
  monitoring_type: string;
  description?: string | undefined;
  time_zone?: string | null | undefined;
  check_interval: number;
  offline_time: number;
  overdue_time: number;
  overdue_email_alert: boolean;
  overdue_text_alert: boolean;
  overdue_dashboard_alert: boolean;
  custom_fields?: AgentCustomFieldValue[] | undefined;
  maintenance_mode?: boolean;
}

// Registry types
export interface RegistryNode {
  id: string;
  label: string;
  lazy?: boolean;
  children?: RegistryNode[];
  isComputer?: boolean;
  isLoadMore?: boolean;
}

export interface RegistryValue {
  name: string;
  type: string;
  data: string | number | string[];
  newKey?: boolean;
}
