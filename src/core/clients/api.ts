import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useRouter } from "vue-router";
import axios from "axios";
import { notifySuccess } from "src/utils/notify";
import { useDashboardStore } from "src/stores/dashboard";
import type { Client, ClientCustomFieldValue, Site, SiteCustomFieldValue } from "./types";

export const useClientStore = defineStore(
  "clients",
  () => {
    const clients = ref<Client[]>([]);
    const client = ref<Client | null>(null);
    const isLoading = ref(false);
    const isError = ref(false);

    const clientCount = computed(() => clients.value.length);

    const router = useRouter();
    const dashboardStore = useDashboardStore();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function getClients(_args?: { force: boolean }) {
      isLoading.value = true;
      isError.value = false;
      axios
        .get<Client[]>("/clients/")
        .then(({ data }) => {
          console.log(data);
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
    function addClient(payload: ClientAddRequest) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post<Client>("/clients/", payload)
        .then(({ data }) => {
          console.log(data);
          clients.value.unshift(data);
          notifySuccess("Client was added successfully");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    interface ClientUpdateRequest {
      client: {
        name: string;
      };
      custom_fields: ClientCustomFieldValue[];
    }

    function updateClient(id: number, payload: ClientUpdateRequest) {
      isLoading.value = true;
      isError.value = false;
      axios
        .put<Client>(`/clients/${id}/`, payload)
        .then(({ data }) => {
          console.log(data);
          const index = clients.value.findIndex((client: Client) => client.id === id);
          if (index !== -1) {
            clients.value[index] = data;
          }
          notifySuccess("Client was modified successfully");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function getClient(id: number, _args?: { force: boolean }) {
      isLoading.value = true;
      isError.value = false;
      client.value = null;
      axios
        .get(`/clients/${id}/`)
        .then(({ data }) => {
          console.log(data);
          client.value = data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function removeClient(id: number, moveToSite?: number) {
      isLoading.value = true;
      isError.value = false;
      axios
        .delete(`/clients/${id}/`, { params: moveToSite ? { move_to_site: id } : {} })
        .then(() => {
          const index = clients.value.findIndex((client: Client) => client.id === id);
          if (index !== -1) {
            clients.value.splice(index, 1);
          }

          dashboardStore.refreshDashboard();
          notifySuccess("Client was deleted successfully");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    return {
      clients,
      client,
      isLoading,
      isError,
      clientCount,
      getClients,
      getClient,
      addClient,
      updateClient,
      removeClient,
    };
  },
  {
    cache: {
      getClients: {
        duration: 1 * 60 * 1000,
      },
      getClient: {
        duration: 1 * 60 * 1000,
      },
    },
  },
);

export const useSiteStore = defineStore(
  "sites",
  () => {
    const sites = ref<Site[]>([]);
    const isLoading = ref(false);
    const isError = ref(false);

    const siteCount = computed(() => sites.value.length);

    const dashboardStore = useDashboardStore();
    const clientStore = useClientStore();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function getSites(_args?: { force: true }) {
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

    interface SiteAddUpdateRequest {
      site: {
        name: string;
        client?: number | undefined;
      };
      custom_fields: SiteCustomFieldValue[];
    }

    function addSite(payload: SiteAddUpdateRequest) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post<Site>("/clients/sites/", payload)
        .then(({ data }) => {
          // add new site to this store
          sites.value.unshift(data);

          // add new site to client store for tree
          const client = clientStore.clients.find((client) => client.id === data.client);
          if (client) client.sites.unshift(data);

          notifySuccess("Site was added successfully");
        })
        .catch(() => {
          isError.value = false;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function updateSite(id: number, payload: SiteAddUpdateRequest) {
      isLoading.value = true;
      isError.value = false;
      axios
        .put<Site>(`/clients/sites/${id}/`, payload)
        .then(({ data }) => {
          // add to this site store
          const index = sites.value.findIndex((site) => site.id === id);
          if (index !== -1) {
            sites.value[index] = data;
          }

          // add to client store for tree
          const client = clientStore.clients.find((client) => client.id === data.client);
          if (client) {
            const index = client.sites.findIndex((site) => site.id === id);
            if (index !== -1) {
              client.sites[index] = data;
            }
          }

          notifySuccess("Site was modified successfully");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function removeSite(id: number, moveToSite?: number) {
      isLoading.value = true;
      isError.value = false;
      axios
        .delete<Site>(`/clients/sites/${id}/`, {
          params: moveToSite ? { move_to_site: moveToSite } : {},
        })
        .then(() => {
          const index = sites.value.findIndex((site: Site) => site.id === id);
          if (index !== -1) {
            sites.value.splice(index, 1);
          }

          // reload clients and agents for dashboard tree
          dashboardStore.refreshDashboard();

          notifySuccess("Site was deleted successfully");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
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
  },
  {
    cache: {
      getSites: {
        duration: 1 * 60 * 1000,
      },
    },
  },
);
