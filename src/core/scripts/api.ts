import { ref } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import { notifySuccess } from "src/utils/notify";
import type { Script } from "./types";

const baseUrl = "/scripts";

export const useScriptStore = defineStore("scripts", () => {
  const scripts = ref<Script[]>([]);
  const scriptTestResult = ref<any>(null); // Use a more specific type if available
  const isLoading = ref(false);
  const isError = ref(false);

  function getScripts(params = {}) {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<Script[]>(`${baseUrl}/`, { params })
      .then(({ data }) => {
        scripts.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function testScript(agent_id: string, payload: any) {
    isLoading.value = true;
    isError.value = false;
    scriptTestResult.value = null;

    return axios
      .post(`${baseUrl}/${agent_id}/test/`, payload)
      .then(({ data }) => {
        scriptTestResult.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function testScriptOnServer(payload: any) {
    isLoading.value = true;
    isError.value = false;
    scriptTestResult.value = null;

    return axios
      .post("/core/serverscript/test/", payload)
      .then(({ data }) => {
        scriptTestResult.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function addScript(payload: Omit<Script, "id">) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post<Script>(`${baseUrl}/`, payload)
      .then(({ data: newScript }) => {
        scripts.value.unshift(newScript);
        notifySuccess("Script was created successfully.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateScript(payload: Script) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put<Script>(`${baseUrl}/${payload.id}/`, payload)
      .then(({ data: updatedScript }) => {
        const index = scripts.value.findIndex((s) => s.id === payload.id);
        if (index !== -1) {
          scripts.value[index] = updatedScript;
        }
        notifySuccess("Script was updated successfully.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function removeScript(id: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`${baseUrl}/${id}/`)
      .then(() => {
        const index = scripts.value.findIndex((s) => s.id === id);
        if (index !== -1) {
          scripts.value.splice(index, 1);
        }
        notifySuccess("Script was removed successfully.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function downloadScript(id: number, fileName: string) {
    isLoading.value = true;
    isError.value = false;
    axios
      .get(`${baseUrl}/${id}/download/`, { responseType: "blob" })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  return {
    scripts,
    scriptTestResult,
    isLoading,
    isError,
    getScripts,
    testScript,
    testScriptOnServer,
    addScript,
    updateScript,
    removeScript,
    downloadScript,
  };
});
