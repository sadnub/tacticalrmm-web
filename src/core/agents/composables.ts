import { onMounted, computed } from "vue";

import { useAgentStore } from "./api";
import { useDashboardStore } from "src/stores/dashboard";
import type { Option, SelectableOption } from "../dashboard/types";

import type { Agent } from "./types";

// TODO: Apply remove extra categories when filtering or test to make sure it is working
export function useAgentDropdown() {
  const agentStore = useAgentStore();

  const isLoading = computed(() => agentStore.isLoading);

  const agentOptions = computed(() => {
    return _formatAgentOptions(agentStore.agents);
  });

  onMounted(agentStore.getAgents);

  return {
    agentOptions,
    isLoading,
  };
}

export function _formatAgentOptions(data: Agent[]): Option[] {
  const agents = data.map(({ hostname, agent_id, client_name, site_name }) => ({
    label: hostname,
    value: agent_id,
    category: `${client_name} > ${site_name}`,
  }));

  agents.sort((a, b) => a.label.localeCompare(b.label));

  const categoryMap = new Map<string, Option[]>();

  for (const agent of agents) {
    if (!categoryMap.has(agent.category)) {
      categoryMap.set(agent.category, []);
    }
    categoryMap
      .get(agent.category)!
      .push({ type: "option", label: agent.label, value: agent.value, category: agent.category });
  }

  return Array.from(categoryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([category, agents]) => [{ type: "header", category }, ...agents]);
}

export function useAgentDiskDropdown(agent_id: string) {
  const agentStore = useAgentStore();

  const agentDiskOptions = computed(() => {
    if (agentStore.selectedAgent?.disks)
      return agentStore.selectedAgent.disks.map((disk) => disk.device);
    else return [];
  });

  onMounted(agentStore.getAgent(agent_id));

  return {
    agentDiskOptions,
  };
}

export function useAgentServiceDropdown(agent_id: string) {
  const agentStore = useAgentStore();

  const agentServiceOptions = computed(() => {
    if (agentStore.selectedAgent?.services)
      return agentStore.selectedAgent.services.map(
        (service) =>
          ({
            label: service.display_name,
            value: service.name,
          }) as SelectableOption,
      );
    else return [];
  });

  onMounted(agentStore.getAgent(agent_id));

  return {
    agentServiceOptions,
  };
}

export function cmdPlaceholder(shell: string) {
  const store = useDashboardStore();
  const placeholders = computed(() => store.dashboardSettings.runCmdPlaceholderText);

  if (shell === "cmd") return placeholders.value.cmd;
  else if (shell === "powershell") return placeholders.value.powershell;
  else return placeholders.value.shell;
}

export const agentPlatformOptions = [
  { value: "windows", label: "Windows" },
  { value: "linux", label: "Linux" },
  { value: "darwin", label: "macOS" },
];
