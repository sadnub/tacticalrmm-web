<template>
  <div v-if="selectedAgentIds.length === 0" class="q-pa-sm">No agent selected</div>
  <div v-else-if="selectedAgentIds.length > 1"></div>
  <div v-else-if="selectedAgentPlatform !== 'windows'" class="q-pa-sm">
    Only supported for Windows agents at this time
  </div>
  <div v-else>
    <tactical-table
      v-model:pagination="pagination"
      dense
      :style="{ 'max-height': `${tabHeight}px` }"
      :rows="updates"
      :columns="columns"
      :filter="filter"
      row-key="id"
      binary-state-sort
      virtual-scroll
      :loading="isLoading"
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
          @click="selectedAgentId && getAgentUpdates(selectedAgentId, { force: true })"
        />
        <q-btn
          label="Run Update Scan"
          dense
          flat
          push
          no-caps
          class="q-mr-sm"
          @click="selectedAgentId && runAgentUpdateScan(selectedAgentId)"
        />
        <q-btn
          label="Install Approved Updates"
          dense
          flat
          push
          no-caps
          class="q-mr-sm"
          @click="selectedAgentId && runAgentUpdateInstall(selectedAgentId)"
        />
        <q-space />

        <q-input v-model="filter" filled label="Search" dense clearable class="q-pr-sm" style="width: 300px">
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
        <tactical-table-export />
      </template>

      <template #loading>
        <q-inner-loading showing color="primary" />
      </template>

      <template #body="props">
        <q-tr :props="props">
          <!-- context menu-->
          <q-menu context-menu>
            <q-list dense style="min-width: 100px">
              <q-item
                v-if="!props.row.installed"
                v-close-popup
                clickable
                @click="editWinUpdate(props.row.id, 'inherit')"
              >
                <q-item-section>Inherit</q-item-section>
              </q-item>
              <q-item
                v-if="!props.row.installed"
                v-close-popup
                clickable
                @click="editWinUpdate(props.row.id, 'approve')"
              >
                <q-item-section>Approve</q-item-section>
              </q-item>
              <q-item
                v-if="!props.row.installed"
                v-close-popup
                clickable
                @click="editWinUpdate(props.row.id, 'ignore')"
              >
                <q-item-section>Ignore</q-item-section>
              </q-item>
              <q-item
                v-if="!props.row.installed"
                v-close-popup
                clickable
                @click="editWinUpdate(props.row.id, 'nothing')"
              >
                <q-item-section>Do Nothing</q-item-section>
              </q-item>
            </q-list>
          </q-menu>

          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <!-- action -->
            <template v-if="col.name === 'action'">
              <q-icon v-if="col.value === 'nothing'" name="fiber_manual_record" color="grey">
                <q-tooltip>Do Nothing</q-tooltip>
              </q-icon>
              <q-icon v-else-if="col.value === 'approve'" name="fas fa-check" color="primary">
                <q-tooltip>Approve</q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="col.value === 'ignore'"
                name="fas fa-check"
                :color="dashNegativeColor"
              >
                <q-tooltip>Ignore</q-tooltip>
              </q-icon>
              <q-icon v-else-if="col.value === 'inherit'" name="fiber_manual_record" color="accent">
                <q-tooltip>Inherit</q-tooltip>
              </q-icon>
            </template>

            <!-- installed -->
            <template v-else-if="col.name === 'installed'">
              <q-icon v-if="col.value" name="fas fa-check" :color="dashPositiveColor">
                <q-tooltip>Installed</q-tooltip>
              </q-icon>
              <q-icon v-else-if="col.value == 'approve'" name="fas fa-tasks" color="primary">
                <q-tooltip>Pending</q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="col.value == 'ignore'"
                name="fas fa-ban"
                :color="dashNegativeColor"
              >
                <q-tooltip>Ignored</q-tooltip>
              </q-icon>
              <q-icon v-else name="fas fa-exclamation" :color="dashWarningColor">
                <q-tooltip>Missing</q-tooltip>
              </q-icon>
            </template>

            <!-- title -->
            <template v-else-if="col.name === 'title'">
              <truncate-text :text="col.value" />
            </template>

            <!-- description -->
            <template v-else-if="col.name === 'description'">
              <span
                style="cursor: pointer; text-decoration: underline"
                class="text-primary"
                @click="showUpdateDetails(props.row)"
              >
                <truncate-text :text="col.value" />
              </span>
            </template>

            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
    </tactical-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, watch, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useAgentStore, useWindowsUpdateStore, useDashboardStore } from "src/stores/api";

const { selectedAgentPlatform, selectedAgentId, selectedAgentIds } = useAgentStore();
const { updates, isLoading, getAgentUpdates, runAgentUpdateScan, runAgentUpdateInstall, updateAgentUpdate } = useWindowsUpdateStore();
const { dashboardSettings, tabHeight, formatDate } = useDashboardStore();

// ui imports
import WinUpdateDialog from "./WinUpdateDialog.vue";

// type imports
import type { WindowsUpdate, PatchAction } from "../../types";
import type { TacticalColumn } from "src/core/dashboard/types";

// static data
const columns: TacticalColumn[] = [
  {
    name: "action",
    field: "action",
    label: "Action",
    align: "left",
  },
  {
    name: "installed",
    field: "installed",
    label: "Installed",
    align: "left",
  },
  {
    name: "severity",
    label: "Severity",
    field: "severity",
    align: "left",
    sortable: true,
    format: (val: string) => (val ? val : "Other"),
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
    format: (val: string) => formatDate(val),
  },
];

const dashPositiveColor = computed(() => dashboardSettings.dashPositiveColor);
const dashNegativeColor = computed(() => dashboardSettings.dashNegativeColor);
const dashWarningColor = computed(() => dashboardSettings.dashWarningColor);

// setup quasar
const $q = useQuasar();

// setup win update tab component
const filter = ref("");
const pagination = ref({
  rowsPerPage: 0,
  sortBy: "installed",
  descending: false,
});

async function editWinUpdate(id: number, action: PatchAction) {
  await updateAgentUpdate(id, { action });

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

watch(selectedAgentId, (newValue) => {
  if (newValue) {
    getAgentUpdates(newValue);
  }
});

// vue lifecycle hooks
onMounted(() => {
  if (selectedAgentId.value) getAgentUpdates(selectedAgentId.value);
});
</script>
