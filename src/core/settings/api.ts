import { computed, ref } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import { openURL, Loading } from "quasar";
import { router } from "src/router";
import { notifySuccess } from "src/utils/notify";
import type {
  CustomField,
  URLAction,
  TestRunURLActionRequest,
  TestRunURLActionResponse,
  CoreSettings,
  APIKey,
  CustomFieldModel,
  GlobalKey,
  ServerMaintenanceRequest,
} from "./types";
import { useCachedAction } from "../dashboard/composables";

export function useCoreStore() {
  const coreSettings = ref<CoreSettings>();
  const isLoading = ref(false);
  const isError = ref(false);

  function _getCoreSettings() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<CoreSettings>("/core/settings/")
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

  const getCoreSettings = useCachedAction(_getCoreSettings, {
    key: "getCoreSettings",
    duration: 1 * 30 * 1000,
  });

  async function updateCoreSettings(
    settings: Partial<CoreSettings>,
    emailTest = false,
    smsTest = false,
  ) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<CoreSettings>("/core/settings/", settings);
      coreSettings.value = data;
      notifySuccess("Core Settings updated successfully.");

      if (emailTest) {
        Loading.show({ message: "Sending test email..." });

        try {
          await testEmailSettings();
        } catch {
          isError.value = true;
        } finally {
          Loading.hide();
        }
      } else if (smsTest) {
        Loading.show({ message: "Sending test SMS..." });

        try {
          await testSmsSettings();
        } catch {
          isError.value = true;
        } finally {
          Loading.hide();
        }
      }
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function testEmailSettings() {
    return axios.post<{ message: string }>("/core/emailtest/");
  }

  async function testSmsSettings() {
    return axios.post<{ message: string }>("/core/smstest/");
  }

  async function runServerMaintenace(payload: ServerMaintenanceRequest) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post("/core/servermaintenance/", payload);
      notifySuccess("Maintenance operations executed successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function clearCache() {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post("/core/clearcache/");
      notifySuccess("Cache was cleared successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    coreSettings,
    isLoading,
    isError,
    getCoreSettings,
    updateCoreSettings,
    runServerMaintenace,
    clearCache,
  };
}

export async function checkWebTermPerms() {
  const { data } = await axios.post<{
    message: string;
    status: number;
  }>("/core/webtermperms/");

  return data;
}

export function openWebTerminal() {
  const url = router.resolve("/webterm").href;
  openURL(url, undefined, {
    popup: true,
    width: 1280,
    height: 720,
  });
}

export function useCustomFieldStore() {
  const customFields = ref<CustomField[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function _getCustomFields(model?: CustomFieldModel) {
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

  const getCustomFields = useCachedAction(_getCustomFields, {
    key: "getCustomFields",
    duration: 1 * 30 * 1000,
  });

  const clientCustomFields = computed(() =>
    customFields.value.filter((field) => !field.hide_in_ui && field.model === "client"),
  );

  const agentCustomFields = computed(() =>
    customFields.value.filter((field) => !field.hide_in_ui && field.model === "agent"),
  );

  const siteCustomFields = computed(() =>
    customFields.value.filter((field) => !field.hide_in_ui && field.model === "site"),
  );

  async function addCustomField(action: CustomField) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<CustomField>("/core/customfields/", action);
      customFields.value.unshift(data);
      notifySuccess("Custom Field saved successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateCustomField(id: number, field: CustomField) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<CustomField>(`/core/customfields/${id}/`, field);

      const index = customFields.value.findIndex((a) => a.id === id);
      if (index !== -1) {
        customFields.value[index] = data;
      }
      notifySuccess("Custom Field updated successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeCustomField(id: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/core/customfields/${id}/`);
      const index = customFields.value.findIndex((a) => a.id === id);
      if (index !== -1) {
        customFields.value.splice(index, 1);
      }
      notifySuccess("custom Field removed successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    customFields,
    isLoading,
    isError,
    getCustomFields,
    clientCustomFields,
    agentCustomFields,
    siteCustomFields,
    addCustomField,
    updateCustomField,
    removeCustomField,
  };
}

export function useURLActionStore() {
  const urlActions = ref<URLAction[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function _getURLActions(params = {}) {
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

  const getURLActions = useCachedAction(_getURLActions, {
    key: "getURLActions",
    duration: 1 * 30 * 1000,
  });

  const webActions = computed(() =>
    urlActions.value.filter((action) => action.action_type === "web"),
  );
  const restActions = computed(() =>
    urlActions.value.filter((action) => action.action_type === "rest"),
  );

  async function addURLAction(action: URLAction) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<URLAction>("/core/urlaction/", action);
      urlActions.value.unshift(data);
      notifySuccess("URL Action saved successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateURLAction(id: number, action: URLAction) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<URLAction>(`/core/urlaction/${id}/`, action);
      const index = urlActions.value.findIndex((a) => a.id === id);
      if (index !== -1) {
        urlActions.value[index] = data;
      }
      notifySuccess("URL Action updated successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeURLAction(id: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/core/urlaction/${id}/`);
      const index = urlActions.value.findIndex((a) => a.id === id);
      if (index !== -1) {
        urlActions.value.splice(index, 1);
      }
      notifySuccess("URL Action removed successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    urlActions,
    webActions,
    restActions,
    isLoading,
    isError,
    getURLActions,
    addURLAction,
    updateURLAction,
    removeURLAction,
  };
}

// api requests that don't interact with the store data
export async function runURLAction(actionId: number, model: string, modelId: number | string) {
  return await axios
    .patch<string>("/core/urlaction/run/", { [model]: modelId, action: actionId })
    .then(({ data }) => {
      openURL(data);
    });
}

export async function runTestURLAction(payload: TestRunURLActionRequest) {
  return await axios
    .post<TestRunURLActionResponse>("/core/urlaction/run/test/", payload)
    .then(({ data }) => {
      return data;
    });
}

export const useAPIKeyStore = defineStore(
  "apiKeys",
  () => {
    const apiKeys = ref<APIKey[]>([]);
    const isLoading = ref(false);
    const isError = ref(false);

    function getAPIKeys() {
      isLoading.value = true;
      isError.value = false;

      axios
        .get<APIKey[]>("/accounts/apikeys/")
        .then(({ data }) => {
          apiKeys.value = data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function addAPIKey(newAPIKey: Omit<APIKey, "id">) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post<APIKey>("/accounts/apikeys/", newAPIKey)
        .then(({ data }) => {
          apiKeys.value.push(data);
          notifySuccess("API Key saved successfully.");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function updateAPIKey(id: number, updatedAPIKey: Partial<APIKey>) {
      isLoading.value = true;
      isError.value = false;

      axios
        .put<APIKey>(`/accounts/apikeys/${id}/`, updatedAPIKey)
        .then(({ data }) => {
          const index = apiKeys.value.findIndex((key) => key.id === id);
          if (index !== -1) {
            apiKeys.value[index] = data;
          }
          notifySuccess("API Key updated successfully.");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function removeAPIKey(id: number) {
      isLoading.value = true;
      isError.value = false;

      axios
        .delete(`/accounts/apikeys/${id}/`)
        .then(() => {
          apiKeys.value = apiKeys.value.filter((key) => key.id !== id);
          notifySuccess("API Key removed successfully.");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
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

export const useGlobalKeyStore = defineStore(
  "globalKeyStore",
  () => {
    const keys = ref<GlobalKey[]>([]);
    const isLoading = ref(false);
    const isError = ref(false);

    function getKeys() {
      isLoading.value = true;
      isError.value = false;

      axios
        .get<GlobalKey[]>("/core/keystore/")
        .then(({ data }) => {
          keys.value = data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function addKey(newKey: Omit<GlobalKey, "id">) {
      isLoading.value = true;
      isError.value = false;

      axios
        .post<GlobalKey>("/core/keystore/", newKey)
        .then(({ data }) => {
          keys.value.push(data);
          notifySuccess("Key saved successfully.");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function updateKey(id: number, updatedKey: GlobalKey) {
      isLoading.value = true;
      isError.value = false;

      axios
        .put<GlobalKey>(`/core/keystore/${id}/`, updatedKey)
        .then(({ data }) => {
          const index = keys.value.findIndex((key) => key.id === id);
          if (index !== -1) {
            keys.value[index] = data;
          }

          notifySuccess("Key updated successfully.");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function removeKey(id: number) {
      isLoading.value = true;
      isError.value = false;

      axios
        .delete(`/core/keystore/${id}/`)
        .then(() => {
          keys.value = keys.value.filter((key) => key.id !== id);
          notifySuccess("Key removed successfully.");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    return {
      keys,
      isLoading,
      isError,
      getKeys,
      addKey,
      updateKey,
      removeKey,
    };
  },
  {
    cache: {
      getKeys: {
        duration: 1 * 30 * 1000, // 30 seconds
      },
    },
  },
);

export const useCodeSignStore = defineStore("codeSignStore", () => {
  const token = ref<string | null>(null);
  const isLoading = ref(false);
  const isError = ref(false);

  function getToken() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get("/core/codesign/")
      .then(({ data }) => {
        token.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function removeToken() {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete("/core/codesign/")
      .then(() => {
        token.value = null;
        notifySuccess("Token was deleted!");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function codeSignAgents() {
    isLoading.value = true;
    isError.value = false;
    axios
      .post("/core/codesign/")
      .then(() => {
        notifySuccess("Agents will signed");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateToken(token: string) {
    isError.value = false;
    axios
      .patch("/core/codesign/", { token })
      .then(() => {
        notifySuccess("Token was updated successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  return {
    token,
    isLoading,
    isError,
    getToken,
    removeToken,
    codeSignAgents,
    updateToken,
  };
});
