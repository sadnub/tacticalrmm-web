import { onMounted, computed, ref } from "vue";

import { agentStore } from "src/stores/api";
import { useDashboardStore } from "src/stores/dashboard";
import type { Option, SelectableOption } from "../dashboard/types";

import type { Agent } from "./types";

// TODO: Apply remove extra categories when filtering or test to make sure it is working
export function useAgentDropdown() {
  const { agents, isLoading } = agentStore;

  const agentOptions = computed(() => {
    return _formatAgentOptions(agents.value);
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
    .flatMap(([category, agents]) => [
      { type: "header", label: category, value: `header_${category}` },
      ...agents,
    ]);
}

export function useAgentDiskDropdown(agentId: string | null) {
  if (!agentId) return { agentDiskOptions: ref<string[]>([]) };
  const { selectedAgent } = agentStore;

  console.log("Here?");

  const agentDiskOptions = computed(() => {
    if (selectedAgent.value?.disks) return selectedAgent.value.disks.map((disk) => disk.device);
    else return [];
  });

  onMounted(() => agentStore.getAgent(agentId));

  return {
    agentDiskOptions,
  };
}

export function useAgentServiceDropdown(agentId: string | null) {
  if (!agentId) return { agentServiceOptions: ref<SelectableOption[]>([]) };

  const { selectedAgent } = agentStore;

  const agentServiceOptions = computed(() => {
    if (selectedAgent.value?.services)
      return selectedAgent.value.services
        .map((service) => ({
          type: "option",
          label: service.display_name,
          value: service.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)) as SelectableOption[];
    else return [] as SelectableOption[];
  });

  onMounted(() => agentStore.getAgent(agentId));

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
