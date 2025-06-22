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
  alert_template?: number;
  site_name: string;
  site: number;
  policy?: number;
  patch_policy: number;
  custom_fields: AgentCustomField[];
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
  };
  physical_disks: string;
  graphics: string;
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
  os: never[];
  cpu: never[];
  mem: never[];
  usb: never[];
  bios: never[];
  disk: never[];
  comp_sys: never[];
  base_board: never[];
  comp_sys_prod: never[];
  network_config: never[];
  desktop_monitor: never[];
  graphics: never[];
  network_adapter: never[];
}

export type AgentServiceStartType = "automatic" | "manual" | "disabled" | "autodelay";

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

export interface AgentCustomField {
  id: number;
  agent: string;
  field: number;
  string_value: string | null;
  bool_value: boolean;
  multiple_value: string[];
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
