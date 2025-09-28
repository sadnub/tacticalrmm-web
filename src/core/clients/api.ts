import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { notifySuccess } from "src/utils/notify";
import { useDashboardStore } from "src/stores/dashboard";
import { useCachedAction } from "../dashboard/composables";
import type {
  Client,
  ClientCustomFieldValue,
  Site,
  SiteCustomFieldValue,
  Deployment,
} from "./types";

export function useClientStore() {
  const clients = ref<Client[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  const clientCount = computed(() => clients.value.length);

  const router = useRouter();
  const dashboardStore = useDashboardStore();

  function _getClients() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<Client[]>("/clients/")
      .then(({ data }) => {
        if (data.length === 0) void router.push({ name: "InitialSetup" });
        clients.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getClients = useCachedAction(_getClients, {
    key: "getClients",
    duration: 1 * 60 * 1000, // 1 minute cache
  });

  interface ClientAddRequest {
    client: {
      name: string;
    };
    site: {
      name: string;
    };
    timezone?: string;
    companyname?: string;
    initialsetup?: boolean;
    custom_fields?: ClientCustomFieldValue[];
  }
  async function addClient(payload: ClientAddRequest) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.post<Client>("/clients/", payload);
      clients.value.unshift(data);
      notifySuccess("Client was added successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateClient(id: number, payload: Partial<Client>) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.put<Client>(`/clients/${id}/`, payload);
      const index = clients.value.findIndex((client: Client) => client.id === id);
      if (index !== -1) {
        clients.value[index] = data;
      }
      notifySuccess("Client was modified successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function getClient(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.get<Client>(`/clients/${id}/`);
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeClient(id: number, moveToSite?: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.delete(`/clients/${id}/`, { params: moveToSite ? { move_to_site: id } : {} });
      const index = clients.value.findIndex((client: Client) => client.id === id);
      if (index !== -1) {
        clients.value.splice(index, 1);
      }

      dashboardStore.refreshDashboard();
      notifySuccess("Client was deleted successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    clients,
    isLoading,
    isError,
    clientCount,
    getClients,
    getClient,
    addClient,
    updateClient,
    removeClient,
  };
}

export function useSiteStore() {
  const sites = ref<Site[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  const siteCount = computed(() => sites.value.length);

  const dashboardStore = useDashboardStore();

  function _getSites() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<Site[]>("/clients/sites/")
      .then(({ data }) => {
        sites.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getSites = useCachedAction(_getSites, {
    key: "getSites",
    duration: 1 * 60 * 1000, // 1 minute cache
  });

  interface SiteAddUpdateRequest {
    site: {
      name: string;
      client?: number | undefined;
    };
    custom_fields: SiteCustomFieldValue[];
  }

  async function addSite(payload: SiteAddUpdateRequest) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.post<Site>("/clients/sites/", payload);
      // add new site to this store
      sites.value.unshift(data);

      notifySuccess("Site was added successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateSite(id: number, payload: Partial<Site>) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.put<Site>(`/clients/sites/${id}/`, payload);
      // add to this site store
      const index = sites.value.findIndex((site) => site.id === id);
      if (index !== -1) {
        sites.value[index] = data;
      }

      notifySuccess("Site was modified successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeSite(id: number, moveToSite?: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.delete<Site>(`/clients/sites/${id}/`, {
        params: moveToSite ? { move_to_site: moveToSite } : {},
      });
      const index = sites.value.findIndex((site: Site) => site.id === id);
      if (index !== -1) {
        sites.value.splice(index, 1);
      }

      // reload clients and agents for dashboard tree
      dashboardStore.refreshDashboard();

      notifySuccess("Site was deleted successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    sites,
    isLoading,
    isError,
    siteCount,
    getSites,
    addSite,
    updateSite,
    removeSite,
  };
}

export function useDeploymentStore() {
  const deployments = ref<Deployment[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function _getDeployments() {
    isLoading.value = true;
    isError.value = false;

    axios
      .get<Deployment[]>("/clients/deployments/")
      .then(({ data }) => {
        deployments.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getDeployments = useCachedAction(_getDeployments, {
    key: "getDeployments",
    duration: 30 * 1000, // 30 seconds cache
  });

  async function addDeployment(payload: Deployment) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<Deployment>("/clients/deployments/", payload);
      deployments.value.unshift(data);
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeDeployment(id: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/client/deployments/${id}/`);
      const index = deployments.value.findIndex((d) => d.id === id);
      if (index !== -1) {
        deployments.value.splice(index, 1);
      }
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    deployments,
    isLoading,
    isError,
    getDeployments,
    addDeployment,
    removeDeployment,
  };
}
