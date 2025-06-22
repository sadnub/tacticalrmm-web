import { onMounted, computed } from "vue";
import { useClientStore } from "./api";

import type { Client } from "./types";
import type { Option } from "../dashboard/types";

export function useClientDropdown() {
  const clientStore = useClientStore();

  const clientOptions = computed(() => {
    return clientStore.clients.map((client) => ({
      label: client.name,
      value: client.id,
    }));
  });

  onMounted(clientStore.getClients);

  return {
    clientOptions,
  };
}

export function useSiteDropdown() {
  const clientStore = useClientStore();

  const siteOptions = computed(() => {
    return _formatSiteOptions(clientStore.clients);
  });

  onMounted(clientStore.getClients);

  return {
    siteOptions,
  };
}

function _formatSiteOptions(data: Client[]) {
  const options = [] as Option[];

  data.forEach((client) => {
    options.push({ category: client.name });
    options.push(
      ...client.sites.map((site) => ({
        label: site.name,
        value: site.id,
        cat: client.name,
      })),
    );
  });

  return options;
}
