<template>
  <div v-if="!agentStore.selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else-if="agentPlatform !== 'windows'" class="q-pa-sm">
    Only supported for Windows agents at this time
  </div>
  <div v-else>
    <tactical-table
      v-model:pagination="pagination"
      dense
      :rows="agentStore.agentSoftware"
      :columns="columns"
      :filter="filter"
      :style="{ 'max-height': `${tabHeight}px` }"
      binary-state-sort
      row-key="id"
      virtual-scroll
      :rows-per-page-options="[0]"
      :loading="agentStore.isLoading"
      column-select
      storage-key="agent-software-tab"
    >
      <template #loading>
        <q-inner-loading showing color="primary" />
      </template>

      <template #top>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="
            agentStore.selectedAgentId &&
              agentStore.refreshAgentSoftware(agentStore.selectedAgentId)
          "
        />
        <q-btn
          icon="add"
          label="Install Software"
          no-caps
          dense
          flat
          push
          @click="showInstallSoftwareModal"
        />

        <q-space />

        <q-input v-model="filter" filled label="Search" dense clearable class="q-pr-sm">
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
        <export-table-btn :data="agentStore.agentSoftware" :columns="columns" />
      </template>
    </tactical-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, watch, onMounted } from "vue";
import { useQuasar, type QTableProps } from "quasar";
import { useAgentStore } from "../../api";
import { useDashboardStore } from "src/stores/dashboard";

// ui imports
import InstallSoftware from "src/core/agents/components/InstallSoftware.vue";
import ExportTableBtn from "src/components/ui/ExportTableBtn.vue";
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";

// static data
const columns: QTableProps["columns"] = [
  {
    name: "name",
    align: "left",
    label: "Name",
    field: "name",
    sortable: true,
  },
  {
    name: "publisher",
    align: "left",
    label: "Publisher",
    field: "publisher",
    sortable: true,
  },
  {
    name: "install_date",
    align: "left",
    label: "Installed On",
    field: "install_date",
    sortable: false,
    format: (val) => {
      return val === "01/01/1" || val === "01-1-01" ? "" : val;
    },
  },
  {
    name: "size",
    align: "left",
    label: "Size",
    field: "size",
    sortable: false,
  },
  {
    name: "version",
    align: "left",
    label: "Version",
    field: "version",
    sortable: false,
  },
];

// setup quasar
const $q = useQuasar();

// setup stores
const agentStore = useAgentStore();
const dashboardStore = useDashboardStore();
const tabHeight = computed(() => dashboardStore.tabHeight);
const agentPlatform = computed(() => agentStore.selectedAgentPlatform);

// software tab logic
const filter = ref("");
const pagination = ref({
  rowsPerPage: 0,
  sortBy: "name",
  descending: false,
});

function showInstallSoftwareModal() {
  $q.dialog({
    component: InstallSoftware,
    componentProps: {
      agent_id: agentStore.selectedAgentId,
    },
  });
}

watch(
  () => agentStore.selectedAgentId,
  (newValue) => {
    if (newValue) {
      agentStore.getAgentSoftware(newValue);
    }
  },
);

onMounted(() => {
  if (agentStore.selectedAgentId) agentStore.getAgentSoftware(agentStore.selectedAgentId);
});
</script>
