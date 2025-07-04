import { onMounted, computed } from "vue";
import { useClientStore } from "./api";

import type { Client } from "./types";
import { type SelectableOption, type Option, type HeaderOption } from "../dashboard/types";

export function useClientDropdown() {
  const clientStore = useClientStore();

  const clientOptions = computed(() => {
    return clientStore.clients.map(
      (client) =>
        ({
          label: client.name,
          value: client.id,
        }) as Option,
    );
  });

  onMounted(clientStore.getClients);

  return {
    clientOptions,
    isLoading: clientStore.isLoading,
  };
}

export interface SiteSelectableOption extends SelectableOption {
  clientId: number;
}
export type SiteOption = HeaderOption | SiteSelectableOption;

export function useSiteDropdown() {
  const clientStore = useClientStore();

  const siteOptions = computed<SiteOption[]>(() => {
    return _formatSiteOptions(clientStore.clients);
  });

  onMounted(clientStore.getClients);

  return {
    siteOptions,
    isLoading: clientStore.isLoading,
  };
}

function _formatSiteOptions(data: Client[]) {
  const options = [] as SiteOption[];

  data.forEach((client) => {
    options.push({ type: "header", category: client.name });
    options.push(
      ...client.sites.map(
        (site) =>
          ({
            type: "option",
            label: site.name,
            value: site.id,
            category: client.name,
            clientId: client.id,
          }) as SiteSelectableOption,
      ),
    );
  });

  return options;
}
