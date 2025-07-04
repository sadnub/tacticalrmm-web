import { ref } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import type { AutomatedTask, AutomatedTaskUI } from "./types";
import { convertFromBitArray, convertToBitArray, formatDateInputField } from "src/utils/format";

const baseUrl = "/tasks";

export function processTaskDatafromDB(task: AutomatedTask): AutomatedTaskUI {
  return {
    ...task,
    id: task.id,
    name: task.name,
    task_type: task.task_type === "monthlydow" ? "monthly" : task.task_type,
    monthly_type:
      task.task_type === "monthlydow" ? "weeks" : task.task_type === "monthly" ? "days" : "days",

    run_time_bit_weekdays: convertToBitArray(task.run_time_bit_weekdays),
    monthly_months_of_year: convertToBitArray(task.monthly_months_of_year),
    monthly_days_of_month: convertToBitArray(task.monthly_days_of_month),
    monthly_weeks_of_month: convertToBitArray(task.monthly_weeks_of_month),

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

export const useTaskStore = defineStore("tasks", () => {
  const tasks = ref<AutomatedTaskUI[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getTasks() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<AutomatedTask[]>(`${baseUrl}/`)
      .then(({ data }) => {
        tasks.value = data.map((task) => processTaskDatafromDB(task));
      })
      .catch((e) => {
        isError.value = true;
        console.error(e);
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function addTask(payload: AutomatedTaskUI) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post<AutomatedTask>(`${baseUrl}/`, processTaskDataforDB(payload))
      .then(({ data: newTask }) => {
        tasks.value.push(processTaskDatafromDB(newTask));
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateTask(id: number, payload: AutomatedTaskUI) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put<AutomatedTask>(`${baseUrl}/${id}/`, processTaskDataforDB(payload))
      .then(({ data: updatedTask }) => {
        const index = tasks.value.findIndex((task) => task.id === id);
        if (index !== -1) {
          tasks.value[index] = processTaskDatafromDB(updatedTask);
        }
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateTaskPartial(id: number, payload: Partial<AutomatedTaskUI>) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put<AutomatedTask>(`${baseUrl}/${id}/`, payload)
      .then(({ data: updatedTask }) => {
        const index = tasks.value.findIndex((task) => task.id === id);
        if (index !== -1) {
          tasks.value[index] = processTaskDatafromDB(updatedTask);
        }
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function removeTask(id: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`${baseUrl}/${id}/`)
      .then(() => {
        tasks.value = tasks.value.filter((task) => task.id !== id);
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function runTask(id: number, agent_id?: string) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post(`${baseUrl}/${id}/run/`, agent_id ? { agent_id } : {})
      .then(({ data: updatedTask }) => {
        const index = tasks.value.findIndex((task) => task.id === id);
        if (index !== -1) {
          tasks.value[index] = updatedTask;
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
    tasks,
    isLoading,
    isError,
    getTasks,
    addTask,
    updateTask,
    updateTaskPartial,
    removeTask,
    runTask,
  };
});
