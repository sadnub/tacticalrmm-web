<template>
  <div v-if="agentPlatform.toLowerCase() !== 'windows'" class="q-pa-sm">
    Only supported for Windows agents at this time
  </div>
  <div v-else>
    <div class="row q-pt-sm q-pl-sm">
      <div class="col-2">
        <q-select
          v-model="days"
          dense
          options-dense
          filled
          :options="lastDaysOptions"
          :label="showDays"
        />
      </div>
      <div class="col-7"></div>
      <div class="col-3">
        <code v-if="agentEventLog">{{ logType }} log total records: {{ agentEventLogCount }}</code>
      </div>
    </div>
    <tactical-table
      dense
      :rows="agentEventLog"
      :columns="columns"
      :style="{ 'max-height': `${$q.screen.height - 85}px` }"
      :pagination="{ rowsPerPage: 0, sortBy: 'record', descending: true }"
      :filter="filter"
      row-key="uid"
      binary-state-sort
      virtual-scroll
      :rows-per-page-options="[0]"
      :loading="isLoading"
      column-select
      storage-key="eventlog-manager"
    >
      <template #top>
        <q-btn
          dense
          flat
          push
          icon="refresh"
          @click="getAgentEventLog(agentId, logType, days)"
        />
        <q-space />
        <q-radio
          v-model="logType"
          color="cyan"
          val="Application"
          label="Application"
          @update:model-value="getAgentEventLog(agentId, logType, days)"
        />
        <q-radio v-model="logType" color="cyan" val="System" label="System" />
        <q-radio v-model="logType" color="cyan" val="Security" label="Security" />
        <q-space />
        <q-input
          v-model="filter"
          style="width: 300px"
          filled
          label="Search"
          dense
          clearable
          class="q=pr-sm"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <tactical-table-export />
      </template>
      <template #body-cell-message="cellProps">
        <q-td :props="cellProps" @click="showEventMessage(cellProps.value)">
          <span style="cursor: pointer; text-decoration: underline" class="text-primary">
            <truncate-text :text="cellProps.value" />
          </span>
        </q-td>
      </template>
    </tactical-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, watch, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useAgentStore } from "src/stores/api";

const { agentEventLog, agentEventLogCount, isLoading, getAgentEventLog } = useAgentStore();

// ui imports
import PreDialog from "src/core/dashboard/ui/PreDialog.vue";
import type { TacticalColumn } from "src/core/dashboard/types";

// static data
const columns: TacticalColumn[] = [
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
    label: "Message (click to view full)",
    field: "message",
    align: "left",
    sortable: true,
  },
];

const lastDaysOptions = [1, 2, 3, 4, 5, 10, 30, 60, 90, 180, 360, 9999];

const props = defineProps<{
  agentId: string;
  agentPlatform: string;
}>();

// quasar setup
const $q = useQuasar();

// eventlog manager
const logType = ref<"Application" | "System" | "Security">("Application");
const days = ref(1);
const filter = ref("");

const showDays = computed(() => `Show last ${days.value} days`);

watch([logType, days], () => getAgentEventLog(props.agentId, logType.value, days.value));

function showEventMessage(message: string) {
  $q.dialog({
    component: PreDialog,
    componentProps: {
      dialogStyle: "width: 85vw; max-width: 90vw",
      message: message,
    },
  });
}

// vue lifecycle hooks
onMounted(() => {
  if (props.agentPlatform === "windows")
    getAgentEventLog(props.agentId, logType.value, days.value);
});
</script>
