<template>
  <q-page>
    <SummaryTab />
    <q-separator />
    <SubTableTabs
      :style="{ height: `${tabHeight + 38}px` }"
      :disable-tabs="['summary']"
    />
  </q-page>
</template>

<script lang="ts" setup>
// composition imports
import { watch } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { useAgentStore, useDashboardStore } from "src/stores/api";

// ui imports
import SummaryTab from "src/core/agents/components/tabs/SummaryTab.vue";
import SubTableTabs from "src/core/dashboard/components/SubTableTabs.vue";

const route = useRoute();
const $q = useQuasar();

// setup stores
const { selectedAgentIds, getAgent } = useAgentStore();
const { tabHeight } = useDashboardStore();

tabHeight.value = $q.screen.height - 309 - 50 - 36;

function selectAgentFromRoute() {
  const agentId = typeof route.params.agent_id === "string" ? route.params.agent_id : null;
  if (agentId) {
    selectedAgentIds.value = [agentId];
    getAgent(agentId);
  }
}

selectAgentFromRoute();

// watch for route change
watch(() => route.params.agent_id, selectAgentFromRoute);
</script>
