<template>
  <q-table
    dense
    :table-class="{
      'table-bgcolor': !$q.dark.isActive,
      'table-bgcolor-dark': $q.dark.isActive,
    }"
    class="remote-bg-tbl-sticky"
    :style="{ 'max-height': `${$q.screen.height - 36}px` }"
    :rows="agentStore.agentProcesses"
    :columns="columns"
    :pagination="{ rowsPerPage: 0, sortBy: 'cpu_percent', descending: true }"
    :filter="filter"
    row-key="id"
    binary-state-sort
    :rows-per-page-options="[0]"
    :loading="agentStore.isLoading"
  >
    <template #top>
      <div class="q-gutter-md flex flex-center items-center">
        <q-btn
          v-if="isActive"
          dense
          flat
          push
          @click="pause"
          icon="stop"
          label="Stop Live Refresh"
        />
        <q-btn
          v-else
          dense
          flat
          push
          @click="resume"
          icon="play_arrow"
          label="Resume Live Refresh"
        />

        <div class="flex flex-center q-ml-md">
          <q-icon name="fas fa-microchip" class="q-mr-xs" />
          <div class="text-caption q-mr-sm">
            CPU Usage:
            <span class="text-body1 text-weight-medium">{{ totalCpuUsage }}%</span>
          </div>

          <q-icon name="fas fa-memory" class="q-mr-xs" />
          <div class="text-caption">
            RAM Usage:
            <span class="text-body1 text-weight-medium"
              >{{ bytes2Human(totalRamUsage) }}/{{ total_ram }} GB</span
            >
          </div>
        </div>

        <q-space />

        <div class="q-pa-md q-gutter-sm">
          <q-btn
            :disable="pollInterval === 1"
            dense
            @click="pollInterval--"
            push
            icon="remove"
            size="sm"
            color="grey"
          />
          <q-btn dense push icon="add" size="sm" color="grey" @click="pollInterval++" />
        </div>

        <div class="text-overline">
          <q-badge align="middle" size="sm" class="text-h6" color="blue" :label="pollInterval" />
          Refresh interval (seconds)
        </div>

        <q-space />

        <q-input v-model="filter" filled label="Search" dense clearable>
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </template>
    <template #body="{ row }">
      <q-tr :props="props" class="cursor-pointer">
        <q-menu context-menu auto-close>
          <q-list dense style="min-width: 200px">
            <q-item clickable @click="agentStore.killAgentProcess(agentId, row.pid)">
              <q-item-section side>
                <q-icon name="fas fa-trash-alt" size="xs" />
              </q-item-section>
              <q-item-section>End Process</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable>
              <q-item-section>Close</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
        <q-td>{{ row.name }}</q-td>
        <q-td>{{ row.cpu_percent }}%</q-td>
        <q-td>{{ bytes2Human(row.membytes) }}</q-td>
        <q-td>{{ row.username }}</q-td>
        <q-td>{{ row.pid }}</q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useIntervalFn } from "@vueuse/core";
import type { QTableProps } from "quasar";
import { useAgentStore } from "../../api";
import { bytes2Human } from "src/utils/format";

const columns: QTableProps["columns"] = [
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "cpu_percent",
    label: "CPU",
    field: "cpu_percent",
    align: "left",
    sortable: true,
    sort: (a: string | number, b: string | number) => parseFloat(String(b)) - parseFloat(String(a)),
  },
  {
    name: "membytes",
    label: "Memory",
    field: "membytes",
    align: "left",
    sortable: true,
  },
  {
    name: "username",
    label: "User",
    field: "username",
    align: "left",
    sortable: true,
  },
  {
    name: "pid",
    label: "PID",
    field: "pid",
    align: "left",
    sortable: true,
  },
];

const props = defineProps<{
  agentId: string;
}>();

// setup stores
const agentStore = useAgentStore();

// polling setup
const pollInterval = ref(2);
const pollIntervalMilli = computed(() => pollInterval.value * 1000);

const { isActive, pause, resume } = useIntervalFn(
  () => {
    agentStore.getAgentProcesses(props.agentId);
  },
  pollIntervalMilli,
  { immediate: true },
);

// process manager logic
const filter = ref("");
const total_ram = computed(() => agentStore.selectedAgent?.total_ram);

const totalCpuUsage = computed(() => {
  if (!Array.isArray(agentStore.agentProcesses) || agentStore.agentProcesses.length === 0) {
    return "0.00";
  }

  const total = agentStore.agentProcesses.reduce((acc, proc) => {
    const cpuPercent = parseFloat(proc.cpu_percent);

    if (isNaN(cpuPercent)) {
      return acc;
    }

    return acc + cpuPercent;
  }, 0);

  return total.toFixed(2);
});

const totalRamUsage = computed(() => {
  if (!agentStore.agentProcesses || agentStore.agentProcesses.length === 0) {
    return 0;
  }

  return agentStore.agentProcesses.reduce((acc, proc) => {
    const memory = Number(proc.membytes) || 0;
    return acc + memory;
  }, 0);
});

onMounted(() => {
  agentStore.getAgent(props.agentId);
});
</script>
