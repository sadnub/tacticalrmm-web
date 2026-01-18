import { ref } from "vue";
import axios from "axios";
import type { AutomatedTask, AutomatedTaskUI } from "./types";
import { convertFromBitArray, convertToBitArray, formatDateInputField } from "src/utils/format";
import { notifySuccess } from "src/utils/notify";
import { useCachedAction } from "../dashboard/composables";

// Lazy singleton
let taskStoreInstance: ReturnType<typeof createTaskStore> | null = null;

export function useTaskStore() {
  if (!taskStoreInstance) {
    taskStoreInstance = createTaskStore();
  }
  return taskStoreInstance;
}

export function processTaskDatafromDB(task: AutomatedTask): AutomatedTaskUI {
  return {
    ...task,
    id: task.id,
    name: task.name,
    task_type: task.task_type === "monthlydow" ? "monthly" : task.task_type,
    monthly_type:
      task.task_type === "monthlydow" ? "weeks" : task.task_type === "monthly" ? "days" : "days",

    run_time_bit_weekdays: convertToBitArray(task.run_time_bit_weekdays || 0),
    monthly_months_of_year: convertToBitArray(task.monthly_months_of_year || 0),
    monthly_days_of_month: convertToBitArray(task.monthly_days_of_month || 0),
    monthly_weeks_of_month: convertToBitArray(task.monthly_weeks_of_month || 0),

    run_time_date: formatDateInputField(task.run_time_date, true),
    expire_date: task.expire_date ? formatDateInputField(task.expire_date, true) : null,
  } as AutomatedTaskUI;
}

export function processTaskDataforDB(task: AutomatedTaskUI): AutomatedTask {
  return {
    ...task,
    id: task.id,
    name: task.name,
    task_type:
      task.task_type === "monthly" && task.monthly_type === "weeks" ? "monthlydow" : task.task_type,
    run_time_bit_weekdays: convertFromBitArray(task.run_time_bit_weekdays),
    monthly_months_of_year: convertFromBitArray(task.monthly_months_of_year),
    monthly_days_of_month: convertFromBitArray(task.monthly_days_of_month),
    monthly_weeks_of_month: convertFromBitArray(task.monthly_weeks_of_month),

    run_time_date: (task.run_time_date += "Z"),
    expire_date: task.expire_date ? (task.expire_date += "Z") : undefined,
  } as AutomatedTask;
}

function createTaskStore() {
  const tasks = ref<AutomatedTaskUI[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _getAgentTasks(agentId: string, _args?: { force: boolean }) {
    isLoading.value = true;
    isError.value = false;
    tasks.value = [];
    axios
      .get<AutomatedTask[]>(`/agents/${agentId}/tasks/`)
      .then(({ data }) => {
        tasks.value = data
          .filter((task) => {
            if (!task.task_result) return true;
            else return task.task_result.sync_status !== "pendingdeletion";
          })
          .map((task) => processTaskDatafromDB(task));
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getAgentTasks = useCachedAction(_getAgentTasks, {
    key: "getAgentTasks",
    duration: 1 * 30 * 1000,
  });

  async function addTask(payload: AutomatedTaskUI) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<AutomatedTask>("/tasks/", processTaskDataforDB(payload));
      tasks.value.push(processTaskDatafromDB(data));
      notifySuccess("Task added successfully");
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateTask(id: number, payload: AutomatedTaskUI) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<AutomatedTask>(
        `/tasks/${id}/`,
        processTaskDataforDB(payload),
      );
      const index = tasks.value.findIndex((task) => task.id === id);
      if (index !== -1) tasks.value[index] = processTaskDatafromDB(data);

      notifySuccess("Task updated successfully");
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateTaskPartial(id: number, payload: Partial<AutomatedTaskUI>) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<AutomatedTask>(`/tasks/${id}/`, payload);
      const index = tasks.value.findIndex((task) => task.id === id);
      if (index !== -1) tasks.value[index] = processTaskDatafromDB(data);
      notifySuccess("Task updated successfully");
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeTask(id: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/tasks/${id}/`);
      tasks.value = tasks.value.filter((task) => task.id !== id);
      notifySuccess("Task removed successfully");
    } catch {
      isError.value = true;
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
        notifySuccess("Task run initiated successfully. Task will run if the agent is online.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  return {
    tasks,
    isLoading,
    isError,
    getAgentTasks,
    addTask,
    updateTask,
    updateTaskPartial,
    removeTask,
    runTask,
  };
}
