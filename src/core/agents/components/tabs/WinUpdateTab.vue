<template>
  <div v-if="!agentStore.selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else-if="agentPlatform !== 'windows'" class="q-pa-sm">
    Only supported for Windows agents at this time
  </div>
  <div v-else>
    <tactical-table
      v-model:pagination="pagination"
      dense
      :style="{ 'max-height': tabHeight }"
      :rows="updateStore.updates"
      :columns="columns"
      :filter="filter"
      row-key="id"
      binary-state-sort
      virtual-scroll
      :loading="updateStore.isLoading"
      :rows-per-page-options="[0]"
      no-data-label="No Windows Updates"
      column-select
      storage-key="agent-updates-tab"
    >
      <template #top>
        <q-btn
          dense
          flat
          push
          icon="refresh"
          class="q-mr-sm"
          @click="
            agentStore.selectedAgentId && updateStore.getAgentUpdates(agentStore.selectedAgentId)
          "
        />
        <q-btn
          label="Run Update Scan"
          dense
          flat
          push
          no-caps
          class="q-mr-sm"
          @click="
            agentStore.selectedAgentId && updateStore.runAgentUpdateScan(agentStore.selectedAgentId)
          "
        />
        <q-btn
          label="Install Approved Updates"
          dense
          flat
          push
          no-caps
          class="q-mr-sm"
          @click="
            agentStore.selectedAgentId &&
              updateStore.runAgentUpdateInstall(agentStore.selectedAgentId)
          "
        />
        <q-space />

        <q-input v-model="filter" filled label="Search" dense clearable class="q-pr-sm">
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
        <export-table-btn :data="updateStore.updates" :columns="columns" />
      </template>

      <template #loading>
        <q-inner-loading showing color="primary" />
      </template>

      <template #body="{ row }">
        <q-tr>
          <q-menu context-menu>
            <q-list dense style="min-width: 100px">
              <q-item
                v-if="!row.installed"
                v-close-popup
                clickable
                @click="editWinUpdate(row.id, 'inherit')"
              >
                <q-item-section>Inherit</q-item-section>
              </q-item>
              <q-item
                v-if="!row.installed"
                v-close-popup
                clickable
                @click="editWinUpdate(row.id, 'approve')"
              >
                <q-item-section>Approve</q-item-section>
              </q-item>
              <q-item
                v-if="!row.installed"
                v-close-popup
                clickable
                @click="editWinUpdate(row.id, 'ignore')"
              >
                <q-item-section>Ignore</q-item-section>
              </q-item>
              <q-item
                v-if="!row.installed"
                v-close-popup
                clickable
                @click="editWinUpdate(row.id, 'nothing')"
              >
                <q-item-section>Do Nothing</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <!-- policy -->
          <q-td>
            <q-icon v-if="row.action === 'nothing'" name="fiber_manual_record" color="grey">
              <q-tooltip>Do Nothing</q-tooltip>
            </q-icon>
            <q-icon v-else-if="row.action === 'approve'" name="fas fa-check" color="primary">
              <q-tooltip>Approve</q-tooltip>
            </q-icon>
            <q-icon
              v-else-if="row.action === 'ignore'"
              name="fas fa-check"
              :color="dashNegativeColor"
            >
              <q-tooltip>Ignore</q-tooltip>
            </q-icon>
            <q-icon v-else-if="row.action === 'inherit'" name="fiber_manual_record" color="accent">
              <q-tooltip>Inherit</q-tooltip>
            </q-icon>
          </q-td>
          <q-td>
            <q-icon v-if="row.installed" name="fas fa-check" :color="dashPositiveColor">
              <q-tooltip>Installed</q-tooltip>
            </q-icon>
            <q-icon v-else-if="row.action == 'approve'" name="fas fa-tasks" color="primary">
              <q-tooltip>Pending</q-tooltip>
            </q-icon>
            <q-icon v-else-if="row.action == 'ignore'" name="fas fa-ban" :color="dashNegativeColor">
              <q-tooltip>Ignored</q-tooltip>
            </q-icon>
            <q-icon v-else name="fas fa-exclamation" :color="dashWarningColor">
              <q-tooltip>Missing</q-tooltip>
            </q-icon>
          </q-td>
          <q-td>{{ !row.severity ? "Other" : row.severity }}</q-td>
          <q-td>{{ truncateText(row.title, 50) }}</q-td>
          <q-td @click="showUpdateDetails(row)">
            <span style="cursor: pointer; text-decoration: underline" class="text-primary">{{
              truncateText(row.description, 50)
            }}</span>
          </q-td>
          <q-td>{{ dashboardStore.formatDate(row.date_installed) }}</q-td>
        </q-tr>
      </template>
    </tactical-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, reactive, computed, watch, onMounted } from "vue";
import { useQuasar, type QTableProps } from "quasar";
import { useWinUpdateStore } from "../../api";
import { useDashboardStore } from "src/stores/dashboard";
import { useAgentStore } from "../../api";
import { truncateText } from "src/utils/format";

// type imports
import type { WindowsUpdate, PatchAction } from "../../types";

// ui imports
import ExportTableBtn from "src/components/ui/ExportTableBtn.vue";
import WinUpdateDialog from "./WinUpdateDialog.vue";
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";

// static data
const columns: QTableProps["columns"] = [
  {
    name: "action",
    field: "action",
    label: "",
    align: "left",
  },
  {
    name: "installed",
    field: "installed",
    label: "",
    align: "left",
  },
  {
    name: "severity",
    label: "Severity",
    field: "severity",
    align: "left",
    sortable: true,
  },
  {
    name: "title",
    label: "Name",
    field: "title",
    align: "left",
    sortable: true,
  },
  {
    name: "description",
    label: "More Info",
    field: "description",
    align: "left",
    sortable: true,
  },
  {
    name: "date_installed",
    label: "Installed On",
    field: "date_installed",
    align: "left",
    sortable: true,
  },
];

// setup stores
const updateStore = useWinUpdateStore();
const dashboardStore = useDashboardStore();
const agentStore = useAgentStore();

const tabHeight = computed(() => dashboardStore.tabHeight);
const agentPlatform = computed(() => agentStore.selectedAgentPlatform);
const dashPositiveColor = computed(() => dashboardStore.dashboardSettings.dashPositiveColor);
const dashNegativeColor = computed(() => dashboardStore.dashboardSettings.dashNegativeColor);
const dashWarningColor = computed(() => dashboardStore.dashboardSettings.dashWarningColor);

// setup quasar
const $q = useQuasar();

// setup win update tab component
const filter = ref("");
const pagination = reactive({
  rowsPerPage: 0,
  sortBy: "installed",
  descending: false,
});

function editWinUpdate(id: number, action: PatchAction) {
  updateStore.updateAgentUpdate(id, { action });

  // TODO: Make sure to only isoloate updates to this one agent
  //refreshDashboard();
}

function showUpdateDetails(update: WindowsUpdate) {
  $q.dialog({
    component: WinUpdateDialog,
    componentProps: {
      title: update.title,
      categories: update.categories || "",
      description: update.description || "",
      supportUrls: update.more_info_urls || [],
    },
  });
}

watch(
  () => agentStore.selectedAgentId,
  (newValue) => {
    if (newValue) {
      updateStore.getAgentUpdates(newValue);
    }
  },
);

// vue lifecycle hooks
onMounted(() => {
  if (agentStore.selectedAgentId) updateStore.getAgentUpdates(agentStore.selectedAgentId);
});
</script>
