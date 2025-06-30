<template>
  <q-card>
    <q-bar v-if="modal">
      <q-btn
        class="q-mr-sm"
        dense
        flat
        push
        icon="refresh"
        @click="debugLogStore.getDebugLog(requestData)"
      />Debug Log
      <q-space />
      <q-btn v-close-popup dense flat icon="close">
        <q-tooltip content-class="bg-white text-primary">Close</q-tooltip>
      </q-btn>
    </q-bar>
    <tactical-table
      :style="{
        'max-height': !modal ? `${tabHeight}px` : `${$q.screen.height - 33}px`,
      }"
      :rows="debugLogStore.debugLog"
      :columns="columns"
      :title="modal ? 'Debug Logs' : ''"
      :pagination="{ sortBy: 'entry_time', descending: true, rowsPerPage: 0 }"
      :loading="loading"
      :filter="filter"
      virtual-scroll
      dense
      binary-state-sort
      :rows-per-page-options="[0]"
      column-select
      storage-key="debuglog"
    >
      <template #top>
        <q-btn
          v-if="agent"
          class="q-pr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="debugLogStore.getDebugLog(requestData)"
        />
        <tactical-dropdown
          v-if="!agent"
          v-model="requestData.agentFilter"
          class="q-pr-sm"
          style="width: 250px"
          label="Agents Filter"
          :options="agentOptions"
          map-options
          filled
          clearable
          filterable
        />
        <tactical-dropdown
          v-model="requestData.logTypeFilter"
          class="q-pr-sm"
          style="width: 250px"
          label="Log Type Filter"
          :options="logTypeOptions"
          map-options
          filled
          clearable
        />
        <q-radio
          v-model="requestData.logLevelFilter"
          :color="dashInfoColor"
          val="info"
          label="Info"
        />
        <q-radio
          v-model="requestData.logLevelFilter"
          :color="dashNegativeColor"
          val="critical"
          label="Critical"
        />
        <q-radio
          v-model="requestData.logLevelFilter"
          :color="dashNegativeColor"
          val="error"
          label="Error"
        />
        <q-radio
          v-model="requestData.logLevelFilter"
          :color="dashWarningColor"
          val="warning"
          label="Warning"
        />
        <q-space />
        <q-input v-model="filter" filled label="Search" dense clearable class="q-pr-sm">
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
        <export-table-btn :data="debugLogStore.debugLog" :columns="columns" />
      </template>

      <template #top-row>
        <q-tr v-if="debugLogStore.debugLog.length === 1000">
          <q-td colspan="100%">
            <q-icon name="warning" :color="dashWarningColor" />
            Results are limited to 1000 rows.
          </q-td>
        </q-tr>
      </template>
    </tactical-table>
  </q-card>
</template>

<script lang="ts" setup>
// composition api
import { ref, reactive, watch, computed, onMounted } from "vue";
import { type QTableProps } from "quasar";
import { useDebugLogStore } from "../api";
import { useDashboardStore } from "src/stores/dashboard";
import { useAgentDropdown } from "src/core/agents/composables";
import { formatTableColumnText } from "src/utils/format";

// ui components
import TacticalDropdown from "src/components/ui/TacticalDropdown.vue";
import ExportTableBtn from "src/components/ui/ExportTableBtn.vue";
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";

// types
import type { GetDebugLogRequest } from "../types";

// static data
const logTypeOptions = [
  { label: "Agent Update", value: "agent_update" },
  { label: "Agent Issues", value: "agent_issues" },
  { label: "Windows Updates", value: "windows_updates" },
  { label: "System Issues", value: "system_issues" },
  { label: "Scripting", value: "scripting" },
];

const columns: QTableProps["columns"] = [
  {
    name: "entry_time",
    label: "Time",
    field: "entry_time",
    align: "left",
    sortable: true,
    format: (val: string) => dashboardStore.formatDate(val),
  },
  {
    name: "log_level",
    label: "Log Level",
    field: "log_level",
    align: "left",
    sortable: true,
  },
  {
    name: "agent",
    label: "Agent",
    field: "agent",
    align: "left",
    sortable: true,
  },
  {
    name: "log_type",
    label: "Log Type",
    field: "log_type",
    align: "left",
    sortable: true,
    format: (val: string) => formatTableColumnText(val),
  },
  {
    name: "message",
    label: "Message",
    field: "message",
    align: "left",
    sortable: true,
  },
];

const props = defineProps<{
  agent: string;
  modal: boolean;
}>();

// setup stores
const dashboardStore = useDashboardStore();
const debugLogStore = useDebugLogStore();

const tabHeight = computed(() => dashboardStore.tabHeight);
const dashInfoColor = computed(() => dashboardStore.dashboardSettings.dashInfoColor);
const dashNegativeColor = computed(() => dashboardStore.dashboardSettings.dashNegativeColor);
const dashWarningColor = computed(() => dashboardStore.dashboardSettings.dashWarningColor);

// setup dropdowns
const { agentOptions } = useAgentDropdown();

const requestData = reactive<GetDebugLogRequest>({
  agentFilter: props.agent ? props.agent : null,
  logLevelFilter: "info",
  logTypeFilter: null,
});

const loading = ref(false);
const filter = ref("");

if (props.agent) {
  watch(
    () => props.agent,
    (newValue) => {
      if (newValue) {
        requestData.agentFilter = props.agent;
        debugLogStore.getDebugLog(requestData);
      }
    },
  );
}

// watchers
watch(requestData, () => debugLogStore.getDebugLog(requestData), { deep: true });

// vue component hooks
onMounted(() => {
  debugLogStore.getDebugLog(requestData);
});
</script>
