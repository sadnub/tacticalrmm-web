<template>
  <tactical-table
    v-model:pagination="pagination"
    :rows="checks"
    :columns="columns"
    :rows-per-page-options="[0]"
    row-key="id"
    binary-state-sort
    dense
    virtual-scroll
    column-select
    :filter="filter"
    :loading="isLoading"
    storage-key="policy-checks"
  >
    <template #top>
      <q-btn
        v-if="!!selectedPolicy"
        class="q-mr-sm"
        dense
        flat
        push
        icon="refresh"
        @click="getPolicyChecks(selectedPolicy, { force: true })"
      />
      <q-btn-dropdown v-if="!!selectedPolicy" icon="add" label="New" no-caps dense flat>
        <q-list dense style="min-width: 200px">
          <q-item v-close-popup clickable @click="showCheckModal('diskspace')">
            <q-item-section side>
              <q-icon size="xs" name="far fa-hdd" />
            </q-item-section>
            <q-item-section>Disk Space Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('ping')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-network-wired" />
            </q-item-section>
            <q-item-section>Ping Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('cpuload')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-microchip" />
            </q-item-section>
            <q-item-section>CPU Load Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('memory')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-memory" />
            </q-item-section>
            <q-item-section>Memory Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('winsvc')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-cogs" />
            </q-item-section>
            <q-item-section>Windows Service Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('script')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-terminal" />
            </q-item-section>
            <q-item-section>Script Check</q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="showCheckModal('eventlog')">
            <q-item-section side>
              <q-icon size="xs" name="fas fa-clipboard-list" />
            </q-item-section>
            <q-item-section>Event Log Check</q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <q-space />
      <q-input
        v-model="filter"
        filled
        label="Search"
        dense
        clearable
        class="q-pr-sm"
        style="width: 300px"
      >
        <template #prepend>
          <q-icon name="search" color="primary" />
        </template>
      </q-input>
      <tactical-table-export />
    </template>
    <!-- No data Slot -->
    <template #no-data>
      <div class="full-width row flex-center q-gutter-sm">
        <span v-if="!selectedPolicy">Click on a policy to see the checks</span>
        <span v-else>There are no checks added to this policy</span>
      </div>
    </template>
    <!-- header slots -->
    <template #header-cell-smsalert="headerProps">
      <q-th auto-width :props="headerProps">
        <q-icon name="phone_android" size="1.5em">
          <q-tooltip>SMS Alert</q-tooltip>
        </q-icon>
      </q-th>
    </template>
    <template #header-cell-emailalert="headerProps">
      <q-th auto-width :props="headerProps">
        <q-icon name="email" size="1.5em">
          <q-tooltip>Email Alert</q-tooltip>
        </q-icon>
      </q-th>
    </template>
    <template #header-cell-dashboardalert="headerProps">
      <q-th auto-width :props="headerProps">
        <q-icon name="notifications" size="1.5em">
          <q-tooltip>Dashboard Alert</q-tooltip>
        </q-icon>
      </q-th>
    </template>
    <template #header-cell-statusicon="headerProps">
      <q-th auto-width :props="headerProps"></q-th>
    </template>
    <!-- body slots -->
    <template #body="bodyProps">
      <q-tr
        :props="bodyProps"
        class="cursor-pointer"
        @dblclick="showCheckModal(bodyProps.row.check_type, bodyProps.row)"
      >
        <!-- context menu -->
        <q-menu context-menu>
          <q-list dense style="min-width: 200px">
            <q-item
              v-close-popup
              clickable
              @click="showCheckModal(bodyProps.row.check_type, bodyProps.row)"
            >
              <q-item-section side>
                <q-icon name="edit" />
              </q-item-section>
              <q-item-section>Edit</q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="deleteCheck(bodyProps.row)">
              <q-item-section side>
                <q-icon name="delete" />
              </q-item-section>
              <q-item-section>Delete</q-item-section>
            </q-item>

            <q-separator></q-separator>

            <q-item v-close-popup clickable @click="showPolicyStatus(bodyProps.row)">
              <q-item-section side>
                <q-icon name="sync" />
              </q-item-section>
              <q-item-section>Policy Status</q-item-section>
            </q-item>

            <q-separator></q-separator>

            <q-item v-close-popup clickable>
              <q-item-section>Close</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
        <q-td v-for="col in bodyProps.cols" :key="col.name" :props="bodyProps">
          <!-- sms alert -->
          <template v-if="col.name === 'smsalert'">
            <q-checkbox
              v-model="bodyProps.row.text_alert"
              dense
              @update:model-value="(val) => checkAlert(bodyProps.row.id, { text_alert: val })"
            />
          </template>

          <!-- email alert -->
          <template v-else-if="col.name === 'emailalert'">
            <q-checkbox
              v-model="bodyProps.row.email_alert"
              dense
              @update:model-value="(val) => checkAlert(bodyProps.row.id, { email_alert: val })"
            />
          </template>

          <!-- dashboard alert -->
          <template v-else-if="col.name === 'dashboardalert'">
            <q-checkbox
              v-model="bodyProps.row.dashboard_alert"
              dense
              @update:model-value="(val) => checkAlert(bodyProps.row.id, { dashboard_alert: val })"
            />
          </template>

          <!-- description -->
          <template v-else-if="col.name === 'desc'">
            {{ bodyProps.row.readable_desc }}
          </template>

          <!-- status -->
          <template v-else-if="col.name === 'status'">
            <span class="status-cell text-primary" @click="showPolicyStatus(bodyProps.row)"
              >See Status</span
            >
          </template>

          <!-- assigned task -->
          <template v-else-if="col.name === 'assigned_task'">
            <span v-if="bodyProps.row.assignedtasks.length > 1"
              >{{ bodyProps.row.assignedtasks.length }} Tasks</span
            >
            <span v-else-if="bodyProps.row.assignedtasks.length === 1">{{
              bodyProps.row.assignedtasks[0].name
            }}</span>
          </template>

          <!-- default fallback -->
          <template v-else>
            {{ col.value }}
          </template>
        </q-td>
      </q-tr>
    </template>
  </tactical-table>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from "vue";
import { useQuasar } from "quasar";
import { usePolicyChecksStore } from "src/stores/api";

const {
  policyChecks: checks,
  isLoading,
  getPolicyChecks,
  updateCheck,
  removeCheck,
} = usePolicyChecksStore();
import PolicyStatus from "./PolicyStatus.vue";
import DiskSpaceCheck from "src/core/checks/components/DiskSpaceCheck.vue";
import PingCheck from "src/core/checks/components/PingCheck.vue";
import CpuLoadCheck from "src/core/checks/components/CpuLoadCheck.vue";
import MemCheck from "src/core/checks/components/MemCheck.vue";
import WinSvcCheck from "src/core/checks/components/WinSvcCheck.vue";
import ScriptCheck from "src/core/checks/components/ScriptCheck.vue";
import EventLogCheck from "src/core/checks/components/EventLogCheck.vue";

// types
import type { Check } from "src/core/checks/types";
import type { TacticalColumn } from "src/core/dashboard/types";

const props = defineProps<{
  selectedPolicy: number;
}>();

const $q = useQuasar();

const columns = [
  { name: "smsalert", label: "SMS Alert", field: "text_alert", align: "left" as const },
  { name: "emailalert", label: "Email Alert", field: "email_alert", align: "left" as const },
  {
    name: "dashboardalert",
    label: "Dashboard Alert",
    field: "dashboard_alert",
    align: "left" as const,
  },
  {
    name: "desc",
    field: "readable_desc",
    label: "Description",
    align: "left",
    sortable: true,
  },
  { name: "status", label: "Status", field: "status", align: "left" },
  {
    name: "assigned_task",
    label: "Assigned Tasks",
    field: "assigned_task",
    align: "left",
    sortable: true,
  },

  // Common fields
  {
    name: "check_name",
    label: "Name",
    field: "name",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: string | null) => val ?? "-",
  },
  {
    name: "check_type",
    label: "Check Type",
    field: "check_type",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: string) => {
      const typeMap: Record<string, string> = {
        diskspace: "Disk Space",
        ping: "Ping",
        cpuload: "CPU Load",
        memory: "Memory",
        winsvc: "Win Service",
        script: "Script",
        eventlog: "Event Log",
      };
      return typeMap[val] ?? val;
    },
  },
  {
    name: "alert_severity",
    label: "Alert Severity",
    field: "alert_severity",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: string | null) => (val ? val.charAt(0).toUpperCase() + val.slice(1) : "-"),
  },
  {
    name: "fails_b4_alert",
    label: "Fails Before Alert",
    field: "fails_b4_alert",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: number | undefined) => (val != null ? String(val) : "-"),
  },
  {
    name: "run_interval",
    label: "Run Interval",
    field: "run_interval",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: number) => {
      if (!val) return "Inherited";
      if (val < 60) return `${val}s`;
      if (val < 3600) return `${Math.floor(val / 60)}m`;
      return `${Math.floor(val / 3600)}h ${Math.floor((val % 3600) / 60)}m`;
    },
  },

  // Threshold fields (disk, cpu, memory)
  {
    name: "error_threshold",
    label: "Error Threshold",
    field: "error_threshold",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: number | null, row: Check) =>
      ["diskspace", "cpuload", "memory"].includes(row.check_type) && val ? `${val}%` : "-",
  },
  {
    name: "warning_threshold",
    label: "Warning Threshold",
    field: "warning_threshold",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: number | null, row: Check) =>
      ["diskspace", "cpuload", "memory"].includes(row.check_type) && val ? `${val}%` : "-",
  },

  // Disk check
  {
    name: "disk",
    label: "Disk",
    field: "disk",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: string | null, row: Check) =>
      row.check_type === "diskspace" ? (val ?? "-") : "-",
  },

  // Ping check
  {
    name: "ip",
    label: "IP / Hostname",
    field: "ip",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: string | null, row: Check) => (row.check_type === "ping" ? (val ?? "-") : "-"),
  },

  // Script check
  {
    name: "script_args",
    label: "Script Args",
    field: "script_args",
    align: "left",
    hiddenByDefault: true,
    format: (val: string[] | null, row: Check) =>
      row.check_type === "script" && val?.length ? val.join(", ") : "-",
  },
  {
    name: "env_vars",
    label: "Env Variables",
    field: "env_vars",
    align: "left",
    hiddenByDefault: true,
    format: (val: string[] | null, row: Check) =>
      row.check_type === "script" && val?.length ? val.join(", ") : "-",
  },
  {
    name: "info_return_codes",
    label: "Info Return Codes",
    field: "info_return_codes",
    align: "left",
    hiddenByDefault: true,
    format: (val: number[] | null, row: Check) =>
      row.check_type === "script" && val?.length ? val.join(", ") : "-",
  },
  {
    name: "warning_return_codes",
    label: "Warning Return Codes",
    field: "warning_return_codes",
    align: "left",
    hiddenByDefault: true,
    format: (val: number[] | null, row: Check) =>
      row.check_type === "script" && val?.length ? val.join(", ") : "-",
  },
  {
    name: "success_return_codes",
    label: "Success Return Codes",
    field: "success_return_codes",
    align: "left",
    hiddenByDefault: true,
    format: (val: number[] | null, row: Check) =>
      row.check_type === "script" && val?.length ? val.join(", ") : "-",
  },
  {
    name: "timeout",
    label: "Timeout",
    field: "timeout",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: number | null, row: Check) =>
      row.check_type === "script" && val != null ? `${val}s` : "-",
  },

  // Windows Service check
  {
    name: "svc_name",
    label: "Service Name",
    field: "svc_name",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: string | null, row: Check) => (row.check_type === "winsvc" ? (val ?? "-") : "-"),
  },
  {
    name: "svc_display_name",
    label: "Service Display Name",
    field: "svc_display_name",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: string | null, row: Check) => (row.check_type === "winsvc" ? (val ?? "-") : "-"),
  },
  {
    name: "pass_if_start_pending",
    label: "Pass if Start Pending",
    field: "pass_if_start_pending",
    align: "left",
    hiddenByDefault: true,
    format: (val: boolean | null, row: Check) =>
      row.check_type === "winsvc" ? (val ? "Yes" : "No") : "-",
  },
  {
    name: "pass_if_svc_not_exist",
    label: "Pass if Not Exist",
    field: "pass_if_svc_not_exist",
    align: "left",
    hiddenByDefault: true,
    format: (val: boolean | undefined, row: Check) =>
      row.check_type === "winsvc" ? (val ? "Yes" : "No") : "-",
  },
  {
    name: "restart_if_stopped",
    label: "Restart if Stopped",
    field: "restart_if_stopped",
    align: "left",
    hiddenByDefault: true,
    format: (val: boolean | null, row: Check) =>
      row.check_type === "winsvc" ? (val ? "Yes" : "No") : "-",
  },
  {
    name: "svc_policy_mode",
    label: "Service Policy Mode",
    field: "svc_policy_mode",
    align: "left",
    hiddenByDefault: true,
    format: (val: string | null, row: Check) =>
      row.check_type === "winsvc"
        ? val
          ? val.charAt(0).toUpperCase() + val.slice(1)
          : "Default"
        : "-",
  },

  // Event Log check
  {
    name: "log_name",
    label: "Log Name",
    field: "log_name",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: string | null, row: Check) =>
      row.check_type === "eventlog" ? (val ?? "-") : "-",
  },
  {
    name: "event_id",
    label: "Event ID",
    field: "event_id",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: number | null, row: Check) => {
      if (row.check_type !== "eventlog") return "-";
      if (row.event_id_is_wildcard) return "*";
      return val != null ? String(val) : "-";
    },
  },
  {
    name: "event_type",
    label: "Event Type",
    field: "event_type",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: string | null, row: Check) =>
      row.check_type === "eventlog" ? (val ?? "-") : "-",
  },
  {
    name: "event_source",
    label: "Event Source",
    field: "event_source",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: string | null, row: Check) =>
      row.check_type === "eventlog" ? (val ?? "-") : "-",
  },
  {
    name: "event_message",
    label: "Event Message",
    field: "event_message",
    align: "left",
    hiddenByDefault: true,
    format: (val: string | null, row: Check) =>
      row.check_type === "eventlog" ? (val ?? "-") : "-",
  },
  {
    name: "fail_when",
    label: "Fail When",
    field: "fail_when",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: string | null, row: Check) =>
      row.check_type === "eventlog" ? (val ?? "-") : "-",
  },
  {
    name: "search_last_days",
    label: "Search Last Days",
    field: "search_last_days",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: number | null, row: Check) =>
      row.check_type === "eventlog" && val != null ? String(val) : "-",
  },
  {
    name: "number_of_events_b4_alert",
    label: "Events Before Alert",
    field: "number_of_events_b4_alert",
    align: "left",
    sortable: true,
    hiddenByDefault: true,
    format: (val: number | null, row: Check) =>
      row.check_type === "eventlog" && val != null ? String(val) : "-",
  },
];
const pagination = ref({
  rowsPerPage: 0,
  sortBy: "status",
  descending: true,
});

const filter = ref("");

async function checkAlert(id: number, check: Partial<Check>) {
  try {
    await updateCheck(id, check);
  } catch {
    // Error handling is done in the store
  }
}

function deleteCheck(check: Check) {
  $q.dialog({
    title: `Delete ${check.check_type} check?`,
    ok: { label: "Delete", color: "negative" },
    cancel: true,
  }).onOk(() => void removeCheck(check.id));
}

function showPolicyStatus(check: Check) {
  $q.dialog({
    component: PolicyStatus,
    componentProps: {
      type: "check",
      item: check,
    },
  });
}

function showCheckModal(type: string, check?: Check) {
  let component;

  if (type === "diskspace") component = DiskSpaceCheck;
  else if (type === "memory") component = MemCheck;
  else if (type === "cpuload") component = CpuLoadCheck;
  else if (type === "ping") component = PingCheck;
  else if (type === "winsvc") component = WinSvcCheck;
  else if (type === "eventlog") component = EventLogCheck;
  else if (type === "script") component = ScriptCheck;
  else return;

  $q.dialog({
    component: component,
    componentProps: {
      check: check,
      parent: { policy: props.selectedPolicy },
    },
  });
}

// watchers
watch(
  () => props.selectedPolicy,
  (newValue) => {
    if (newValue) getPolicyChecks(newValue);
  },
);

onMounted(() => getPolicyChecks(props.selectedPolicy));
</script>
