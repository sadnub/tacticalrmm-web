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
const { selectedAgentId } = useAgentStore();
const { tabHeight } = useDashboardStore();

tabHeight.value = $q.screen.height - 309 - 50 - 36;

selectedAgentId.value = typeof route.params.agent_id === "string" ? route.params.agent_id : null;

// watch for route change
watch(
  () => route.params.agent_id,
  () =>
    (selectedAgentId.value =
      typeof route.params.agent_id === "string" ? route.params.agent_id : null),
);
</script>
