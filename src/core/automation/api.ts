import { ref } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import type { Check } from "../checks/types";

export const usePolicyStore = defineStore("policies", () => {
  const policyChecks = ref<Check[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getPolicyChecks(id: number) {
    isLoading.value = true;
    isError.value = true;
    policyChecks.value = [];

    axios
      .get<Check[]>(`automation/policies/${id}/checks/`)
      .then(({ data }) => {
        policyChecks.value = data;
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  return {
    policyChecks,
    getPolicyChecks,
    isLoading,
    isError,
  };
});
