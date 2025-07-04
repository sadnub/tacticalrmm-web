import type { AgentPlat } from "../agents/types";
import type { AlertSeverity } from "../alerts/types";

export type TaskSyncStatus = "synced" | "notsynced" | "pendingdeletion" | "initial";

export type TaskStatus = "passing" | "failing" | "pending";

export type TaskRunStatus = "running" | "completed";

export type TaskType =
  | "daily"
  | "weekly"
  | "monthly"
  | "monthlydow"
  | "checkfailure"
  | "manual"
  | "runonce"
  | "onboarding"
  | "scheduled";

export interface TaskResult {
  id: number;
  agent: string;
  task: number;
  retcode: number | null;
  stdout: string | null;
  stderr: string | null;
  execution_time: string;
  last_run: string | null;
  status: TaskStatus;
  sync_status: TaskSyncStatus;
  locked_at: string | null;
  run_status: TaskRunStatus;
}

export interface TaskAction {
  name: string;
  type: "cmd" | "script";
  script_args?: string[];
  env_vars: string[];
  timeout: number;
  script?: number | null;
  command?: string;
  shell: string;
}

export interface AutomatedTask {
  id: number;
  agent?: string | null;
  policy?: number | null;
  custom_field: number | null;
  actions: TaskAction[];
  assigned_check: number | null;
  name: string;
  collector_all_output: boolean;
  enabled: boolean;
  continue_on_error: boolean;
  alert_severity: AlertSeverity;
  email_alert: boolean;
  text_alert: boolean;
  dashboard_alert: boolean;
  task_type: TaskType;
  win_task_name?: string;
  run_time_date: string;
  expire_date: string | null;
  daily_interval: number;
  run_time_bit_weekdays: number;
  weekly_interval: number;
  monthly_days_of_month: number;
  monthly_months_of_year: number;
  monthly_weeks_of_month: number;
  task_repetition_duration: string | null;
  task_repetition_interval: string | null;
  stop_task_at_duration_end: boolean;
  random_task_delay: string | null;
  remove_if_not_scheduled: boolean;
  run_asap_after_missed: boolean;
  task_instance_policy: number;
  task_supported_platforms: AgentPlat[];
  task_result?: Partial<TaskResult>;
}

export interface AutomatedTaskUI {
  id: number;
  agent?: string | null;
  policy?: number | null;
  custom_field: number | null;
  actions: TaskAction[];
  assigned_check: number | null;
  name: string;
  collector_all_output: boolean;
  enabled: boolean;
  continue_on_error: boolean;
  alert_severity: AlertSeverity;
  email_alert: boolean;
  text_alert: boolean;
  dashboard_alert: boolean;
  task_type: TaskType;
  monthly_type?: "days" | "weeks" | undefined;
  win_task_name?: string;
  run_time_date: string;
  expire_date: string | null;
  daily_interval: number | null;
  run_time_bit_weekdays: number[];
  weekly_interval: number | null;
  monthly_days_of_month: number[];
  monthly_months_of_year: number[];
  monthly_weeks_of_month: number[];
  task_repetition_duration: string | null;
  task_repetition_interval: string | null;
  stop_task_at_duration_end: boolean;
  random_task_delay: string | null;
  remove_if_not_scheduled: boolean;
  run_asap_after_missed: boolean;
  task_instance_policy: number;
  task_supported_platforms: AgentPlat[];
  task_result?: Partial<TaskResult>;
}
