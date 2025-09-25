import { ref } from "vue";
import axios from "axios";
import { notifySuccess } from "src/utils/notify";
import type { Check } from "./types";
import { useCachedAction } from "../dashboard/composables";

export function useCheckStore() {
  const checks = ref<Check[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function _getAgentChecks(agentId: string) {
    isLoading.value = true;
    isError.value = false;
    checks.value = [];
    axios
      .get<Check[]>(`/agents/${agentId}/checks/`)
      .then(({ data }) => {
        checks.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getAgentChecks = useCachedAction(_getAgentChecks, {
    key: "getAgentChecks",
    duration: 1 * 30 * 1000,
  });

  async function resetAllAgentChecks(agentId: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/checks/${agentId}/resetall/`);
      checks.value.forEach((check) => {
        if (check.check_result) check.check_result.status = "passing";
      });

      notifySuccess("Checks have been reset.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function runAgentChecks(agentId: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/checks/${agentId}/run/`);
      notifySuccess("Agent checks will be run shortly");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function addCheck(payload: Omit<Check, "id">) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<Check>(`/checks/`, payload);
      checks.value.unshift(data);
      notifySuccess("Check was created successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateCheck(id: number, payload: Partial<Check>) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<Check>(`/checks/${id}/`, payload);
      const index = checks.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        checks.value[index] = data;
      }
      notifySuccess("Check was updated successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeCheck(id: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/checks/${id}/`);
      const index = checks.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        checks.value.splice(index, 1);
      }
      notifySuccess("Check was removed successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function resetCheck(id: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<Check>(`/checks/${id}/reset/`);
      const index = checks.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        checks.value[index] = data;
      }
      notifySuccess("Check has been reset.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function getCheckHistory(checkResultId: number, timeFilter: number) {
    isLoading.value = true;
    try {
      const { data } = await axios.patch(`/checks/${checkResultId}/history/`, { timeFilter });
      console.log(data);
      return Object.freeze(data);
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    checks,
    isLoading,
    isError,
    getAgentChecks,
    resetAllAgentChecks,
    runAgentChecks,
    addCheck,
    updateCheck,
    removeCheck,
    resetCheck,
    getCheckHistory,
  };
}
