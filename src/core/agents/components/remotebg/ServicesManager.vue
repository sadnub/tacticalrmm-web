<template>
  <div v-if="agentPlatform.toLowerCase() !== 'windows'" class="q-pa-sm">
    Only supported for Windows agents at this time
  </div>
  <tactical-table
    v-else
    dense
    :style="{ 'max-height': `${$q.screen.height - 36}px` }"
    :rows="services"
    :columns="columns"
    :pagination="{ rowsPerPage: 0, sortBy: 'display_name', descending: false }"
    :filter="filter"
    row-key="display_name"
    binary-state-sort
    :rows-per-page-options="[0]"
    :loading="agentStore.isLoading"
    column-select
    storage-key="services-manager"
  >
    <template #top>
      <q-btn dense flat push icon="refresh" @click="agentStore.getAgentServices(agentId)" />
      <q-space />
      <q-input v-model="filter" filled label="Search" dense clearable>
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
      <tactical-table-export />
    </template>
    <template #body="bodyProps">
      <q-tr class="cursor-pointer" @dblclick="showServiceDetail(bodyProps.row)">
        <q-menu context-menu auto-close>
          <q-list dense style="min-width: 200px">
            <q-item
              clickable
              @click="agentStore.sendAgentServiceAction(agentId, bodyProps.row.name, 'start')"
            >
              <q-item-section>Start</q-item-section>
            </q-item>
            <q-item
              clickable
              @click="agentStore.sendAgentServiceAction(agentId, bodyProps.row.name, 'stop')"
            >
              <q-item-section>Stop</q-item-section>
            </q-item>
            <q-item
              clickable
              @click="agentStore.sendAgentServiceAction(agentId, bodyProps.row.name, 'restart')"
            >
              <q-item-section>Restart</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable @click="showServiceDetail(bodyProps.row)">
              <q-item-section>Service Details</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable>
              <q-item-section>Close</q-item-section>
            </q-item>
          </q-list>
        </q-menu>

        <q-td v-for="col in bodyProps.cols" :key="col.name" :props="props">
          <template v-if="col.name === 'display_name'">
            <q-icon name="fas fa-cogs" />
            <truncate-text :text="col.value" />
          </template>

          <template v-else>
            {{ col.value }}
          </template>
        </q-td>
      </q-tr>
    </template>
  </tactical-table>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useAgentStore } from "../../api";

// ui imports
import ServiceDetail from "src/components/agents/remotebg/ServiceDetail.vue";

// type imports
import type { AgentService } from "../../types";
import type { TacticalColumn } from "src/core/dashboard/types";

// static data
const columns: TacticalColumn[] = [
  {
    name: "display_name",
    label: "Display Name",
    field: "display_name",
    align: "left",
    sortable: true,
  },
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "start_type",
    label: "Startup",
    field: "start_type",
    align: "left",
    sortable: true,
    format: (val, row) => {
      return val.toLowerCase() === "automatic" && row.autodelay
        ? `${row.start_type} (Delayed)`
        : `${row.start_type}`;
    },
  },
  {
    name: "pid",
    label: "PID",
    field: "pid",
    align: "left",
    sortable: true,
    format: (val: number) => (val === 0 ? "" : String(val)),
  },
  {
    name: "status",
    label: "Status",
    field: "status",
    align: "left",
    sortable: true,
  },
  {
    name: "username",
    label: "Log On As",
    field: "username",
    align: "left",
    sortable: true,
    format: (val: string) => (val ? val : "LocalSystem"),
  },
];

const props = defineProps<{
  agentId: string;
  agentPlatform: string;
}>();

// quasar setup
const $q = useQuasar();

// setup stores
const agentStore = useAgentStore();

// services manager setup
const services = computed(() => agentStore.selectedAgent?.services || []);
const filter = ref("");

function showServiceDetail(service: AgentService) {
  $q.dialog({
    component: ServiceDetail,
    componentProps: {
      service: service,
      agentId: props.agentId,
    },
  });
}

// vue lifecycle hooks
onMounted(() => {
  if (props.agentPlatform === "windows") agentStore.getAgentServices(props.agentId);
});
</script>
