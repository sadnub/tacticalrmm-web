import { ref } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import type { Check } from "../checks/types";
import type { Policy, ResetPatchPolicyRequest, WinPatchPolicy } from "./types";

export const usePolicyStore = defineStore("policies", () => {
  const policies = ref<Policy[]>([]);
  const policyChecks = ref<Check[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getPolicies() {
    isLoading.value = true;
    isError.value = true;

    axios
      .get<Policy[]>("automation/policies/")
      .then(({ data }) => {
        policies.value = data;
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

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
    policies,
    policyChecks,
    getPolicies,
    getPolicyChecks,
    isLoading,
    isError,
  };
});

export const usePatchPolicyStore = defineStore("patchPolicies", () => {
  const isLoading = ref(false);
  const isError = ref(false);

  async function getPatchPolicy(id: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.get<WinPatchPolicy>(`/automation/patchpolicy/${id}/`);
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function addPatchPolicy(policy: WinPatchPolicy) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<WinPatchPolicy>("/automation/patchpolicy/", policy);
      return data;
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updatePatchPolicy(policy: WinPatchPolicy) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<WinPatchPolicy>(
        `/automation/patchpolicy/${policy.id}/`,
        policy,
      );
      return data;
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deletePatchPolicy(id: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/automation/patchpolicy/${id}/`);
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    addPatchPolicy,
    updatePatchPolicy,
    deletePatchPolicy,
    isLoading,
    isError,
    getPatchPolicy,
  };
});

export async function sendPatchPolicyReset(payload: ResetPatchPolicyRequest) {
  const { data } = await axios.post(`/automation/patchpolicy/reset/`, payload);
  return data;
}
