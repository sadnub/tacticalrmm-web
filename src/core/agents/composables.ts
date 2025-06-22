import { onMounted, computed } from "vue";

import { useAgentStore } from "./api";
import type { Option } from "../dashboard/types";

import type { Agent } from "./types";

export function useAgentDropdown() {
  const agentStore = useAgentStore();

  const agentOptions = computed(() => {
    return _formatAgentOptions(agentStore.agents);
  });

  onMounted(agentStore.getAgents);

  return {
    agentOptions,
  };
}

export function _formatAgentOptions(data: Agent[]): Option[] {
  const agents = data.map(({ hostname, agent_id, client_name, site_name }) => ({
    label: hostname,
    value: agent_id,
    cat: `${client_name} > ${site_name}`,
  }));

  agents.sort((a, b) => a.label.localeCompare(b.label));

  const categoryMap = new Map<string, { label: string; value: string; cat: string }[]>();

  for (const agent of agents) {
    if (!categoryMap.has(agent.cat)) {
      categoryMap.set(agent.cat, []);
    }
    categoryMap.get(agent.cat)!.push({ label: agent.label, value: agent.value, cat: agent.cat });
  }

  return Array.from(categoryMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([category, agents]) => [{ category }, ...agents]);
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
      return agentStore.selectedAgent.services.map((service) => ({
        label: service.display_name,
        value: service.name,
      }));
    else return [];
  });

  onMounted(agentStore.getAgent(agent_id));

  return {
    agentServiceOptions,
  };
}
