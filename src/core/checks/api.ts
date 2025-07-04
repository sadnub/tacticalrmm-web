import { ref } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import { notifySuccess } from "src/utils/notify";
import type { Check } from "./types";

export const useCheckStore = defineStore("checks", () => {
  const checks = ref<Check[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getChecks() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<Check[]>(`/checks/`)
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

  function addCheck(payload: Omit<Check, "id">) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post<Check>(`/checks/`, payload)
      .then(({ data: newCheck }) => {
        checks.value.unshift(newCheck);
        notifySuccess("Check was created successfully.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateCheck(id: number, payload: Partial<Check>) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put<Check>(`/checks/${id}/`, payload)
      .then(({ data: updatedCheck }) => {
        const index = checks.value.findIndex((c) => c.id === id);
        if (index !== -1) {
          checks.value[index] = updatedCheck;
        }
        notifySuccess("Check was updated successfully.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function removeCheck(id: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`/checks/${id}/`)
      .then(() => {
        const index = checks.value.findIndex((c) => c.id === id);
        if (index !== -1) {
          checks.value.splice(index, 1);
        }
        notifySuccess("Check was removed successfully.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function resetCheck(id: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post<Check>(`/checks/${id}/reset/`)
      .then(({ data: updatedCheck }) => {
        const index = checks.value.findIndex((c) => c.id === id);
        if (index !== -1) {
          checks.value[index] = updatedCheck;
        }
        notifySuccess("Check has been reset.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  async function getCheckHistory(checkResultId: number, timeFilter: number) {
    isLoading.value = true;
    try {
      const { data } = await axios.patch(`/checks/${checkResultId}/history/`, { timeFilter });
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
    getChecks,
    addCheck,
    updateCheck,
    removeCheck,
    resetCheck,
    getCheckHistory,
  };
});
