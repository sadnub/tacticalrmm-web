export type ScriptShell = "powershell" | "cmd" | "python" | "shell" | "nushell" | "deno";

export type ScriptType = "user_defined" | "builtin";

export type SupportedPlatform = "windows" | "linux" | "darwin";

export interface Script {
  id?: number;
  guid?: string | null;
  name: string;
  description: string | null;
  filename?: string | null;
  shell: ScriptShell;
  script_type?: ScriptType;
  args: string[];
  env_vars: string[];
  syntax: string | null;
  favorite: boolean;
  category: string;
  script_body: string;
  default_timeout: number;
  hidden?: boolean;
  supported_platforms: SupportedPlatform[] | null;
  run_as_user: boolean;
  link?: string | undefined;
}

export interface ScriptSnippet {
  id?: number;
  name: string;
  desc: string;
  code: string;
  shell: ScriptShell;
}

export interface ScriptResult {
  execution_time: string;
  retcode: string;
  stdout: string;
  stderr: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isScriptResult(value: any): value is ScriptResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return "retcode" in value && typeof value.retcode === "number";
}
