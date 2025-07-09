export type AgentDblClickAction = "editagent" | "takecontrol" | "remotebg" | "urlaction";

export type ClientTreeSort = "alphafail" | "alpha";

export type AgentTableTab = "server" | "workstation" | "mixed";

export interface User {
  id: number;
  username: string;
  password?: string;
  first_name: string;
  last_name: string;
  email: string;
  last_login?: string;
  is_active: boolean;
  block_dashboard_login?: boolean;
  dark_mode?: boolean;
  show_community_scripts?: boolean;
  dblclick_action?: AgentDblClickAction;
  url_action?: number | null;
  default_agent_tbl_tab?: AgentTableTab;
  agents_per_page?: number;
  client_tree_sort?: ClientTreeSort;
  client_tree_splitter?: number;
  loading_bar_color?: string;
  dash_info_color?: string;
  dash_positive_color?: string;
  dash_negative_color?: string;
  dash_warning_color?: string;
  clear_search_when_switching?: boolean;
  date_format?: string | null;
  is_installer_user?: boolean;
  last_login_ip?: string;
  role?: number | null;
}

export interface UserSession {
  digest: string;
  created: string;
  expiry: string;
  user: number;
}

export interface Role {
  id?: number;
  name: string;
  is_superuser: boolean;

  // agents
  can_list_agents: boolean;
  can_use_mesh: boolean;
  can_uninstall_agents: boolean;
  can_update_agents: boolean;
  can_edit_agent: boolean;
  can_manage_procs: boolean;
  can_view_eventlogs: boolean;
  can_send_cmd: boolean;
  can_reboot_agents: boolean;
  can_install_agents: boolean;
  can_run_scripts: boolean;
  can_run_bulk: boolean;
  can_recover_agents: boolean;
  can_list_agent_history: boolean;
  can_send_wol: boolean;

  // core
  can_list_notes: boolean;
  can_manage_notes: boolean;
  can_view_core_settings: boolean;
  can_edit_core_settings: boolean;
  can_do_server_maint: boolean;
  can_code_sign: boolean;
  can_run_urlactions: boolean;
  can_view_customfields: boolean;
  can_manage_customfields: boolean;
  can_run_server_scripts: boolean;
  can_use_webterm: boolean;
  can_view_global_keystore: boolean;
  can_edit_global_keystore: boolean;

  // checks
  can_list_checks: boolean;
  can_manage_checks: boolean;
  can_run_checks: boolean;

  // clients
  can_list_clients: boolean;
  can_manage_clients: boolean;
  can_list_sites: boolean;
  can_manage_sites: boolean;
  can_list_deployments: boolean;
  can_manage_deployments: boolean;
  can_view_clients: number[];
  can_view_sites: number[];

  // automation
  can_list_automation_policies: boolean;
  can_manage_automation_policies: boolean;

  // automated tasks
  can_list_autotasks: boolean;
  can_manage_autotasks: boolean;
  can_run_autotasks: boolean;

  // logs
  can_view_auditlogs: boolean;
  can_list_pendingactions: boolean;
  can_manage_pendingactions: boolean;
  can_view_debuglogs: boolean;

  // scripts
  can_list_scripts: boolean;
  can_manage_scripts: boolean;

  // alerts
  can_list_alerts: boolean;
  can_manage_alerts: boolean;
  can_list_alerttemplates: boolean;
  can_manage_alerttemplates: boolean;

  // win services
  can_manage_winsvcs: boolean;

  // software
  can_list_software: boolean;
  can_manage_software: boolean;

  // windows updates
  can_manage_winupdates: boolean;

  // accounts
  can_list_accounts: boolean;
  can_manage_accounts: boolean;
  can_list_roles: boolean;
  can_manage_roles: boolean;

  // authentication
  can_list_api_keys: boolean;
  can_manage_api_keys: boolean;

  // reporting
  can_view_reports: boolean;
  can_manage_reports: boolean;
}
