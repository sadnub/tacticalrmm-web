import { ref } from "vue";
import axios from "axios";
import { useCachedAction } from "../dashboard/composables";
import { notifySuccess } from "src/utils/notify";

import type { Script, ScriptSnippet, ScriptResult } from "./types";
import { exportFile } from "quasar";

export function useScriptStore() {
  const scripts = ref<Script[]>([]);
  const scriptTestResult = ref<ScriptResult | null>(null);
  const isLoading = ref(false);
  const isError = ref(false);

  function _getScripts() {
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

  const getScripts = useCachedAction(_getScripts, {
    key: "getScripts",
    duration: 1 * 60 * 1000, // 1 minute cache
  });

  async function testScript(
    agent_id: string,
    payload: Partial<Script>,
  ): Promise<ScriptResult | null> {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<ScriptResult>(`/scripts/${agent_id}/test/`, payload);
      return data;
    } catch {
      isError.value = true;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function testScriptOnServer(payload: Partial<Script>): Promise<ScriptResult | null> {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<ScriptResult>("/core/serverscript/test/", payload);
      return data;
    } catch {
      isError.value = true;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function addScript(payload: Omit<Script, "id">) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data: newScript } = await axios.post<Script>(`/scripts/`, payload);
      scripts.value.unshift(newScript);
      notifySuccess("Script was created successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateScript(id: number, payload: Partial<Script>) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data: updatedScript } = await axios.put<Script>(`/scripts/${id}/`, payload);
      const index = scripts.value.findIndex((s) => s.id === id);
      if (index !== -1) {
        scripts.value[index] = updatedScript;
      }
      notifySuccess("Script was updated successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeScript(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.delete(`/scripts/${id}/`);
      const index = scripts.value.findIndex((s) => s.id === id);
      if (index !== -1) {
        scripts.value.splice(index, 1);
      }
      notifySuccess("Script was removed successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  interface ScriptContentResponse {
    code: string;
    filename: string;
  }

  async function getScriptContents(id: number, withSnippets: boolean): Promise<string> {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.get<ScriptContentResponse>(`/scripts/${id}/download/`, {
        params: { with_snippets: withSnippets },
      });
      return data.code;
    } catch {
      isError.value = true;
      return "";
    } finally {
      isLoading.value = false;
    }
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
}

export function useScriptSnippetStore() {
  const snippets = ref<ScriptSnippet[]>([]);
  const selectedSnippet = ref<ScriptSnippet | null>(null);
  const isLoading = ref(false);
  const isError = ref(false);

  function _getScriptSnippets() {
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

  const getScriptSnippets = useCachedAction(_getScriptSnippets, {
    key: "getScriptSnippets",
    duration: 1 * 60 * 1000, // 1 minute cache
  });

  async function addScriptSnippet(payload: ScriptSnippet) {
    isLoading.value = true;
    isError.value = false;
    try {
      const response = await axios.post<ScriptSnippet>(`/scripts/snippets/`, payload);
      snippets.value.unshift(response.data);
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function getScriptSnippet(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      const response = await axios.get<ScriptSnippet>(`/scripts/snippets/${id}/`);
      selectedSnippet.value = response.data;
    } catch {
      isError.value = true;
      selectedSnippet.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateScriptSnippet(payload: ScriptSnippet) {
    isLoading.value = true;
    isError.value = false;
    try {
      const response = await axios.put<ScriptSnippet>(`/scripts/snippets/${payload.id}/`, payload);
      const index = snippets.value.findIndex((s) => s.id === payload.id);
      if (index !== -1) {
        snippets.value[index] = response.data;
      }
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeScriptSnippet(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.delete(`/scripts/snippets/${id}/`);
      const index = snippets.value.findIndex((s) => s.id === id);
      if (index !== -1) {
        snippets.value.splice(index, 1);
      }
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
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
}
