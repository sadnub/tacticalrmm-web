<template>
  <div>
    <q-bar>
      <span class="text-caption">
        TRMM Agent Status:
        <q-badge :color="statusColor" :label="agentStore.meshCentralURLs.status || ''" />
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
        v-if="agentStore.meshCentralURLs.control"
        :src="agentStore.meshCentralURLs.control"
        allow="clipboard-read; clipboard-write"
        allowfullscreen
        frameborder="0"
      ></iframe>
    </div>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useMeta, useQuasar } from "quasar";
import { sendAgentServiceAction } from "src/api/services";
import { notifySuccess } from "src/utils/notify";
import { useDashboardStore } from "src/stores/dashboard";
import { useAgentStore } from "src/core/agents/api";

// quasar setup
const $q = useQuasar();

// setup stores
const dashboardStore = useDashboardStore();
const agentStore = useAgentStore();

const dashPositiveColor = computed(() => dashboardStore.dashboardSettings.dashPositiveColor);
const dashNegativeColor = computed(() => dashboardStore.dashboardSettings.dashNegativeColor);
const dashWarningColor = computed(() => dashboardStore.dashboardSettings.dashWarningColor);

// vue router
const { params } = useRoute();

// take control setup
const statusColor = computed(() => {
  switch (agentStore.meshCentralURLs.status) {
    case "online":
      return dashPositiveColor.value;
    case "offline":
      return dashWarningColor.value;
    default:
      return dashNegativeColor.value;
  }
});

function repairMeshCentral() {
  if (params.agent_id && typeof params.agent_id === "string") {
    agentStore.meshCentralURLs.control = "";
    $q.loading.show({ message: "Attempting to repair Mesh Agent" });
    agentStore.sendAgentRecoverMesh(params.agent_id);
    $q.loading.hide();
  }
}

async function restartMeshService() {
  $q.loading.show({ message: "Restarting Mesh Agent" });
  const data = {
    sv_action: "restart",
  };

  try {
    await sendAgentServiceAction(params.agent_id, "mesh agent", data);
    setTimeout(() => {
      notifySuccess("Mesh agent service was restarted");
    }, 500);
  } catch (e) {
    console.error(e);
  }

  $q.loading.hide();
}

// vue lifecycle hooks
onMounted(() => {
  if (params.agent_id && typeof params.agent_id === "string") {
    agentStore.getAgentMeshCentralUrls(params.agent_id);
    useMeta({
      title: `${agentStore.meshCentralURLs.hostname} - ${agentStore.meshCentralURLs.client} - ${agentStore.meshCentralURLs.site} | Take Control`,
    });
  }
});
</script>
