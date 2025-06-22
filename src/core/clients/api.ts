import { ref, computed } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import { notifySuccess } from "src/utils/notify";
import type { Client, Site } from "./types";

export const useClientStore = defineStore("clients", () => {
  const clients = ref<Client[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  const clientCount = computed(() => clients.value.length);

  function getClients() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<Client[]>("/clients/")
      .then(({ data }) => {
        clients.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function addClient(payload: Omit<Client, "id">) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post<Client>("/clients/", payload)
      .then(({ data: newClient }) => {
        clients.value.unshift(newClient);
        notifySuccess("Client was added successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateClient(id: number, payload: Partial<Client>) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put<Client>(`/clients/${id}/`, payload)
      .then(({ data: updatedClient }) => {
        const index = clients.value.findIndex((client: Client) => client.id === id);
        if (index !== -1) {
          clients.value[index] = updatedClient;
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

  function removeClient(id: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`/clients/${id}/`)
      .then(() => {
        const index = clients.value.findIndex((client: Client) => client.id === id);
        if (index !== -1) {
          clients.value.splice(index, 1);
        }
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
    isLoading,
    clientCount,
    getClients,
    addClient,
    updateClient,
    removeClient,
  };
});

export const useSiteStore = defineStore("sites", () => {
  const sites = ref<Site[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  const siteCount = computed(() => sites.value.length);

  function getSites() {
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

  function addSite(payload: Omit<Site, "id">) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post<Site>("/clients/sites/", payload)
      .then(({ data: newSite }) => {
        sites.value.unshift(newSite);
        notifySuccess("Site was added successfully");
      })
      .catch(() => {
        isError.value = false;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateSite(id: number, payload: Partial<Site>) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put<Site>(`/clients/sites/${id}/`, payload)
      .then(({ data: updatedSite }) => {
        const index = sites.value.findIndex((site: Site) => site.id === id);
        if (index !== -1) {
          sites.value[index] = updatedSite;
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

  function removeSite(id: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`/clients/sites/${id}/`)
      .then(() => {
        const index = sites.value.findIndex((site: Site) => site.id === id);
        if (index !== -1) {
          sites.value.splice(index, 1);
        }
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
    siteCount,
    getSites,
    addSite,
    updateSite,
    removeSite,
  };
});
