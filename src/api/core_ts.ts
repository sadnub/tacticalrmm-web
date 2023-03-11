import { type Integration } from "@/types/core";
import { type Ref, ref } from "vue";
import axios from "axios";
import { notifySuccess } from "@/utils/notify";

const baseUrl = "/core";

// integration endpoints
export interface InstallResult {
  output: string;
  success: boolean;
}

export interface useIntegrationsApi {
  integrations: Ref<Integration[]>;
  isLoading: Ref<boolean>;
  isError: Ref<boolean>;
  getIntegrations: (onlyEnabled?: boolean) => void;
  addIntegration: (payload: Integration) => void;
  editIntegration: (id: number, payload: Partial<Integration>) => void;
  deleteIntegration: (id: number) => void;
  installIntegration: (id: number) => Promise<InstallResult>;
  getIntegrationFrontend: (id: number) => Promise<string | null>;
}

export function useIntegrationsApi(): useIntegrationsApi {
  const integrations = ref<Integration[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getIntegrations(onlyEnabled = false) {
    isError.value = false;

    const params = onlyEnabled ? { onlyEnabled: true } : {};
    axios
      .get(`${baseUrl}/integrations/`, { params: params })
      .then(({ data }) => {
        isLoading.value = true;
        integrations.value = data;
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function addIntegration(payload: Integration) {
    isError.value = false;
    axios
      .post(`${baseUrl}/integrations/`, payload)
      .then(({ data }: { data: Integration }) => {
        isLoading.value = true;
        integrations.value.push(data);
        notifySuccess("Integration was added successfully");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function editIntegration(id: number, payload: Partial<Integration>) {
    isError.value = false;
    axios
      .put(`${baseUrl}/integrations/${id}/`, payload)
      .then(({ data }: { data: Integration }) => {
        isLoading.value = true;
        const index = integrations.value.findIndex(
          (integration) => integration.id === id
        );
        integrations.value[index] = data;
        notifySuccess("Integration was edited successfully");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function deleteIntegration(id: number) {
    isError.value = false;
    axios
      .delete(`${baseUrl}/integrations/${id}/`)
      .then(() => {
        integrations.value = integrations.value.filter(
          (integration) => integration.id != id
        );
        notifySuccess("Integration was successfully removed");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  async function installIntegration(id: number): Promise<InstallResult> {
    isError.value = false;
    try {
      const { data } = await axios.post(
        `${baseUrl}/integrations/${id}/install/`
      );
      const index = integrations.value.findIndex(
        (integration) => integration.id === id
      );
      // TODO: get version number and update that as well
      integrations.value[index].enabled = true;

      data.success
        ? notifySuccess("Integration was successfully installed")
        : undefined;

      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }

    return { output: "", success: false };
  }

  async function getIntegrationFrontend(id: number): Promise<string | null> {
    isError.value = false;
    try {
      const { data } = await axios.get(
        `${baseUrl}/integrations/${id}/frontend/`
      );

      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }

    return null;
  }

  return {
    integrations,
    isLoading,
    isError,
    getIntegrations,
    addIntegration,
    editIntegration,
    deleteIntegration,
    installIntegration,
    getIntegrationFrontend,
  };
}

// Use if you want the state to be consistent across components
export const useSharedIntegrationsApi = useIntegrationsApi();
