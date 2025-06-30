<template>
  <div v-if="agentPlatform.toLowerCase() !== 'windows'" class="q-pa-sm">
    Only supported for Windows agents at this time
  </div>
  <q-table
    v-else
    dense
    :table-class="{
      'table-bgcolor': !$q.dark.isActive,
      'table-bgcolor-dark': $q.dark.isActive,
    }"
    class="remote-bg-tbl-sticky"
    :style="{ 'max-height': `${$q.screen.height - 36}px` }"
    :rows="services"
    :columns="columns"
    :pagination="{ rowsPerPage: 0, sortBy: 'display_name', descending: false }"
    :filter="filter"
    row-key="display_name"
    binary-state-sort
    :rows-per-page-options="[0]"
    :loading="agentStore.isLoading"
  >
    <template #top>
      <q-btn dense flat push @click="agentStore.getAgentServices(agentId)" icon="refresh" />
      <q-space />
      <q-input v-model="filter" filled label="Search" dense clearable>
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
      <!-- file download doesn't work so disabling -->
      <export-table-btn v-show="false" class="q-ml-sm" :columns="columns" :data="services" />
    </template>
    <template #body="{ row }">
      <q-tr class="cursor-pointer" @dblclick="showServiceDetail(row)">
        <q-menu context-menu auto-close>
          <q-list dense style="min-width: 200px">
            <q-item
              clickable
              @click="agentStore.sendAgentServiceAction(agentId, row.name, 'start')"
            >
              <q-item-section>Start</q-item-section>
            </q-item>
            <q-item clickable @click="agentStore.sendAgentServiceAction(agentId, row.name, 'stop')">
              <q-item-section>Stop</q-item-section>
            </q-item>
            <q-item
              clickable
              @click="agentStore.sendAgentServiceAction(agentId, row.name, 'restart')"
            >
              <q-item-section>Restart</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable @click="showServiceDetail(row)">
              <q-item-section>Service Details</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable>
              <q-item-section>Close</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
        <q-td key="display_name" :props="props">
          <q-icon name="fas fa-cogs" />
          &nbsp;&nbsp;&nbsp;{{ truncateText(row.display_name, 30) }}
        </q-td>
        <q-td key="name" :props="props">{{ row.name }}</q-td>
        <q-td key="start_type" :props="props">{{
          row.start_type.toLowerCase() === "automatic" && row.autodelay
            ? `${row.start_type} (Delayed)`
            : `${row.start_type}`
        }}</q-td>
        <q-td key="pid" :props="props">{{ row.pid === 0 ? "" : row.pid }}</q-td>
        <q-td key="status" :props="props">{{ row.status }}</q-td>
        <q-td key="username" :props="props">{{ row.username ? row.username : "LocalSystem" }}</q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, onMounted } from "vue";
import { useQuasar, type QTableColumn } from "quasar";
import { truncateText } from "src/utils/format";
import { useAgentStore } from "../../api";

// ui imports
import ServiceDetail from "src/components/agents/remotebg/ServiceDetail.vue";
import ExportTableBtn from "src/components/ui/ExportTableBtn.vue";

// type imports
import type { AgentService } from "../../types";

// static data
const columns: QTableColumn[] = [
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
  },
  {
    name: "pid",
    label: "PID",
    field: "pid",
    align: "left",
    sortable: true,
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
