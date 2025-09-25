import { defineStore } from "pinia";
import axios from "axios";
import { ref } from "vue";
import type {
  PendingAction,
  DebugLog,
  AuditLog,
  GetAuditLogRequest,
  GetDebugLogRequest,
} from "./types";

export const usePendingActionStore = defineStore("pendingActions", () => {
  const pendingActions = ref<PendingAction[]>([]);
  const agentPendingActions = ref<PendingAction[]>([]);
  const isLoading = ref(false);
  const isError = ref(true);

  function getPendingActions() {
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

  function getAgentPendingActions(agentId: string) {
    isLoading.value = true;
    isError.value = false;
    agentPendingActions.value = [];

    axios
      .get<PendingAction[]>(`/agents/${agentId}/pendingactions/`)
      .then(({ data }) => {
        agentPendingActions.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function deletePendingAction(id: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`/logs/pendingactions/${id}/`)
      .then(() => {
        const index = pendingActions.value.findIndex((action) => action.id === id);
        if (index !== -1) {
          pendingActions.value.splice(index, 1);
        }
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
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
});

export interface AuditLogResponse {
  audit_logs: AuditLog[];
  total: number;
}

export const useAuditLogStore = defineStore("auditLogs", () => {
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
});

export const useDebugLogStore = defineStore("debugLogs", () => {
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
});
