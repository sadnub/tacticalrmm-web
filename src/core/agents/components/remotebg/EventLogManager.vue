<template>
  <div v-if="agentPlatform.toLowerCase() !== 'windows'" class="q-pa-sm">
    Only supported for Windows agents at this time
  </div>
  <div v-else>
    <div class="row q-pt-sm q-pl-sm">
      <div class="col-2">
        <q-select
          dense
          options-dense
          outlined
          v-model="days"
          :options="lastDaysOptions"
          :label="showDays"
        />
      </div>
      <div class="col-7"></div>
      <div class="col-3">
        <code v-if="agentStore.agentEventLog"
          >{{ logType }} log total records: {{ agentStore.agentEventLog.length }}</code
        >
      </div>
    </div>
    <q-table
      dense
      :table-class="{
        'table-bgcolor': !$q.dark.isActive,
        'table-bgcolor-dark': $q.dark.isActive,
      }"
      class="remote-bg-tbl-sticky"
      :rows="agentStore.agentEventLog"
      :columns="columns"
      :style="{ 'max-height': `${$q.screen.height - 85}px` }"
      :pagination="{ rowsPerPage: 0, sortBy: 'record', descending: true }"
      :filter="filter"
      row-key="uid"
      binary-state-sort
      virtual-scroll
      :rows-per-page-options="[0]"
      :loading="agentStore.isLoading"
    >
      <template #top>
        <q-btn
          dense
          flat
          push
          @click="agentStore.getAgentEventLog(props.agentId, logType, days)"
          icon="refresh"
        />
        <q-space />
        <q-radio
          v-model="logType"
          color="cyan"
          val="Application"
          label="Application"
          @update:model-value="agentStore.getAgentEventLog(props.agentId, logType, days)"
        />
        <q-radio v-model="logType" color="cyan" val="System" label="System" />
        <q-radio v-model="logType" color="cyan" val="Security" label="Security" />
        <q-space />
        <q-input v-model="filter" style="width: 300px" outlined label="Search" dense clearable>
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <!-- file download doesn't work so disabling -->
        <export-table-btn
          v-show="false"
          class="q-ml-sm"
          :columns="columns"
          :data="agentStore.agentEventLog"
        />
      </template>
      <template #body="{ row }">
        <q-tr>
          <q-td>{{ row.eventType }}</q-td>
          <q-td>{{ row.source }}</q-td>
          <q-td>{{ row.eventID }}</q-td>
          <q-td>{{ row.time }}</q-td>
          <q-td @click="showEventMessage(row.message)">
            <span style="cursor: pointer; text-decoration: underline" class="text-primary">{{
              truncateText(row.message, 30)
            }}</span>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, watch, onMounted } from "vue";
import { useQuasar, type QTableProps } from "quasar";
import { useAgentStore } from "../../api";
import { truncateText } from "src/utils/format";

// ui imports
import ExportTableBtn from "src/components/ui/ExportTableBtn.vue";
import PreDialog from "src/components/ui/PreDialog.vue";

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
    label: "Message (click to view full)",
    field: "message",
    align: "left",
    sortable: true,
  },
];

// setup stores
const agentStore = useAgentStore();

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

watch([logType, days], () => agentStore.getAgentEventLog(props.agentId, logType.value, days.value));

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
    agentStore.getAgentEventLog(props.agentId, logType.value, days.value);
});
</script>
