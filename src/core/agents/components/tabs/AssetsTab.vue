<template>
  <div v-if="!selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else-if="selectedAgentPlatform !== 'windows'" class="q-pa-sm">
    Only supported for Windows agents at this time
  </div>
  <div v-else>
    <q-tabs
      v-model="tab"
      dense
      class="text-grey"
      active-color="primary"
      indicator-color="primary"
      align="justify"
      narrow-indicator
      no-caps
    >
      <q-tab name="os" label="Operating System" />
      <q-tab name="cpu" label="CPU" />
      <q-tab name="mem" label="Memory" />
      <q-tab name="usb" label="USB" />
      <q-tab name="bios" label="Bios" />
      <q-tab name="disk" label="Disks" />
      <q-tab name="comp_sys" label="Computer System" />
      <q-tab name="base_board" label="Motherboard" />
      <q-tab name="comp_sys_prod" label="Computer System Product" />
      <q-tab name="network_config" label="Network Config" />
      <q-tab name="graphics" label="Graphics" />
      <q-tab name="desktop_monitor" label="Monitors" />
      <q-tab name="network_adapter" label="Network Adapters" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab">
      <q-tab-panel name="os">
        <WmiDetail :info="selectedAgent?.wmi_detail?.os" />
      </q-tab-panel>
      <q-tab-panel name="cpu">
        <WmiDetail :info="selectedAgent?.wmi_detail?.cpu" />
      </q-tab-panel>
      <q-tab-panel name="mem">
        <WmiDetail :info="selectedAgent?.wmi_detail?.mem" />
      </q-tab-panel>
      <q-tab-panel name="usb">
        <WmiDetail :info="selectedAgent?.wmi_detail?.usb" />
      </q-tab-panel>
      <q-tab-panel name="bios">
        <WmiDetail :info="selectedAgent?.wmi_detail?.bios" />
      </q-tab-panel>
      <q-tab-panel name="disk">
        <WmiDetail :info="selectedAgent?.wmi_detail?.disk" />
      </q-tab-panel>
      <q-tab-panel name="comp_sys">
        <WmiDetail :info="selectedAgent?.wmi_detail?.comp_sys" />
      </q-tab-panel>
      <q-tab-panel name="base_board">
        <WmiDetail :info="selectedAgent?.wmi_detail?.base_board" />
      </q-tab-panel>
      <q-tab-panel name="comp_sys_prod">
        <WmiDetail :info="selectedAgent?.wmi_detail?.comp_sys_prod" />
      </q-tab-panel>
      <q-tab-panel name="network_config">
        <WmiDetail :info="selectedAgent?.wmi_detail?.network_config" />
      </q-tab-panel>
      <q-tab-panel name="desktop_monitor">
        <WmiDetail :info="selectedAgent?.wmi_detail?.desktop_monitor" />
      </q-tab-panel>
      <q-tab-panel name="graphics">
        <WmiDetail :info="selectedAgent?.wmi_detail?.graphics" />
      </q-tab-panel>
      <q-tab-panel name="network_adapter">
        <WmiDetail :info="selectedAgent?.wmi_detail?.network_adapter" />
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, watch, onMounted } from "vue";
import { useAgentStore } from "src/stores/api";

const agentStore = useAgentStore();

// ui imports
import WmiDetail from "./WmiDetail.vue";

// setup stores
const { selectedAgent, selectedAgentId, selectedAgentPlatform } = agentStore;

// assets tab logic
const tab = ref("os");

watch(selectedAgentId, (newValue) => {
  if (newValue) {
    agentStore.getAgent(newValue);
  }
});

onMounted(() => {
  if (selectedAgentId.value) agentStore.getAgent(selectedAgentId.value);
});
</script>
