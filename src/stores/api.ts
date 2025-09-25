import { useTaskStore } from "src/core/tasks/api";
import { useAgentStore, useAgentNoteStore, useAgentSoftwareStore } from "src/core/agents/api";
import { useCheckStore } from "src/core/checks/api";
import { useCoreStore, useCustomFieldStore } from "src/core/settings/api";
import { useUserStore, useRoleStore } from "src/core/accounts/api";

// accounts
export const userStore = useUserStore();
export const roleStore = useRoleStore();

// agents
export const agentStore = useAgentStore();
export const agentNoteStore = useAgentNoteStore();
export const agentSoftwareStore = useAgentSoftwareStore();

// tasks
export const taskStore = useTaskStore();

// checks
export const checkStore = useCheckStore();

// settings
export const coreStore = useCoreStore();
export const customFieldStore = useCustomFieldStore();
