/* eslint-disable @typescript-eslint/no-explicit-any */
export type AuditAction =
  | "login"
  | "failed_login"
  | "delete"
  | "modify"
  | "add"
  | "view"
  | "check_run"
  | "task_run"
  | "agent_install"
  | "remote_session"
  | "execute_script"
  | "execute_command"
  | "bulk_action"
  | "url_action";

export type AuditObjectType =
  | "user"
  | "script"
  | "agent"
  | "policy"
  | "winupdatepolicy"
  | "client"
  | "site"
  | "check"
  | "automatedtask"
  | "coresettings"
  | "bulk"
  | "alerttemplate"
  | "role"
  | "urlaction"
  | "keystore"
  | "customfield";

export interface AuditLog {
  id: number;
  username: string;
  agent: string | null;
  agent_id: string | null;
  entry_time: string;
  action: AuditAction;
  object_type: AuditObjectType;
  before_value: Record<string, any> | null;
  after_value: Record<string, any> | null;
  message: string | null;
  debug_info: Record<string, any> | null;
}

export interface Pagination {
  page?: number;
  rowsPerPage?: number;
  sortBy?: string | null;
  descending?: boolean;
  rowsNumber?: number;
}
export interface GetAuditLogRequest {
  pagination: Pagination;
  agentFilter: string[] | null;
  clientFilter: string[] | null;
  userFilter: string[] | null;
  timeFilter: number;
  actionFilter: AuditAction[];
  objectFilter: AuditObjectType[];
}

export type DebugLogLevel = "info" | "warning" | "error" | "critical";

export type DebugLogType =
  | "agent_update"
  | "agent_issues"
  | "win_updates"
  | "system_issues"
  | "scripting";

export interface DebugLog {
  id: number;
  entry_time: string;
  agent?: number;
  log_level: DebugLogLevel;
  log_type: DebugLogType;
  message: string;
}

export interface GetDebugLogRequest {
  agentFilter: string | null;
  logLevelFilter: DebugLogLevel;
  logTypeFilter: DebugLogType | null;
}

export type PendingActionStatus = "pending" | "completed";

export type PendingActionType =
  | "schedreboot"
  | "agentupdate"
  | "chocoinstall"
  | "runcmd"
  | "runscript"
  | "runpatchscan"
  | "runpatchinstall";

export interface PendingAction {
  id: number;
  agent: number;
  entry_time: string;
  action_type: PendingActionType;
  status: PendingActionStatus;
  details?: Record<string, any>;
}
