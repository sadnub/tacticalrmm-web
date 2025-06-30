<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 80vw">
      <q-bar>
        {{ evtLogData.readable_desc }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <div v-if="evtLogData.check_result?.extra_details">
        <tactical-table
          v-model:pagination="pagination"
          dense
          style="height: 65vh"
          :filter="filter"
          :rows="evtLogData.check_result?.extra_details.log"
          :columns="columns"
          row-key="uid"
          binary-state-sort
          virtual-scroll
          :rows-per-page-options="[0]"
          no-data-label="No event logs"
          column-select
          storage-key="eventlog-output"
        >
          <template #top>
            <q-space />
            <q-input v-model="filter" filled label="Search" dense clearable class="q-pr-sm">
              <template #prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
            <export-table-btn
              :data="evtLogData.check_result?.extra_details.log"
              :columns="columns"
            />
          </template>
        </tactical-table>
      </div>
      <div v-else>Check has not run yet</div>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { ref } from "vue";
import type { QTableProps } from "quasar";
import { useDialogPluginComponent } from "quasar";

//ui imports
import ExportTableBtn from "src/components/ui/ExportTableBtn.vue";
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";

// type imports
import type { Check } from "../types";

// static data
const columns: QTableProps["columns"] = [
  {
    name: "eventType",
    label: "Type",
    field: "eventType",
    align: "left",
    sortable: true,
  },
  {
    name: "source",
    label: "Source",
    field: "source",
    align: "left",
    sortable: true,
  },
  {
    name: "eventID",
    label: "Event ID",
    field: "eventID",
    align: "left",
    sortable: true,
  },
  { name: "time", label: "Time", field: "time", align: "left", sortable: true },
  {
    name: "message",
    label: "Message",
    field: "message",
    align: "left",
    sortable: true,
  },
];

defineEmits(useDialogPluginComponent.emits);

defineProps<{
  evtLogData: Check;
}>();

// setup quasar
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const filter = ref("");
const pagination = ref({
  rowsPerPage: 0,
  sortBy: "time",
  descending: true,
});
</script>
