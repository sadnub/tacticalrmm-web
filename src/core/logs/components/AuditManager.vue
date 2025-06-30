<template>
  <q-card>
    <q-bar v-if="modal">
      <q-btn @click="search" class="q-mr-sm" dense flat push icon="refresh" />
      <q-space />Audit Manager
      <q-space />
      <q-btn dense flat icon="close" v-close-popup>
        <q-tooltip class="bg-white text-primary">Close</q-tooltip>
      </q-btn>
    </q-bar>
    <q-table
      @request="onRequest"
      :title="modal ? 'Audit Logs' : ''"
      :rows="auditLogStore.auditLog"
      :columns="columns"
      class="tabs-tbl-sticky"
      :table-class="{
        'table-bgcolor': !$q.dark.isActive,
        'table-bgcolor-dark': $q.dark.isActive,
      }"
      :style="{
        'max-height': !modal ? `${tabHeight}px` : `${$q.screen.height - 33}px`,
      }"
      row-key="id"
      dense
      binary-state-sort
      v-model:pagination="requestData.pagination"
      :rows-per-page-options="[25, 50, 100, 500, 1000]"
      no-data-label="No data found"
      @row-click="openAuditDetail"
      virtual-scroll
      :loading="loading"
    >
      <template #top>
        <q-btn v-if="agent" class="q-pr-sm" dense flat push @click="search" icon="refresh" />
        <q-option-group
          v-if="!agent"
          class="q-pr-sm"
          v-model="filterType"
          :options="filterTypeOptions"
          color="primary"
        />
        <tactical-dropdown
          v-if="filterType === 'agents' && !agent"
          class="q-pr-sm"
          style="width: 200px"
          v-model="requestData.agentFilter"
          :options="agentOptions"
          label="Agent"
          clearable
          map-options
          multiple
          filled
          filterable
        />
        <tactical-dropdown
          v-if="filterType === 'clients' && !agent"
          class="q-pr-sm"
          style="width: 200px"
          v-model="requestData.clientFilter"
          :options="clientOptions"
          label="Clients"
          clearable
          multiple
          filled
          map-options
          filterable
        />
        <tactical-dropdown
          class="q-pr-sm"
          style="width: 200px"
          v-model="requestData.userFilter"
          :options="userOptionsFlat"
          label="Users"
          clearable
          filled
          multiple
        />
        <tactical-dropdown
          class="q-pr-sm"
          style="width: 200px"
          v-model="requestData.actionFilter"
          :options="actionOptions"
          label="Action"
          clearable
          filled
          multiple
          map-options
        />
        <tactical-dropdown
          class="q-pr-sm"
          style="width: 200px"
          v-if="!agent"
          v-model="requestData.objectFilter"
          :options="objectOptions"
          label="Object"
          clearable
          filled
          multiple
          map-options
        />
        <tactical-dropdown
          class="q-pr-sm"
          style="width: 200px"
          v-model="requestData.timeFilter"
          :options="timeOptions"
          label="Time"
          filled
          map-options
        />
        <q-btn v-if="!agent" color="primary" label="Search" @click="search" />

        <q-space />
        <export-table-btn :data="auditLogStore.auditLog" :columns="columns" />
      </template>
      <template #body-cell-action="{ value }">
        <q-td>
          <div>
            <q-badge :color="formatActionColor(value)" :label="value" />
          </div>
        </q-td>
      </template>
    </q-table>
  </q-card>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, reactive, watch, onMounted } from "vue";
import { type QTableProps, useQuasar } from "quasar";
import { useClientDropdown } from "src/core/clients/composables";
import { useAgentDropdown } from "src/core/agents/composables";
import { useUserDropdown } from "src/core/accounts/composables";
import { useDashboardStore } from "src/stores/dashboard";
import { useAuditLogStore } from "../api";
import { formatDate, formatTableColumnText } from "src/utils/format";

// ui imported
import AuditLogDetailModal from "./AuditLogDetailModal.vue";
import ExportTableBtn from "src/components/ui/ExportTableBtn.vue";
import TacticalDropdown from "src/components/ui/TacticalDropdown.vue";

// types
import type { AuditAction, AuditLog, GetAuditLogRequest, Pagination } from "../types";

// static data
const columns: QTableProps["columns"] = [
  {
    name: "entry_time",
    label: "Time",
    field: "entry_time",
    align: "left",
    sortable: true,
    format: (val: string) => formatDate(val),
  },
  {
    name: "username",
    label: "Username",
    field: "username",
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
    name: "client",
    label: "Client",
    field: "site",
    align: "left",
    sortable: true,
    format: (val: string) => (val ? val : ""),
  },
  {
    name: "site",
    label: "Site",
    field: "site",
    align: "left",
    sortable: true,
    format: (val: string) => (val ? val : ""),
  },
  {
    name: "action",
    label: "Action",
    field: "action",
    align: "left",
    sortable: true,
    format: (val: string) => formatTableColumnText(val),
  },
  {
    name: "object_type",
    label: "Object",
    field: "object_type",
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
  {
    name: "client_ip",
    label: "Client IP",
    field: "ip_address",
    align: "left",
    sortable: true,
  },
];

const agentActionOptions = [
  { value: "add", label: "Add Object" },
  { value: "modify", label: "Modify Object" },
  { value: "execute_command", label: "Execute Command" },
  { value: "execute_script", label: "Execute Script" },
  { value: "remote_session", label: "Remote Session" },
  { value: "url_action", label: "URL Action" },
];

const systemActionOptions = [
  { value: "agent_install", label: "Agent Installs" },
  { value: "bulk_action", label: "Bulk Actions" },
  { value: "delete", label: "Delete Object" },
  { value: "failed_login", label: "Failed User login" },
  { value: "login", label: "User Login" },
  { value: "modify", label: "Modify Object" },
  { value: "task_run", label: "Task Run Results" },
];

const objectOptions = [
  { value: "agent", label: "Agent" },
  { value: "automatedtask", label: "Automated Task" },
  { value: "bulk", label: "Bulk Actions" },
  { value: "coresettings", label: "Core Settings" },
  { value: "check", label: "Check" },
  { value: "client", label: "Client" },
  { value: "policy", label: "Policy" },
  { value: "site", label: "Site" },
  { value: "script", label: "Script" },
  { value: "user", label: "User" },
  { value: "winupdatepolicy", label: "Patch Policy" },
  { value: "alerttemplate", label: "Alert Template" },
  { value: "role", label: "Role" },
  { value: "urlaction", label: "URL Action" },
  { value: "keystore", label: "Global Key Store" },
  { value: "customfield", label: "Custom Field" },
];

const timeOptions = [
  { value: 1, label: "1 Day Ago" },
  { value: 7, label: "1 Week Ago" },
  { value: 30, label: "30 Days Ago" },
  { value: 90, label: "3 Months Ago" },
  { value: 180, label: "6 Months Ago" },
  { value: 365, label: "1 Year Ago" },
  { value: 0, label: "Everything" },
];

const filterTypeOptions = [
  {
    label: "Clients",
    value: "clients",
  },
  {
    label: "Agents",
    value: "agents",
  },
];

const props = defineProps<{
  agent: string;
  modal: boolean;
}>();

// setup stores
const auditLogStore = useAuditLogStore();
const dashboardStore = useDashboardStore();

const tabHeight = computed(() => dashboardStore.tabHeight);

// setup dropdowns
const { clientOptions } = useClientDropdown();
const { agentOptions } = useAgentDropdown();
const { userOptionsFlat } = useUserDropdown();

const actionOptions = computed(() =>
  props.agent ? agentActionOptions : agentActionOptions.concat(systemActionOptions),
);

// setup main audit log functionality
const requestData = reactive<GetAuditLogRequest>({
  agentFilter: [],
  userFilter: [],
  actionFilter: [],
  clientFilter: [],
  objectFilter: [],
  timeFilter: 7,
  pagination: {
    rowsPerPage: 25,
    rowsNumber: auditLogStore.rowsNumber,
    sortBy: "entry_time",
    descending: true,
    page: 1,
  },
});

const filterType = ref<"clients" | "agents">("clients");
const loading = ref(false);
const searched = ref(false);

function search() {
  loading.value = true;
  searched.value = true;

  auditLogStore.getAuditLog(requestData);

  loading.value = false;
}

function onRequest(data: { pagination: Pagination }) {
  if (data) {
    requestData.pagination = data.pagination;

    search();
  }
}

// audit detail modal
const { dialog } = useQuasar();
function openAuditDetail(_: Event, log: AuditLog) {
  dialog({
    component: AuditLogDetailModal,
    componentProps: {
      log,
    },
  });
}

function formatActionColor(action: AuditAction) {
  switch (action.toLowerCase()) {
    case "modify":
      return dashboardStore.dashboardSettings.dashWarningColor;
    case "add":
    case "agent_install":
      return dashboardStore.dashboardSettings.dashPositiveColor;
    case "delete":
    case "failed_login":
      return dashboardStore.dashboardSettings.dashNegativeColor;
    default:
      return "primary";
  }
}

watch(filterType, () => {
  requestData.agentFilter = [];
  requestData.clientFilter = [];
});

if (props.agent) {
  requestData.agentFilter = [props.agent];
  watch([requestData.userFilter, requestData.actionFilter, requestData.timeFilter], search);
  watch(
    () => props.agent,
    (newValue) => {
      if (newValue) {
        requestData.agentFilter = [props.agent];
        search();
      }
    },
  );
}

onMounted(() => {
  if (props.agent) {
    search();
  }
});
</script>
