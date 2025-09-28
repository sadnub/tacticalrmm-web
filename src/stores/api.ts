import { useTaskStore } from "src/core/tasks/api";
import {
  useAgentStore,
  useAgentNoteStore,
  useAgentSoftwareStore,
  useWindowsUpdateStore,
} from "src/core/agents/api";
import { useCheckStore } from "src/core/checks/api";
import { useAlertsStore, useAlertTemplateStore } from "src/core/alerts/api";
import {
  usePolicyStore,
  usePatchPolicyStore,
  usePolicyChecksStore,
  usePolicyTasksStore,
} from "src/core/automation/api";
import { useClientStore, useSiteStore, useDeploymentStore } from "src/core/clients/api";
import {
  useCoreStore,
  useCustomFieldStore,
  useAPIKeyStore,
  useGlobalKeyStore,
  useCodeSignStore,
  useURLActionStore,
  runTestURLAction,
  runURLAction,
} from "src/core/settings/api";
import { useUserStore, useRoleStore } from "src/core/accounts/api";
import { useChocosStore } from "src/core/software/api";
import { usePendingActionStore, useAuditLogStore, useDebugLogStore } from "src/core/logs/api";
import { useScriptStore, useScriptSnippetStore } from "src/core/scripts/api";

// accounts
export const userStore = useUserStore();
export const roleStore = useRoleStore();

// agents
export const agentStore = useAgentStore();
export const agentNoteStore = useAgentNoteStore();
export const agentSoftwareStore = useAgentSoftwareStore();
export const updateStore = useWindowsUpdateStore();

// tasks
export const taskStore = useTaskStore();

// checks
export const checkStore = useCheckStore();

// alerts
export const alertsStore = useAlertsStore();
export const alertTemplateStore = useAlertTemplateStore();

// automation
export const policyStore = usePolicyStore();
export const patchPolicyStore = usePatchPolicyStore();
export const policyChecksStore = usePolicyChecksStore();
export const policyTasksStore = usePolicyTasksStore();

// clients
export const clientStore = useClientStore();
export const siteStore = useSiteStore();
export const deploymentStore = useDeploymentStore();

// settings
export const coreStore = useCoreStore();
export const customFieldStore = useCustomFieldStore();
export const apiKeyStore = useAPIKeyStore();
export const globalKeyStore = useGlobalKeyStore();
export const codeSignStore = useCodeSignStore();
export const urlActionStore = useURLActionStore();
export { runTestURLAction, runURLAction };

// software
export const chocosStore = useChocosStore();

// logs
export const pendingActionStore = usePendingActionStore();
export const auditLogStore = useAuditLogStore();
export const debugLogStore = useDebugLogStore();

// scripts
export const scriptStore = useScriptStore();
export const scriptSnippetStore = useScriptSnippetStore();
