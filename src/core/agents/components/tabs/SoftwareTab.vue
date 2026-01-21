<template>
  <div v-if="!selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else-if="selectedAgentPlatform !== 'windows'" class="q-pa-sm">
    Only supported for Windows agents at this time
  </div>
  <div v-else>
    <tactical-table
      v-model:pagination="pagination"
      dense
      :rows="agentSoftware"
      :columns="columns"
      :filter="filter"
      :style="{ 'max-height': `${tabHeight}px` }"
      binary-state-sort
      row-key="id"
      virtual-scroll
      :rows-per-page-options="[0]"
      :loading="isLoading"
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
          @click="selectedAgentId && getAgentSoftware(selectedAgentId, { force: true })"
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

        <q-input v-model="filter" filled label="Search" dense clearable class="q-pr-sm" style="width: 300px">
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
        <tactical-table-export />
      </template>

      <template #body-cell-uninstall="props">
        <q-td :props="props">
          <q-btn
            v-if="props.row.uninstall"
            label="Uninstall"
            color="primary"
            dense
            size="sm"
            @click="openUninstallSoftware(props.row)"
          />
        </q-td>
      </template>
    </tactical-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, watch, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useAgentSoftwareStore, useAgentStore, useDashboardStore } from "src/stores/api";

const { selectedAgentPlatform, selectedAgentId } = useAgentStore();
const { agentSoftware, isLoading, getAgentSoftware } = useAgentSoftwareStore();
const { tabHeight } = useDashboardStore();

// ui imports
import InstallSoftware from "src/core/agents/components/InstallSoftware.vue";
import UninstallSoftware from "src/core/agents/components/UninstallSoftware.vue";

// type imports
import type { TacticalColumn } from "src/core/dashboard/types";
import type { Software } from "src/core/agents/types";

// static data
const columns: TacticalColumn[] = [
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
  {
    name: "uninstall",
    align: "left",
    label: "Uninstall",
    field: "uninstall",
    sortable: false,
  },
];

// setup quasar
const $q = useQuasar();

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
      agentId: selectedAgentId.value,
    },
  });
}

function openUninstallSoftware(software: Software) {
  if (!selectedAgentId.value) return;

  // Auto-append silent flags for MSI-based uninstalls
  const uninstallString =
    software.uninstall +
    (software.uninstall.toLowerCase().includes("msiexec") ? " /qn /norestart" : "");

  $q.dialog({
    component: UninstallSoftware,
    componentProps: {
      agentId: selectedAgentId.value,
      softwareName: software.name,
      initialUninstallString: uninstallString,
    },
  });
}

watch(selectedAgentId, (newValue) => {
  if (newValue) {
    getAgentSoftware(newValue);
  }
});

onMounted(() => {
  if (selectedAgentId.value) getAgentSoftware(selectedAgentId.value);
});
</script>
