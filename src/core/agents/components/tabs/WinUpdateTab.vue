<template>
  <div v-if="!agentStore.selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else-if="agentPlatform !== 'windows'" class="q-pa-sm">
    Only supported for Windows agents at this time
  </div>
  <div v-else>
    <q-table
      dense
      :table-class="{
        'table-bgcolor': !$q.dark.isActive,
        'table-bgcolor-dark': $q.dark.isActive,
      }"
      class="tabs-tbl-sticky"
      :style="{ 'max-height': tabHeight }"
      :rows="updateStore.updates"
      :columns="columns"
      v-model:pagination="pagination"
      :filter="filter"
      row-key="id"
      binary-state-sort
      virtual-scroll
      :loading="updateStore.isLoading"
      :rows-per-page-options="[0]"
      no-data-label="No Windows Updates"
    >
      <template #top>
        <q-btn
          dense
          flat
          push
          @click="
            agentStore.selectedAgentId && updateStore.getAgentUpdates(agentStore.selectedAgentId)
          "
          icon="refresh"
          class="q-mr-sm"
        />
        <q-btn
          label="Run Update Scan"
          dense
          flat
          push
          no-caps
          @click="
            agentStore.selectedAgentId && updateStore.runAgentUpdateScan(agentStore.selectedAgentId)
          "
          class="q-mr-sm"
        />
        <q-btn
          label="Install Approved Updates"
          dense
          flat
          push
          no-caps
          @click="
            agentStore.selectedAgentId &&
              updateStore.runAgentUpdateInstall(agentStore.selectedAgentId)
          "
          class="q-mr-sm"
        />
        <q-space />

        <q-input v-model="filter" outlined label="Search" dense clearable class="q-pr-sm">
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
        <export-table-btn :data="updateStore.updates" :columns="columns" />
      </template>

      <template #loading>
        <q-inner-loading showing color="primary" />
      </template>

      <template #body="props">
        <q-tr :props="props">
          <q-menu context-menu>
            <q-list dense style="min-width: 100px">
              <q-item
                v-if="!props.row.installed"
                clickable
                v-close-popup
                @click="editWinUpdate(props.row.id, 'inherit')"
              >
                <q-item-section>Inherit</q-item-section>
              </q-item>
              <q-item
                v-if="!props.row.installed"
                clickable
                v-close-popup
                @click="editWinUpdate(props.row.id, 'approve')"
              >
                <q-item-section>Approve</q-item-section>
              </q-item>
              <q-item
                v-if="!props.row.installed"
                clickable
                v-close-popup
                @click="editWinUpdate(props.row.id, 'ignore')"
              >
                <q-item-section>Ignore</q-item-section>
              </q-item>
              <q-item
                v-if="!props.row.installed"
                clickable
                v-close-popup
                @click="editWinUpdate(props.row.id, 'nothing')"
              >
                <q-item-section>Do Nothing</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <!-- policy -->
          <q-td>
            <q-icon v-if="props.row.action === 'nothing'" name="fiber_manual_record" color="grey">
              <q-tooltip>Do Nothing</q-tooltip>
            </q-icon>
            <q-icon v-else-if="props.row.action === 'approve'" name="fas fa-check" color="primary">
              <q-tooltip>Approve</q-tooltip>
            </q-icon>
            <q-icon
              v-else-if="props.row.action === 'ignore'"
              name="fas fa-check"
              :color="dashNegativeColor"
            >
              <q-tooltip>Ignore</q-tooltip>
            </q-icon>
            <q-icon
              v-else-if="props.row.action === 'inherit'"
              name="fiber_manual_record"
              color="accent"
            >
              <q-tooltip>Inherit</q-tooltip>
            </q-icon>
          </q-td>
          <q-td>
            <q-icon v-if="props.row.installed" name="fas fa-check" :color="dashPositiveColor">
              <q-tooltip>Installed</q-tooltip>
            </q-icon>
            <q-icon v-else-if="props.row.action == 'approve'" name="fas fa-tasks" color="primary">
              <q-tooltip>Pending</q-tooltip>
            </q-icon>
            <q-icon
              v-else-if="props.row.action == 'ignore'"
              name="fas fa-ban"
              :color="dashNegativeColor"
            >
              <q-tooltip>Ignored</q-tooltip>
            </q-icon>
            <q-icon v-else name="fas fa-exclamation" :color="dashWarningColor">
              <q-tooltip>Missing</q-tooltip>
            </q-icon>
          </q-td>
          <q-td>{{ !props.row.severity ? "Other" : props.row.severity }}</q-td>
          <q-td>{{ truncateText(props.row.title, 50) }}</q-td>
          <q-td @click="showUpdateDetails(props.row)">
            <span style="cursor: pointer; text-decoration: underline" class="text-primary">{{
              truncateText(props.row.description, 50)
            }}</span>
          </q-td>
          <q-td>{{ dashboardStore.formatDate(props.row.date_installed) }}</q-td>
        </q-tr>
      </template>
    </q-table>
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
import WinUpdateDialog from "src/components/ui/WinUpdateDialog.vue";

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

// inject function to refresh dashboard
// TODO: isolate updates only to the single agent
//const refreshDashboard = inject("refreshDashboard");

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
      dialogStyle: { width: "80vw", maxWidth: "85vw" },
      categories: update.categories,
      description: update.description,
      supportUrls: update.more_info_urls,
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
