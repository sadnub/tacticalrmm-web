import { ref } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import { notifySuccess } from "src/utils/notify";

import type { Script, ScriptSnippet, ScriptResult } from "./types";
import { exportFile } from "quasar";

export const useScriptStore = defineStore(
  "scripts",
  () => {
    const scripts = ref<Script[]>([]);
    const scriptTestResult = ref<ScriptResult | null>(null);
    const isLoading = ref(false);
    const isError = ref(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function getScripts(_args: { force: boolean }) {
      isLoading.value = true;
      isError.value = false;

      axios
        .get<Script[]>(`/scripts/`)
        .then(({ data }) => {
          scripts.value = data.sort((a, b) => a.name.localeCompare(b.name));
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function testScript(agent_id: string, payload: Partial<Script>) {
      isLoading.value = true;
      isError.value = false;
      scriptTestResult.value = null;

      return axios
        .post(`/scripts/${agent_id}/test/`, payload)
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

    function testScriptOnServer(payload: Partial<Script>) {
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
        .post<Script>(`/scripts/`, payload)
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

    function updateScript(id: number, payload: Partial<Script>) {
      isLoading.value = true;
      isError.value = false;
      axios
        .put<Script>(`/scripts/${id}/`, payload)
        .then(({ data: updatedScript }) => {
          const index = scripts.value.findIndex((s) => s.id === id);
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
        .delete(`/scripts/${id}/`)
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

    interface ScriptContentResponse {
      code: string;
      filename: string;
    }

    function getScriptContents(id: number, withSnippets: boolean): Promise<string> {
      isLoading.value = true;
      isError.value = false;
      return axios
        .get<ScriptContentResponse>(`/scripts/${id}/download/`, {
          params: { with_snippets: withSnippets },
        })
        .then(({ data }) => {
          return data.code;
        })
        .catch(() => {
          isError.value = true;
          return "";
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function downloadScript(id: number) {
      isLoading.value = true;
      isError.value = false;
      axios
        .get<ScriptContentResponse>(`/scripts/${id}/download/`, { responseType: "blob" })
        .then(({ data }) => {
          exportFile(data.filename, new Blob([data.code]), {
            mimeType: "text/plain;charset=utf-8",
          });
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
      getScriptContents,
      testScript,
      testScriptOnServer,
      addScript,
      updateScript,
      removeScript,
      downloadScript,
    };
  },
  {
    cache: {
      getScripts: {
        duration: 1 * 60 * 1000,
      },
    },
  },
);

export const useScriptSnippetStore = defineStore(
  "scriptSnippets",
  () => {
    const snippets = ref<ScriptSnippet[]>([]);
    const selectedSnippet = ref<ScriptSnippet | null>(null);
    const isLoading = ref(false);
    const isError = ref(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function getScriptSnippets(_args: { force: boolean }) {
      isLoading.value = true;
      isError.value = false;
      axios
        .get<ScriptSnippet[]>(`/scripts/snippets/`)
        .then((response) => {
          snippets.value = response.data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function addScriptSnippet(payload: ScriptSnippet) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post<ScriptSnippet>(`/scripts/snippets/`, payload)
        .then((response) => {
          snippets.value.unshift(response.data);
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function getScriptSnippet(id: number) {
      isLoading.value = true;
      isError.value = false;
      axios
        .get<ScriptSnippet>(`/scripts/snippets/${id}/`)
        .then((response) => {
          selectedSnippet.value = response.data;
        })
        .catch(() => {
          isError.value = true;
          selectedSnippet.value = null;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function updateScriptSnippet(payload: ScriptSnippet) {
      isLoading.value = true;
      isError.value = false;
      axios
        .put<ScriptSnippet>(`/scripts/snippets/${payload.id}/`, payload)
        .then((response) => {
          const index = snippets.value.findIndex((s) => s.id === payload.id);
          if (index !== -1) {
            snippets.value[index] = response.data;
          }
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function removeScriptSnippet(id: number) {
      isLoading.value = true;
      isError.value = false;
      axios
        .delete(`/scripts/snippets/${id}/`)
        .then(() => {
          const index = snippets.value.findIndex((s) => s.id === id);
          if (index !== -1) {
            snippets.value.splice(index, 1);
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
      snippets,
      selectedSnippet,
      isLoading,
      isError,
      getScriptSnippets,
      addScriptSnippet,
      updateScriptSnippet,
      getScriptSnippet,
      removeScriptSnippet,
    };
  },
  {
    cache: {
      getScriptSnippets: {
        duration: 30 * 1000,
      },
    },
  },
);
