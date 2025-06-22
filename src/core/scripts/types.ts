export type ScriptShell = "powershell" | "cmd" | "python";

export type ScriptType = "user_defined" | "builtin";

export type SupportedPlatform = "windows" | "linux" | "darwin";

export interface Script {
  id: number;
  guid: string | null;
  name: string;
  description: string | null;
  filename: string | null;
  shell: ScriptShell;
  script_type: ScriptType;
  args: string[];
  env_vars: string[];
  syntax: string | null;
  favorite: boolean;
  category: string | null;
  script_body: string;
  script_hash: string | null;
  default_timeout: number;
  hidden: boolean;
  supported_platforms: SupportedPlatform[] | null;
  run_as_user: boolean;
}
