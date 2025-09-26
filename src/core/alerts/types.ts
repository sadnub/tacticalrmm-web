export type AlertSeverity = "info" | "warning" | "error";

export type AlertTemplateActionType = "script" | "server" | "rest";

export interface AlertTemplate {
  id: number;
  name: string;
  is_active: boolean;

  action_type: AlertTemplateActionType;
  action: number | null;
  action_rest: number | null;
  action_args: string[];
  action_env_vars: string[];
  action_timeout: number;

  resolved_action_type: AlertTemplateActionType;
  resolved_action: number | null;
  resolved_action_rest: number | null;
  resolved_action_args: string[];
  resolved_action_env_vars: string[];
  resolved_action_timeout: number;

  email_recipients: string[];
  text_recipients: string[];
  email_from: string | null;

  agent_email_on_resolved: boolean | null;
  agent_text_on_resolved: boolean | null;
  agent_always_email: boolean | null;
  agent_always_text: boolean | null;
  agent_always_alert: boolean | null;
  agent_periodic_alert_days: number | null;
  agent_script_actions: boolean | null;

  check_email_alert_severity: AlertSeverity[];
  check_text_alert_severity: AlertSeverity[];
  check_dashboard_alert_severity: AlertSeverity[];
  check_email_on_resolved: boolean | null;
  check_text_on_resolved: boolean | null;
  check_always_email: boolean | null;
  check_always_text: boolean | null;
  check_always_alert: boolean | null;
  check_periodic_alert_days: number | null;
  check_script_actions: boolean | null;

  task_email_alert_severity: AlertSeverity[];
  task_text_alert_severity: AlertSeverity[];
  task_dashboard_alert_severity: AlertSeverity[];
  task_email_on_resolved: boolean | null;
  task_text_on_resolved: boolean | null;
  task_always_email: boolean | null;
  task_always_text: boolean | null;
  task_always_alert: boolean | null;
  task_periodic_alert_days: number | null;
  task_script_actions: boolean | null;

  exclude_workstations: boolean | null;
  exclude_servers: boolean | null;
  excluded_sites?: number[];
  excluded_clients?: number[];
  excluded_agents?: number[];
}

// core alert types (non-template)
export interface Alert {
  id: number;
  agent_id?: string;
  client: string;
  site: string;
  hostname: string;
  alert_type: string;
  severity: AlertSeverity;
  message: string;
  alert_time: string | number;
  resolved_on?: string | null;
  snoozed_until?: string | null;
  resolved?: boolean;
  snoozed?: boolean;

  // optional fields for action results
  action_execution_time?: string | null;
  action_retcode?: number | null;
  action_stdout?: string | null;
  action_errout?: string | null;
  action_run?: string | null;

  resolved_action_execution_time?: string | null;
  resolved_action_retcode?: number | null;
  resolved_action_stdout?: string | null;
  resolved_action_errout?: string | null;
  resolved_action_run?: string | null;
}

export interface TopAlertsResponse {
  alerts_count: number;
  alerts: Alert[];
}

export interface AlertSearchParams {
  clientFilter?: number[];
  severityFilter?: AlertSeverity[];
  timeFilter?: number; // days or 0 for all
  snoozedFilter?: boolean;
  resolvedFilter?: boolean;
}
