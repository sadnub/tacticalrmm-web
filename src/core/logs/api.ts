import axios from "axios";
import { ref } from "vue";
import { useCachedAction } from "../dashboard/composables";
import type {
  PendingAction,
  DebugLog,
  AuditLog,
  GetAuditLogRequest,
  GetDebugLogRequest,
} from "./types";

// Lazy singletons
let pendingActionStoreInstance: ReturnType<typeof createPendingActionStore> | null = null;
let auditLogStoreInstance: ReturnType<typeof createAuditLogStore> | null = null;
let debugLogStoreInstance: ReturnType<typeof createDebugLogStore> | null = null;

export function usePendingActionStore() {
  if (!pendingActionStoreInstance) {
    pendingActionStoreInstance = createPendingActionStore();
  }
  return pendingActionStoreInstance;
}

export function useAuditLogStore() {
  if (!auditLogStoreInstance) {
    auditLogStoreInstance = createAuditLogStore();
  }
  return auditLogStoreInstance;
}

export function useDebugLogStore() {
  if (!debugLogStoreInstance) {
    debugLogStoreInstance = createDebugLogStore();
  }
  return debugLogStoreInstance;
}

function createPendingActionStore() {
  const pendingActions = ref<PendingAction[]>([]);
  const agentPendingActions = ref<PendingAction[]>([]);
  const isLoading = ref(false);
  const isError = ref(true);

  function _getPendingActions() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<PendingAction[]>("/logs/pendingactions/")
      .then(({ data }) => {
        pendingActions.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getPendingActions = useCachedAction(_getPendingActions, {
    key: "getPendingActions",
    duration: 30 * 1000, // 30 seconds cache
  });

  async function getAgentPendingActions(agentId: string) {
    isLoading.value = true;
    isError.value = false;
    agentPendingActions.value = [];

    try {
      const { data } = await axios.get<PendingAction[]>(`/agents/${agentId}/pendingactions/`);
      agentPendingActions.value = data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function deletePendingAction(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.delete(`/logs/pendingactions/${id}/`);
      const index = pendingActions.value.findIndex((action) => action.id === id);
      if (index !== -1) {
        pendingActions.value.splice(index, 1);
      }
      const agentIndex = agentPendingActions.value.findIndex((action) => action.id === id);
      if (agentIndex !== -1) {
        agentPendingActions.value.splice(agentIndex, 1);
      }
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    pendingActions,
    agentPendingActions,
    isLoading,
    isError,
    getPendingActions,
    getAgentPendingActions,
    deletePendingAction,
  };
}

export interface AuditLogResponse {
  audit_logs: AuditLog[];
  total: number;
}

function createAuditLogStore() {
  const auditLog = ref<AuditLog[]>([]);
  const rowsNumber = ref(0);
  const isLoading = ref(false);
  const isError = ref(false);

  function getAuditLog(payload: GetAuditLogRequest) {
    isLoading.value = true;
    isError.value = false;
    axios
      .patch<AuditLogResponse>("/logs/audit/", payload)
      .then(({ data: { audit_logs, total } }) => {
        auditLog.value = audit_logs;
        rowsNumber.value = total;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function $reset() {
    auditLog.value = [];
    rowsNumber.value = 0;
    isLoading.value = false;
    isError.value = false;
  }

  return {
    auditLog,
    rowsNumber,
    isLoading,
    isError,
    getAuditLog,
    $reset,
  };
}

function createDebugLogStore() {
  const debugLog = ref<DebugLog[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getDebugLog(payload: GetDebugLogRequest) {
    isLoading.value = true;
    isError.value = false;

    axios
      .patch<DebugLog[]>("/logs/debug/", payload)
      .then(({ data }) => {
        debugLog.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function $reset() {
    debugLog.value = [];
    isLoading.value = false;
    isError.value = false;
  }

  return {
    debugLog,
    isLoading,
    isError,
    getDebugLog,
    $reset,
  };
}
