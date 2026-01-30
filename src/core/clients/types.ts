import type { CustomFieldValue } from "src/core/settings/types";
import type { AgentMonitoringType } from "../agents/types";
export interface Client {
  id: number;
  name: string;
  block_policy_inheritance: boolean;
  failing_checks: {
    error: boolean;
    warning: boolean;
  };
  workstation_policy?: number;
  server_policy?: number;
  alert_template?: number | null;
  patch_policy?: number;
  sites: Site[];
  maintenance_mode: boolean;
  agent_count?: number;
  custom_fields: ClientCustomFieldValue[];
}

export interface Site {
  id: number;
  name: string;
  client: number;
  client_name: string;
  block_policy_inheritance: boolean;
  failing_checks: {
    error: boolean;
    warning: boolean;
  };
  workstation_policy?: number;
  server_policy?: number;
  alert_template?: number | null;
  patch_policy?: number;
  maintenance_mode: boolean;
  agent_count?: number;
  custom_fields: ClientCustomFieldValue[];
}

export interface ClientCustomFieldValue extends CustomFieldValue {
  client?: number;
}

export interface SiteCustomFieldValue extends CustomFieldValue {
  site?: number;
}

export type GoArch = "amd64" | "386" | "arm64" | "arm";

export interface Deployment {
  id?: number;
  uid?: string;
  site: number | null;
  agenttype: AgentMonitoringType;
  goarch: GoArch;
  expires?: string;
  created?: string;
  auth_token?: number;
  token_key?: string;
  power: boolean;
  rdp: boolean;
  ping: boolean;
}
