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
      <q-tab v-if="agentPlatform === 'windows'" name="registry">
        <q-icon :name="`img:${registryIcon}`" size="20px" class="q-mr-xs" />
        Registry
      </q-tab>
    </q-tabs>
    <q-separator />
    <q-tab-panels v-model="tab">
      <q-tab-panel name="terminal" class="q-pa-none">
        <iframe
          v-if="meshCentralURLs.terminal"
          allow="clipboard-read; clipboard-write"
          :src="meshCentralURLs.terminal"
          :style="{
            height: `${$q.screen.height - 30}px`,
            width: `${$q.screen.width}px`,
          }"
        ></iframe>
      </q-tab-panel>
      <q-tab-panel name="processes" class="q-pa-none">
        <ProcessManager :agent-id="agentId" />
      </q-tab-panel>
      <q-tab-panel v-if="agentPlatform === 'windows'" name="services" class="q-pa-none">
        <ServicesManager :agent-id="agentId" :agent-platform="agentPlatform" />
      </q-tab-panel>
      <q-tab-panel v-if="agentPlatform === 'windows'" name="eventlog" class="q-pa-none">
        <EventLogManager :agent-id="agentId" :agent-platform="agentPlatform" />
      </q-tab-panel>
      <q-tab-panel name="filebrowser" class="q-pa-none">
        <iframe
          v-if="meshCentralURLs.file"
          allow="clipboard-read; clipboard-write"
          :src="meshCentralURLs.file"
          :style="{
            height: `${$q.screen.height - 30}px`,
            width: `${$q.screen.width}px`,
          }"
        ></iframe>
      </q-tab-panel>
      <q-tab-panel v-if="agentPlatform === 'windows'" name="registry" class="q-pa-none">
        <RegistryManager :agent-id="agentId" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useQuasar, useMeta } from "quasar";
import { useAgentStore } from "src/stores/api";

const { getAgentMeshCentralUrls } = useAgentStore();

// ui imports
import ProcessManager from "src/core/agents/components/remotebg/ProcessManager.vue";
import ServicesManager from "src/core/agents/components/remotebg/ServicesManager.vue";
import EventLogManager from "src/core/agents/components/remotebg/EventLogManager.vue";
import RegistryManager from "src/core/agents/components/remotebg/RegistryManager.vue";
import registryIcon from "src/assets/windows-registry.png";

// type imports
import type { MeshUrls } from "src/core/agents/types";

// setup quasar
const $q = useQuasar();

// vue router
const { params, query } = useRoute();

// meshcentral tabs
const tab = ref("terminal");

const agentId = computed(() => (typeof params.agent_id === "string" ? params.agent_id : ""));

const agentPlatform = computed(() =>
  typeof query.agentPlatform === "string" ? query.agentPlatform : "",
);

const meshCentralURLs = ref<MeshUrls>({
  hostname: "",
  client: "",
  site: "",
});

useMeta(() => ({
  title: `${meshCentralURLs.value.hostname} - ${meshCentralURLs.value.client} - ${meshCentralURLs.value.site} | Remote Background`,
}));

onMounted(async () => {
  if (agentId.value && typeof agentId.value === "string") {
    $q.loadingBar.setDefaults({ size: "0px" });
    const result = await getAgentMeshCentralUrls(agentId.value);
    if (result) {
      meshCentralURLs.value = result;
    }
  }
});
</script>
