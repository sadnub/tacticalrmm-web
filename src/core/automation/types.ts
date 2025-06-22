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
}
