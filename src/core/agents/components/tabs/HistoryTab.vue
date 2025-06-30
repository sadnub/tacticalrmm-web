<template>
  <div v-if="!agentStore.selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <q-table
      :table-class="{
        'table-bgcolor': !$q.dark.isActive,
        'table-bgcolor-dark': $q.dark.isActive,
      }"
      :rows="agentStore.agentHistory"
      :columns="columns"
      :pagination="{ sortBy: 'time', descending: true, rowsPerPage: 0 }"
      :style="{ 'max-height': tabHeight }"
      :loading="agentStore.isLoading"
      :rows-per-page-options="[0]"
      :filter="filter"
      virtual-scroll
      dense
      binary-state-sort
    >
      <template #top>
        <q-btn
          dense
          flat
          push
          @click="
            agentStore.selectedAgentId && agentStore.getAgentHistory(agentStore.selectedAgentId)
          "
          icon="refresh"
        />
        <q-space />
        <q-input v-model="filter" filled label="Search" dense clearable class="q-pr-sm">
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
        </q-input>
        <export-table-btn :data="agentStore.agentHistory" :columns="columns" />
      </template>

      <template #loading>
        <q-inner-loading showing color="primary" />
      </template>

      <template #body-cell-output="props">
        <q-td :props="props">
          <span
            style="cursor: pointer; text-decoration: underline"
            class="text-primary"
            @click="
              props.row.type === 'cmd_run'
                ? showCommandOutput(props.row.command, props.row.results)
                : showScriptOutput(props.row.script_results)
            "
            >Output
          </span>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, watch, onMounted } from "vue";
import { useQuasar, Notify, type QTableProps } from "quasar";
import { formatTableColumnText, truncateText } from "src/utils/format";
import { useAgentStore } from "../../api";
import { useDashboardStore } from "src/stores/dashboard";

// ui imports
import ScriptOutput from "src/core/scripts/components/ScriptOutput.vue";
import ExportTableBtn from "src/components/ui/ExportTableBtn.vue";
import PreDialog from "src/components/ui/PreDialog.vue";

// setup stores
const dashboardStore = useDashboardStore();

// static data
const columns: QTableProps["columns"] = [
  {
    name: "time",
    label: "Time",
    field: "time",
    align: "left",
    sortable: true,
    format: (val: string) => dashboardStore.formatDate(val),
  },
  {
    name: "type",
    label: "Action",
    field: "type",
    align: "left",
    sortable: true,
    format: (val) => formatTableColumnText(val),
  },
  /* {
    name: "status",
    label: "Status",
    field: "status",
    align: "left",
    sortable: true,
    format: (val, row) => formatTableColumnText(val),
  }, */
  {
    name: "command",
    label: "Script/Command",
    field: (row) => (row.type === "script_run" ? row.script_name : row.command),
    align: "left",
    sortable: true,
    format: (val) => truncateText(val, 30),
  },
  {
    name: "username",
    label: "Initiated By",
    field: "username",
    align: "left",
    sortable: true,
  },
  {
    name: "output",
    label: "Output",
    field: "output",
    align: "left",
    sortable: true,
  },
];

const $q = useQuasar();

const agentStore = useAgentStore();
const tabHeight = computed(() => dashboardStore.tabHeight);

// setup main history functionality
const filter = ref("");

watch(
  () => agentStore.selectedAgentId,
  (newValue) => {
    if (newValue) {
      agentStore.getAgentHistory(newValue);
    }
  },
);

// quasar dialogs
function showScriptOutput(output: string) {
  if (!output) {
    Notify.create({
      message: "No output is available yet",
      type: "negative",
    });
    return;
  }
  $q.dialog({
    component: ScriptOutput,
    componentProps: {
      scriptInfo: output,
    },
  });
}

function showCommandOutput(title: string, output: string) {
  $q.dialog({
    component: PreDialog,
    componentProps: {
      title: title,
      dialogStyle: "width: 70vw; max-width: 80vw",
      message: output,
    },
  });
}

// vue component hooks
onMounted(() => {
  if (agentStore.selectedAgentId) agentStore.getAgentHistory(agentStore.selectedAgentId);
});
</script>
