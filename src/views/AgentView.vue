<template>
  <q-page>
    <q-splitter
      v-model="innerModel"
      reverse
      unit="px"
      horizontal
      before-class="hide-scrollbar"
      after-class="hide-scrollbar"
      emit-immediately
      :style="{ height: `${splitterHeight}px` }"
      @update:model-value="updateTabHeight"
    >
      <template #before>
        <SummaryTab />
      </template>
      <template #separator>
        <q-avatar color="primary" text-color="white" size="20px" icon="drag_indicator" />
      </template>
      <template #after>
        <SubTableTabs :disable-tabs="['summary']" />
      </template>
    </q-splitter>
  </q-page>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, watch } from "vue";
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

// splitter height fills viewport minus the toolbar (50px)
const splitterHeight = computed(() => $q.screen.height - 50);

// initialize bottom panel to half the available height
const innerModel = ref(Math.floor(splitterHeight.value / 2));

function updateTabHeight(val: number) {
  // q-tabs header is 37px
  tabHeight.value = Math.floor(val - 37);
}

// set initial tabHeight
updateTabHeight(innerModel.value);

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
