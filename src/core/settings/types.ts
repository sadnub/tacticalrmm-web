export type DebugLogLevel = "info" | "warning" | "error" | "debug";

export interface CoreSettings {
  id: number;
  email_alert_recipients: string[];
  sms_alert_recipients: string[];
  twilio_number: string | null;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  smtp_from_email: string;
  smtp_from_name: string | null;
  smtp_host: string;
  smtp_host_user: string;
  smtp_host_password: string;
  smtp_port: number;
  smtp_requires_auth: boolean;
  default_time_zone: string;
  check_history_prune_days: number;
  resolved_alerts_prune_days: number;
  agent_history_prune_days: number;
  debug_log_prune_days: number;
  audit_log_prune_days: number;
  report_history_prune_days: number;
  agent_debug_level: DebugLogLevel;
  clear_faults_days: number;
  mesh_token: string | null;
  mesh_username: string | null;
  mesh_site: string | null;
  mesh_device_group: string | null;
  mesh_company_name: string | null;
  sync_mesh_with_trmm: boolean;
  agent_auto_update: boolean;
  workstation_policy: number | null;
  server_policy: number | null;
  alert_template: number | null;
  date_format: string;
  open_ai_token: string | null;
  open_ai_model: string;
  enable_server_scripts: boolean;
  enable_server_webterminal: boolean;
  terminal_mode: "new" | "legacy";
  default_shell_windows: string;
  default_shell_windows_custom: string;
  default_shell_linux: string;
  default_shell_linux_custom: string;
  default_shell_darwin: string;
  default_shell_darwin_custom: string;
  notify_on_info_alerts: boolean;
  notify_on_warning_alerts: boolean;
  block_local_user_logon: boolean;
  sso_enabled: boolean;
  all_timezones: string[];
}

export type CustomFieldModel = "client" | "site" | "agent";

export type CustomFieldType = "text" | "number" | "single" | "multiple" | "checkbox" | "datetime";

export interface CustomField {
  id: number;
  order?: number;
  model: CustomFieldModel;
  type: CustomFieldType;
  options: string[];
  name: string;
  required: boolean;
  default_value_string: string;
  default_value_bool: boolean;
  default_values_multiple: string[];
  hide_in_ui: boolean;
  hide_in_summary: boolean;
  default_value?: string | boolean | string[];
}

export type CustomFieldValueField = string | boolean | number | string[] | undefined | null;

export interface CustomFieldValue {
  id?: number;
  field: number;
  value?: CustomFieldValueField;
  string_value?: string | undefined;
  bool_value?: boolean | undefined;
  multiple_value?: string[] | undefined;
}

export type URLActionType = "web" | "rest";

export type RESTMethodType = "get" | "post" | "put" | "delete" | "patch";

export interface URLAction {
  id: number;
  name: string;
  desc?: string;
  action_type: URLActionType;
  pattern: string;
  rest_method: RESTMethodType;
  rest_body: string;
  rest_headers: string;
}

export interface TestRunURLActionResponse {
  url: string;
  result: string;
  body: string;
}

export interface TestRunURLActionRequest {
  pattern: string;
  rest_body: string;
  rest_headers: string;
  rest_method: RESTMethodType;
  run_instance_type: string;
  run_instance_id: string | number | null;
}

export interface APIKey {
  id?: number;
  name: string;
  key: string;
  user: number;
  expiration: string;
  created_time?: string;
}

export interface GlobalKey {
  id: number;
  name: string;
  value: string;
}

export interface ServerMaintenanceRequest {
  action: number | null;
  prune_tables: string[];
}

export interface Schedule {
  id: number;
  name: string;
  run_time: string;
  run_time_weekdays: number[];
  monthly_months_of_year: number[];
  monthly_days_of_month: number[];
  monthly_weeks_of_month: number[];
  schedule_type: "daily" | "weekly" | "monthly";
  monthly_type: "days" | "weeks";
}
