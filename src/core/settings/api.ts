import { ref } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import { openURL } from "quasar";
import { useRouter } from "vue-router";
import { notifySuccess } from "src/utils/notify";
import type {
  CustomField,
  URLAction,
  TestRunURLActionRequest,
  TestRunURLActionResponse,
  CoreSettings,
} from "./types";

export const useCoreStore = defineStore("coreSettings", () => {
  const coreSettings = ref<CoreSettings>();
  const isLoading = ref(false);
  const isError = ref(false);

  const router = useRouter();

  function getCoreSettings(params = {}) {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<CoreSettings>("/core/settings/", { params })
      .then(({ data }) => {
        coreSettings.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function checkWebTermPerms() {
    return axios.post<{ message: string }>("/core/webtermperms/");
  }

  function openWebTerminal() {
    const url = router.resolve("/webterm").href;
    openURL(url, undefined, {
      popup: true,
      width: 1280,
      height: 720,
    });
  }

  return {
    coreSettings,
    isLoading,
    isError,
    getCoreSettings,
    checkWebTermPerms,
    openWebTerminal,
  };
});

export const useCustomFieldStore = defineStore("customFields", () => {
  const customFields = ref<CustomField[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getCustomFields(params = {}) {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<CustomField[]>("/core/customfields/", { params })
      .then(({ data }) => {
        customFields.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  return {
    customFields,
    isLoading,
    isError,
    getCustomFields,
  };
});

export interface RunURLActionRequest {
  agent_id?: string;
  client?: number;
  site?: number;
  action: number;
}

export const useURLActionStore = defineStore("urlActions", () => {
  const urlActions = ref<URLAction[]>([]);
  const testURLActionResult = ref<TestRunURLActionResponse | null>(null);
  const isLoading = ref(false);
  const isError = ref(false);

  function getURLActions(params = {}) {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<URLAction[]>("/core/urlaction/", { params })
      .then(({ data }) => {
        urlActions.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function saveURLAction(action: URLAction) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post<URLAction>("/core/urlaction/", action)
      .then(({ data: newAction }) => {
        urlActions.value.unshift(newAction);
        notifySuccess("URL Action saved successfully.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function editURLAction(id: number, action: URLAction) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put<URLAction>(`/core/urlaction/${id}/`, action)
      .then(({ data: updatedAction }) => {
        const index = urlActions.value.findIndex((a) => a.id === id);
        if (index !== -1) {
          urlActions.value[index] = updatedAction;
        }
        notifySuccess("URL Action updated successfully.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function removeURLAction(id: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`/core/urlaction/${id}/`)
      .then(() => {
        const index = urlActions.value.findIndex((a) => a.id === id);
        if (index !== -1) {
          urlActions.value.splice(index, 1);
        }
        notifySuccess("URL Action removed successfully.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function runURLAction(payload: RunURLActionRequest) {
    isLoading.value = true;
    isError.value = false;
    axios
      .patch<string>("/core/urlaction/run/", payload)
      .then(({ data }) => {
        openURL(data);
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function runTestURLAction(payload: TestRunURLActionRequest) {
    isLoading.value = true;
    isError.value = false;
    testURLActionResult.value = null;
    axios
      .post<TestRunURLActionResponse>("/core/urlaction/run/test/", payload)
      .then(({ data }) => {
        testURLActionResult.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  return {
    urlActions,
    testURLActionResult,
    isLoading,
    isError,
    getURLActions,
    saveURLAction,
    editURLAction,
    removeURLAction,
    runURLAction,
    runTestURLAction,
  };
});
