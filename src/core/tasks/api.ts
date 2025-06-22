import { ref } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import type { AutomatedTask } from "./types";

const baseUrl = "/tasks";

export const useTaskStore = defineStore("tasks", () => {
  const tasks = ref<AutomatedTask[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getTasks() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get(`${baseUrl}/`)
      .then(({ data }) => {
        tasks.value = data;
      })
      .catch((e) => {
        isError.value = true;
        console.error(e);
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function createTask(payload: Omit<AutomatedTask, "id">) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post<AutomatedTask>(`${baseUrl}/`, payload)
      .then(({ data: newTask }) => {
        tasks.value.push(newTask);
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateTask(id: number, payload: Partial<AutomatedTask>) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put<AutomatedTask>(`${baseUrl}/${id}/`, payload)
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
    createTask,
    updateTask,
    removeTask,
    runTask,
  };
});
