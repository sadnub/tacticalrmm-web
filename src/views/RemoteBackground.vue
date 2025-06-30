<template>
  <div>
    <q-tabs
      v-model="tab"
      dense
      inline-label
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="terminal" icon="fas fa-terminal" label="Terminal" />
      <q-tab name="filebrowser" icon="far fa-folder-open" label="File Browser" />
      <q-tab
        v-if="agentPlatform === 'windows'"
        name="services"
        icon="fas fa-cogs"
        label="Services"
      />
      <q-tab name="processes" icon="fas fa-chart-area" label="Processes" />
      <q-tab
        v-if="agentPlatform === 'windows'"
        name="eventlog"
        icon="fas fa-clipboard-list"
        label="Event Log"
      />
    </q-tabs>
    <q-separator />
    <q-tab-panels v-model="tab">
      <q-tab-panel name="terminal" class="q-pa-none">
        <iframe
          v-if="agentStore.meshCentralURLs.terminal"
          allow="clipboard-read; clipboard-write"
          :src="agentStore.meshCentralURLs.terminal"
          :style="{
            height: `${$q.screen.height - 30}px`,
            width: `${$q.screen.width}px`,
          }"
        ></iframe>
      </q-tab-panel>
      <q-tab-panel name="processes" class="q-pa-none">
        <ProcessManager :agent_id="agentId" />
      </q-tab-panel>
      <q-tab-panel v-if="agentPlatform === 'windows'" name="services" class="q-pa-none">
        <ServicesManager :agent-id="agentId" :agent-platform="agentPlatform" />
      </q-tab-panel>
      <q-tab-panel v-if="agentPlatform === 'windows'" name="eventlog" class="q-pa-none">
        <EventLogManager :agent-id="agentId" :agent-platform="agentPlatform" />
      </q-tab-panel>
      <q-tab-panel name="filebrowser" class="q-pa-none">
        <iframe
          v-if="agentStore.meshCentralURLs.file"
          allow="clipboard-read; clipboard-write"
          :src="agentStore.meshCentralURLs.file"
          :style="{
            height: `${$q.screen.height - 30}px`,
            width: `${$q.screen.width}px`,
          }"
        ></iframe>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useQuasar, useMeta } from "quasar";
import { useAgentStore } from "src/core/agents/api";
import { useDashboardStore } from "src/stores/dashboard";

// ui imports
import ProcessManager from "src/components/agents/remotebg/ProcessManager.vue";
import ServicesManager from "src/components/agents/remotebg/ServicesManager.vue";
import EventLogManager from "src/components/agents/remotebg/EventLogManager.vue";

// setup quasar
const $q = useQuasar();

// setup stores
const agentStore = useAgentStore();

// dashinfo is loading onMount
useDashboardStore();

// vue router
const { params } = useRoute();

// meshcentral tabs
const tab = ref("terminal");

const agentId = computed(() => (typeof params.agentPlatform === "string" ? params.agent_id : ""));
const agentPlatform = computed(() =>
  typeof params.agentPlatform === "string" ? params.agentPlatform : "",
);
onMounted(() => {
  if (agentId.value && typeof agentId.value === "string") {
    $q.loadingBar.setDefaults({ size: "0px" });
    agentStore.getAgentMeshCentralUrls(agentId.value);

    useMeta({
      title: `${agentStore.selectedAgent?.hostname} - ${agentStore.selectedAgent?.client_name} - ${agentStore.selectedAgent?.site_name} | Remote Background`,
    });
  }
});
</script>
