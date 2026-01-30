import { ref } from "vue";
import axios from "axios";
import type { Check } from "../checks/types";
import type { Policy, ResetPatchPolicyRequest, WinPatchPolicy, PolicyRelated } from "./types";
import { notifySuccess } from "src/utils/notify";
import { useCachedAction } from "../dashboard/composables";
import { processTaskDatafromDB, processTaskDataforDB } from "../tasks/api";
import type { AutomatedTask, AutomatedTaskUI } from "../tasks/types";

// Lazy singletons
let policyStoreInstance: ReturnType<typeof createPolicyStore> | null = null;
let policyChecksStoreInstance: ReturnType<typeof createPolicyChecksStore> | null = null;
let policyTasksStoreInstance: ReturnType<typeof createPolicyTasksStore> | null = null;
let patchPolicyStoreInstance: ReturnType<typeof createPatchPolicyStore> | null = null;

export function usePolicyStore() {
  if (!policyStoreInstance) {
    policyStoreInstance = createPolicyStore();
  }
  return policyStoreInstance;
}

export function usePolicyChecksStore() {
  if (!policyChecksStoreInstance) {
    policyChecksStoreInstance = createPolicyChecksStore();
  }
  return policyChecksStoreInstance;
}

export function usePolicyTasksStore() {
  if (!policyTasksStoreInstance) {
    policyTasksStoreInstance = createPolicyTasksStore();
  }
  return policyTasksStoreInstance;
}

export function usePatchPolicyStore() {
  if (!patchPolicyStoreInstance) {
    patchPolicyStoreInstance = createPatchPolicyStore();
  }
  return patchPolicyStoreInstance;
}

function createPolicyStore() {
  const policies = ref<Policy[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function _getPolicies() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<Policy[]>("automation/policies/")
      .then(({ data }) => {
        policies.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getPolicies = useCachedAction(_getPolicies, {
    key: "getPolicies",
    duration: 1 * 30 * 1000, // 30 seconds cache
  });

  async function addPolicy(payload: Policy, copyId?: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      const requestData = copyId ? { ...payload, copyId } : payload;
      const { data } = await axios.post<Policy>("automation/policies/", requestData);
      policies.value.unshift(data);
      notifySuccess("Policy was created successfully.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updatePolicy(id: number, payload: Partial<Policy>) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.put<Policy>(`automation/policies/${id}/`, payload);
      const index = policies.value.findIndex((p) => p.id === id);
      if (index !== -1) policies.value[index] = data;
      notifySuccess("Policy was updated successfully.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function removePolicy(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.delete(`automation/policies/${id}/`);
      const index = policies.value.findIndex((p) => p.id === id);
      if (index !== -1) policies.value.splice(index, 1);
      notifySuccess("Policy was removed successfully.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function getPolicyRelated(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.get<PolicyRelated>(`/automation/policies/${id}/related/`);
      return data;
    } catch {
      isError.value = true;
      return {
        default_server_policy: false,
        default_workstation_policy: false,
        server_clients: [],
        workstation_clients: [],
        server_sites: [],
        workstation_sites: [],
        agents: [],
      };
    } finally {
      isLoading.value = false;
    }
  }

  async function getCheckStatus(checkId: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.get(`/automation/checks/${checkId}/status/`);
      return data;
    } catch {
      isError.value = true;
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function getTaskStatus(taskId: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.get(`/automation/tasks/${taskId}/status/`);
      return data;
    } catch {
      isError.value = true;
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function getPolicyOverview() {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.get("/automation/policies/overview/");
      return data;
    } catch {
      isError.value = true;
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  return {
    policies,
    isLoading,
    isError,
    getPolicies,
    addPolicy,
    updatePolicy,
    removePolicy,
    getPolicyRelated,
    getCheckStatus,
    getTaskStatus,
    getPolicyOverview,
  };
}

function createPolicyChecksStore() {
  const policyChecks = ref<Check[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function _getPolicyChecks(policyId: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<Check[]>(`automation/policies/${policyId}/checks/`)
      .then(({ data }) => {
        policyChecks.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getPolicyChecks = useCachedAction(_getPolicyChecks, {
    key: "getPolicyChecks",
    duration: 30 * 1000, // 30 seconds cache
  });

  async function addCheck(check: Check) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.post<Check>("/checks/", check);
      policyChecks.value.push(data);
      notifySuccess("Check added successfully");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateCheck(id: number, check: Partial<Check>) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.put<Check>(`/checks/${id}/`, check);

      // Update local policy checks array
      const index = policyChecks.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        policyChecks.value[index] = data;
      }
      notifySuccess("Check updated successfully");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeCheck(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.delete(`/checks/${id}/`);

      // Update local policy checks array
      const index = policyChecks.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        policyChecks.value.splice(index, 1);
      }
      notifySuccess("Check removed successfully");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    policyChecks,
    isLoading,
    isError,
    getPolicyChecks,
    addCheck,
    updateCheck,
    removeCheck,
  };
}

function createPolicyTasksStore() {
  const policyTasks = ref<AutomatedTaskUI[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function _getPolicyTasks(policyId: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<AutomatedTask[]>(`/automation/policies/${policyId}/tasks/`)
      .then(({ data }) => {
        // Process each task from DB to UI format
        policyTasks.value = data.map((task) => processTaskDatafromDB(task));
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getPolicyTasks = useCachedAction(_getPolicyTasks, {
    key: "getPolicyTasks",
    duration: 30 * 1000, // 30 seconds cache
  });

  async function addTask(task: AutomatedTaskUI) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.post<AutomatedTask>("/tasks/", processTaskDataforDB(task));

      // Update local array with the processed task
      const processedTask = processTaskDatafromDB(data);
      policyTasks.value.push(processedTask);
      notifySuccess("Task added successfully");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateTask(id: number, task: AutomatedTaskUI) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<AutomatedTask>(`/tasks/${id}/`, processTaskDataforDB(task));

      // Update local array
      const index = policyTasks.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        const processedTask = processTaskDatafromDB(data);
        policyTasks.value[index] = processedTask;
      }
      notifySuccess("Task updated successfully");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateTaskPartial(id: number, task: Partial<AutomatedTaskUI>) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<AutomatedTask>(`/tasks/${id}/`, task);

      // Update local array
      const index = policyTasks.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        const processedTask = processTaskDatafromDB(data);
        policyTasks.value[index] = processedTask;
      }
      notifySuccess("Task updated successfully");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeTask(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.delete(`/tasks/${id}/`);

      // Update local array
      const index = policyTasks.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        policyTasks.value.splice(index, 1);
      }
      notifySuccess("Task removed successfully");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  function runTask(id: number, agent_id?: string) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post(`/tasks/${id}/run/`, agent_id ? { agent_id } : {})
      .then(() => {
        notifySuccess("Task execution started");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  return {
    policyTasks,
    isLoading,
    isError,
    getPolicyTasks,
    addTask,
    updateTask,
    updateTaskPartial,
    removeTask,
    runTask,
  };
}

function createPatchPolicyStore() {
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

      // Update the parent policy in the policies store
      if (policy.policy) {
        const { policies } = usePolicyStore();
        const parentPolicy = policies.value.find((p) => p.id === policy.policy);
        if (parentPolicy) {
          parentPolicy.winupdatepolicy = [data];
        }
      }

      notifySuccess("Patch policy was created successfully.");
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

      // Update the parent policy in the policies store
      if (policy.policy) {
        const { policies } = usePolicyStore();
        const parentPolicy = policies.value.find((p) => p.id === policy.policy);
        if (parentPolicy) {
          parentPolicy.winupdatepolicy = [data];
        }
      }

      notifySuccess("Patch policy was updated successfully.");
      return data;
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function deletePatchPolicy(id: number, policyId?: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.delete(`/automation/patchpolicy/${id}/`);

      // Update the parent policy in the policies store
      if (policyId) {
        const { policies } = usePolicyStore();
        const parentPolicy = policies.value.find((p) => p.id === policyId);
        if (parentPolicy) {
          parentPolicy.winupdatepolicy = [];
        }
      }

      notifySuccess("Patch policy was removed successfully.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLoading,
    isError,
    getPatchPolicy,
    addPatchPolicy,
    updatePatchPolicy,
    deletePatchPolicy,
  };
}

export async function sendPatchPolicyReset(payload: ResetPatchPolicyRequest) {
  const { data } = await axios.post(`/automation/patchpolicy/reset/`, payload);
  return data;
}
