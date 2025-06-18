import { defineStore } from "pinia";
import axios from "axios";
import { ref } from "vue";

export const usePendingAction = defineStore("pendingAction", () => {
  const pendingActions = ref([]);
  const agentPendingActions = ref([]);
  const isLoading = ref(false);
  const isError = ref(true);

  async function getPendingActions() {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.get("/logs/pendingactions/");
      pendingActions.value = data;
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function getAgentPendingActions(agentId: string) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.get(`/agents/${agentId}/pendingactions/`);
      agentPendingActions.value = data;
      return data;
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
    } catch {
      isError.value = true;
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
});

export const useAuditLog = defineStore("auditLog", () => {
  const auditLog = ref([]);
  const isLoading = ref(false);
  const isError = ref(null);

  async function getAuditLog(payload) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.patch("/logs/audit/", payload);
      auditLog.value = data;
      return data;
    } catch (e) {
      isError.value = true;
      console.error("Failed to fetch audit log:", e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }
});

export const useDebugLog = defineStore("debugLog", () => {
  const debugLog = ref([]);

  async function fetchDebugLog(payload) {
    isLoading.value = true;
    error.value = null;
    try {
      // It's good practice to use the configured axios instance from boot files
      const { data } = await axios.patch("/logs/debug/", payload);
      debugLog.value = data; // Update the state
      return data; // Optionally return the data for immediate use
    } catch (e) {
      error.value = e; // Store the error
      console.error("Failed to fetch debug log:", e);
      // It's good practice to throw the error so the calling component knows it failed
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  // --- RETURN ---
  // Expose the state, getters, and actions
  return {
    // State
    debugLog,
    auditLog,
    pendingActions,
    agentPendingActions,
    isLoading,
    error,
    // Getters
    hasError,
    // Actions
    fetchDebugLog,
    fetchAuditLog,
    fetchPendingActions,
    fetchAgentPendingActions,
    deletePendingAction,
  };
});
