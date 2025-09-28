import { onMounted, computed } from "vue";
import { clientStore } from "src/stores/api";

import type { Client } from "./types";
import { type SelectableOption, type Option, type HeaderOption } from "../dashboard/types";

export function useClientDropdown() {
  const { clients, isLoading } = clientStore;

  const clientOptions = computed(() => {
    return clients.value.map(
      (client) =>
        ({
          type: "option",
          label: client.name,
          value: client.id,
        }) as Option,
    );
  });

  onMounted(clientStore.getClients);

  return {
    clientOptions,
    isLoading,
  };
}

export interface SiteSelectableOption extends SelectableOption {
  clientId: number;
}
export type SiteOption = HeaderOption | SiteSelectableOption;

export function useSiteDropdown() {
  const { clients, isLoading } = clientStore;

  const siteOptions = computed<SiteOption[]>(() => {
    return _formatSiteOptions(clients.value);
  });

  onMounted(clientStore.getClients);

  return {
    siteOptions,
    isLoading,
  };
}

function _formatSiteOptions(data: Client[]) {
  const options = [] as SiteOption[];

  data.forEach((client) => {
    options.push({ type: "header", label: client.name, value: `header_${client.name}` });
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
