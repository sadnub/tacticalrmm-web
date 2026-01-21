<template>
  <div v-if="!selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <tactical-table
      :rows="agentHistory"
      :columns="columns"
      :pagination="{ sortBy: 'time', descending: true, rowsPerPage: 0 }"
      :style="{ 'max-height': `${tabHeight}px` }"
      :loading="isLoading"
      :rows-per-page-options="[0]"
      :filter="filter"
      virtual-scroll
      dense
      binary-state-sort
      column-select
      storage-key="agent-history-tab"
    >
      <template #top>
        <q-btn
          dense
          flat
          push
          icon="refresh"
          @click="selectedAgentId && getAgentHistory(selectedAgentId, { force: true })"
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

      <template #body-cell-output="qprops">
        <q-td :props="qprops">
          <span
            style="cursor: pointer; text-decoration: underline"
            class="text-primary"
            @click="
              qprops.row.type === 'cmd_run'
                ? showCommandOutput(qprops.row.command, qprops.row.results)
                : showScriptOutput(qprops.row.script_results)
            "
            >Output
          </span>
        </q-td>
      </template>
    </tactical-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, watch, onMounted } from "vue";
import { useQuasar, Notify } from "quasar";
import { formatTableColumnText, truncateText } from "src/utils/format";
import { useAgentStore, useDashboardStore } from "src/stores/api";

const { selectedAgentId, agentHistory, isLoading, getAgentHistory } = useAgentStore();
const { tabHeight, formatDate } = useDashboardStore();

// ui imports
import ScriptOutput from "src/core/scripts/components/ScriptOutput.vue";
import PreDialog from "src/core/dashboard/ui/PreDialog.vue";

// type imports
import type { TacticalColumn } from "src/core/dashboard/types";

// static data
const columns: TacticalColumn[] = [
  {
    name: "time",
    label: "Time",
    field: "time",
    align: "left",
    sortable: true,
    format: (val: string) => formatDate(val),
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

// setup main history functionality
const filter = ref("");

watch(selectedAgentId, (newValue) => {
  if (newValue) {
    getAgentHistory(newValue);
  }
});

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
  if (selectedAgentId.value) getAgentHistory(selectedAgentId.value);
});
</script>
