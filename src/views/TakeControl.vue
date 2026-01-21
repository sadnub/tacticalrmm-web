<template>
  <div>
    <q-bar>
      <span class="text-caption">
        TRMM Agent Status:
        <q-badge :color="statusColor" :label="meshCentralURLs.status || ''" />
      </span>
      <q-space />
      <q-btn
        class="q-mr-md"
        color="primary"
        size="sm"
        label="Restart Connection"
        icon="refresh"
        @click="restartMeshService"
      />
      <q-btn
        :color="dashNegativeColor"
        size="sm"
        label="Recover Connection"
        icon="fas fa-first-aid"
        @click="repairMeshCentral"
      />
      <q-space />
    </q-bar>
    <div class="q-video" :style="{ height: `${$q.screen.height - 26}px` }">
      <iframe
        v-if="meshCentralURLs.control"
        :src="meshCentralURLs.control"
        allow="clipboard-read; clipboard-write"
        allowfullscreen
        frameborder="0"
      ></iframe>
    </div>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useMeta, useQuasar } from "quasar";
import { useAgentStore, useDashboardStore } from "src/stores/api";

const { getAgentMeshCentralUrls, sendAgentRecoverMesh, sendAgentServiceAction } = useAgentStore();
const { dashboardSettings } = useDashboardStore();

// type imports
import type { MeshUrls } from "src/core/agents/types";

// quasar setup
const $q = useQuasar();

const dashPositiveColor = computed(() => dashboardSettings.dashPositiveColor);
const dashNegativeColor = computed(() => dashboardSettings.dashNegativeColor);
const dashWarningColor = computed(() => dashboardSettings.dashWarningColor);

// vue router
const { params } = useRoute();

const meshCentralURLs = ref<MeshUrls>({
  hostname: "",
  client: "",
  site: "",
});

// take control setup
const statusColor = computed(() => {
  switch (meshCentralURLs.value.status) {
    case "online":
      return dashPositiveColor.value;
    case "offline":
      return dashWarningColor.value;
    default:
      return dashNegativeColor.value;
  }
});

async function repairMeshCentral() {
  if (params.agent_id && typeof params.agent_id === "string") {
    meshCentralURLs.value.control = "";
    $q.loading.show({ message: "Attempting to repair Mesh Agent" });
    const result = await sendAgentRecoverMesh(params.agent_id);
    if (result) meshCentralURLs.value = result;
    $q.loading.hide();
  }
}

function restartMeshService() {
  $q.loading.show({ message: "Restarting Mesh Agent" });

  if (params.agent_id && typeof params.agent_id === "string")
    void sendAgentServiceAction(params.agent_id, "mesh agent", "restart");

  $q.loading.hide();
}

// vue lifecycle hooks
onMounted(async () => {
  if (params.agent_id && typeof params.agent_id === "string") {
    const result = await getAgentMeshCentralUrls(params.agent_id);
    if (result) {
      meshCentralURLs.value = result;
      useMeta({
        title: `${meshCentralURLs.value.hostname} - ${meshCentralURLs.value.client} - ${meshCentralURLs.value.site} | Take Control`,
      });
    }
  }
});
</script>
