import { onMounted, computed } from "vue";
import { useClientStore } from "./api";

import type { Client } from "./types";
import { isCategoryOption } from "../dashboard/types";

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
    isLoading: clientStore.isLoading,
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
    isLoading: clientStore.isLoading,
  };
}

export type SiteOption = {
  clientId: number;
  label: string;
  value: number | string;
  cat: string;
  img_right?: string;
};

export type SiteOptionWithCategory =
  | {
      clientId: number;
      label: string;
      value: number | string;
      cat: string;
      img_right?: string;
    }
  | {
      category: string;
    };

export function isSiteOption(option: SiteOptionWithCategory): option is SiteOption {
  return !isCategoryOption(option);
}

function _formatSiteOptions(data: Client[]) {
  const options = [] as SiteOptionWithCategory[];

  data.forEach((client) => {
    options.push({ category: client.name });
    options.push(
      ...client.sites.map((site) => ({
        label: site.name,
        value: site.id,
        cat: client.name,
        clientId: client.id,
      })),
    );
  });

  return options;
}
