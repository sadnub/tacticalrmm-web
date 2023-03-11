export interface Integration {
  id: number;
  name: string;
  desc?: string;
  enabled: boolean;
  version?: string;
  latest_version?: string;
  installed: boolean;
  installed_on?: string;
  update_available?: boolean;
  install_url: string;
  frontend_module_url?: string;
}
