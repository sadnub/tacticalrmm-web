import type { AlertSeverity } from "../alerts/types";

export type CheckType =
  | "diskspace"
  | "ping"
  | "cpuload"
  | "memory"
  | "winsvc"
  | "script"
  | "eventlog";

export interface EventLogDetails {
  eventType: string;
  source: string;
  eventID: string;
  time: string;
  message: string;
}

export interface CheckResult {
  id: number;
  agent: string;
  assigned_check: number;
  status: "passing" | "failing" | "pending" | "info";
  alert_severity: AlertSeverity | null;
  more_info: string | null;
  last_run: string | null;
  fail_count: number;
  outage_history: string[] | null;
  extra_details: {
    log: EventLogDetails[];
  };
  stdout: string | null;
  stderr: string | null;
  retcode: number | null;
  execution_time: string | null;
  history: number[];
}

export interface Check {
  id: number;
  agent?: string | null;
  policy?: number | null;
  readable_desc?: string;
  overridden_by_policy?: boolean;
  name?: string | null;
  check_type: CheckType;
  email_alert?: boolean;
  text_alert?: boolean;
  dashboard_alert?: boolean;
  fails_b4_alert?: number;
  run_interval: number;
  alert_severity?: AlertSeverity;
  error_threshold?: number;
  warning_threshold?: number;
  disk?: string | null;
  ip?: string | null;
  script?: number | null;
  script_args?: string[];
  env_vars?: string[];
  info_return_codes?: number[];
  warning_return_codes?: number[];
  success_return_codes?: number[];
  timeout?: number | null;
  svc_name?: string | null;
  svc_display_name?: string | null;
  pass_if_start_pending?: boolean | null;
  pass_if_svc_not_exist?: boolean;
  restart_if_stopped?: boolean | null;
  svc_policy_mode?: "default" | "manual" | null;
  log_name?: string | null;
  event_id?: number | "*";
  event_id_is_wildcard?: boolean;
  event_type?: string | null;
  event_source?: string | null;
  event_message?: string | null;
  fail_when?: string | null;
  search_last_day?: number | null;
  number_of_events_b4_alert?: number | null;
  check_result?: CheckResult;
}

export function isAgent(
  parent: { agent: string } | { policy: number },
): parent is { agent: string } {
  return parent && "agent" in parent;
}

export function isPolicy(
  parent: { agent: string } | { policy: number },
): parent is { policy: number } {
  return parent && "policy" in parent;
}

export interface CheckHistory {
  id: number;
  check_id: number;
  agent_id: string;
  x: string;
  y: number;
  results: Record<string, string>;
}
