import { computed, ref } from "vue";
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
  APIKey,
  CustomFieldModel,
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

export const useCustomFieldStore = defineStore(
  "customFields",
  () => {
    const customFields = ref<CustomField[]>([]);
    const isLoading = ref(false);
    const isError = ref(false);

    function getCustomFields(model?: CustomFieldModel) {
      isLoading.value = true;
      isError.value = false;
      axios
        .get<CustomField[]>("/core/customfields/", { params: { model: model } })
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

    const clientCustomFields = computed(() =>
      customFields.value.filter((field) => !field.hide_in_ui && field.model === "client"),
    );

    const agentCustomFields = computed(() =>
      customFields.value.filter((field) => !field.hide_in_ui && field.model === "agent"),
    );

    const siteCustomFields = computed(() =>
      customFields.value.filter((field) => !field.hide_in_ui && field.model === "site"),
    );

    return {
      customFields,
      isLoading,
      isError,
      getCustomFields,
      clientCustomFields,
      agentCustomFields,
      siteCustomFields,
    };
  },
  {
    cache: {
      getCustomFields: {
        duration: 30 * 60 * 1000,
      },
    },
  },
);

export interface RunURLActionRequest {
  agent_id?: string;
  client?: number;
  site?: number;
  action: number;
}

export const useURLActionStore = defineStore(
  "urlActions",
  () => {
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
          urlActions.value = data.sort((a, b) => a.name.localeCompare(b.name));
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    const webActions = computed(() =>
      urlActions.value.filter((action) => action.action_type === "web"),
    );
    const restActions = computed(() =>
      urlActions.value.filter((action) => action.action_type === "rest"),
    );

    function addURLAction(action: URLAction) {
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

    function updateURLAction(id: number, action: URLAction) {
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

    function runURLAction(actionId: number, model: string, modelId: number | string) {
      isLoading.value = true;
      isError.value = false;
      axios
        .patch<string>("/core/urlaction/run/", { [model]: modelId, action: actionId })
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
      webActions,
      restActions,
      testURLActionResult,
      isLoading,
      isError,
      getURLActions,
      addURLAction,
      updateURLAction,
      removeURLAction,
      runURLAction,
      runTestURLAction,
    };
  },
  {
    cache: {
      getURLActions: {
        duration: 1 * 60 * 1000,
      },
    },
  },
);

export const useAPIKeyStore = defineStore(
  "apiKeys",
  () => {
    const apiKeys = ref<APIKey[]>([]);
    const isLoading = ref(false);
    const isError = ref(false);

    async function getAPIKeys() {
      isLoading.value = true;
      isError.value = false;
      try {
        const { data } = await axios.get<APIKey[]>(`/accounts//apikeys/`);
        apiKeys.value = data;
      } catch {
        isError.value = true;
      } finally {
        isLoading.value = false;
      }
    }

    async function addAPIKey(newAPIKey: Omit<APIKey, "id">) {
      isLoading.value = true;
      isError.value = false;
      try {
        const { data } = await axios.post<APIKey>(`/accounts/apikeys/`, newAPIKey);
        apiKeys.value.push(data);
      } catch {
        isError.value = true;
      } finally {
        isLoading.value = false;
      }
    }

    async function updateAPIKey(id: number, updatedAPIKey: Partial<APIKey>) {
      isLoading.value = true;
      isError.value = false;
      try {
        const { data } = await axios.put<APIKey>(`/accounts/apikeys/${id}/`, updatedAPIKey);
        const index = apiKeys.value.findIndex((key) => key.id === id);
        if (index !== -1) {
          apiKeys.value[index] = data;
        }
      } catch {
        isError.value = true;
      } finally {
        isLoading.value = false;
      }
    }

    async function removeAPIKey(id: number) {
      isLoading.value = true;
      isError.value = false;
      try {
        await axios.delete(`/accounts/apikeys/${id}/`);
        apiKeys.value = apiKeys.value.filter((key) => key.id !== id);
      } catch {
        isError.value = true;
      } finally {
        isLoading.value = false;
      }
    }

    return {
      apiKeys,
      isLoading,
      isError,
      getAPIKeys,
      addAPIKey,
      updateAPIKey,
      removeAPIKey,
    };
  },
  {
    cache: {
      getAPIKeys: {
        duration: 1 * 30 * 1000, // 30 seconds
      },
    },
  },
);
