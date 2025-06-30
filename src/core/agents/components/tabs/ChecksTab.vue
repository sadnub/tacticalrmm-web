<template>
  <div v-if="!agentStore.selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <tactical-table
      v-model:pagination="pagination"
      dense
      :style="{ 'max-height': tabHeight }"
      :rows="agentStore.agentChecks"
      :columns="columns"
      row-key="id"
      binary-state-sort
      :loading="agentStore.isLoading"
      :rows-per-page-options="[0]"
      virtual-scroll
      no-data-label="No checks"
      column-select
      storage-key="agent-checks-tab"
    >
      <template #loading>
        <q-inner-loading showing color="primary" />
      </template>

      <!-- table top slot -->
      <template #top>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="agentStore.getAgentChecks(agentStore.selectedAgentId)"
        />
        <q-btn-dropdown icon="add" label="New" no-caps dense flat class="q-mr-md">
          <q-list dense style="min-width: 200px">
            <q-item
              v-if="agentStore.selectedAgentPlatform === 'windows'"
              v-close-popup
              clickable
              @click="showCheckModal('diskspace')"
            >
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
            <q-item
              v-if="agentStore.selectedAgentPlatform === 'windows'"
              v-close-popup
              clickable
              @click="showCheckModal('cpuload')"
            >
              <q-item-section side>
                <q-icon size="xs" name="fas fa-microchip" />
              </q-item-section>
              <q-item-section>CPU Load Check</q-item-section>
            </q-item>
            <q-item
              v-if="agentStore.selectedAgentPlatform === 'windows'"
              v-close-popup
              clickable
              @click="showCheckModal('memory')"
            >
              <q-item-section side>
                <q-icon size="xs" name="fas fa-memory" />
              </q-item-section>
              <q-item-section>Memory Check</q-item-section>
            </q-item>
            <q-item
              v-if="agentStore.selectedAgentPlatform === 'windows'"
              v-close-popup
              clickable
              @click="showCheckModal('winsvc')"
            >
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
            <q-item
              v-if="agentStore.selectedAgentPlatform === 'windows'"
              v-close-popup
              clickable
              @click="showCheckModal('eventlog')"
            >
              <q-item-section side>
                <q-icon size="xs" name="fas fa-clipboard-list" />
              </q-item-section>
              <q-item-section>Event Log Check</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-btn
          label="Run Checks Now"
          dense
          flat
          push
          no-caps
          icon="play_arrow"
          class="q-mr-md"
          @click="agentStore.runAgentChecks(agentStore.selectedAgentId)"
        />
        <q-btn
          label="Reset All Checks Status"
          dense
          flat
          push
          no-caps
          icon="restart_alt"
          @click="resetAllChecks"
        />
      </template>

      <!-- header slots -->
      <template #header-cell-smsalert="props">
        <q-th auto-width :props="props">
          <q-icon name="phone_android" size="1.5em">
            <q-tooltip>SMS Alert</q-tooltip>
          </q-icon>
        </q-th>
      </template>
      <template #header-cell-emailalert="props">
        <q-th auto-width :props="props">
          <q-icon name="email" size="1.5em">
            <q-tooltip>Email Alert</q-tooltip>
          </q-icon>
        </q-th>
      </template>
      <template #header-cell-dashboardalert="props">
        <q-th auto-width :props="props">
          <q-icon name="notifications" size="1.5em">
            <q-tooltip>Dashboard Alert</q-tooltip>
          </q-icon>
        </q-th>
      </template>
      <template #header-cell-statusicon="props">
        <q-th auto-width :props="props"></q-th>
      </template>
      <template #header-cell-policystatus="props">
        <q-th auto-width :props="props"></q-th>
      </template>

      <!-- body slots -->
      <template #body="props">
        <q-tr
          :props="props"
          class="cursor-pointer"
          @dblclick="showCheckModal(props.row.check_type, props.row)"
        >
          <!-- context menu -->
          <q-menu context-menu>
            <q-list dense style="min-width: 200px">
              <q-item
                v-close-popup
                clickable
                :disable="!!props.row.policy"
                @click="showCheckModal(props.row.check_type, props.row)"
              >
                <q-item-section side>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>Edit</q-item-section>
              </q-item>
              <q-item
                v-close-popup
                clickable
                :disable="!!props.row.policy"
                @click="deleteCheck(props.row)"
              >
                <q-item-section side>
                  <q-icon name="delete" />
                </q-item-section>
                <q-item-section>Delete</q-item-section>
              </q-item>
              <q-separator></q-separator>
              <q-item v-close-popup clickable @click="resetCheckStatus(props.row)">
                <q-item-section side>
                  <q-icon name="info" />
                </q-item-section>
                <q-item-section>Reset Check Status</q-item-section>
              </q-item>
              <q-separator></q-separator>
              <q-item v-close-popup clickable>
                <q-item-section>Close</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <!-- tds -->
          <!-- text alert -->
          <q-td>
            <q-checkbox
              v-if="props.row.alert_template && props.row.alert_template.always_text != null"
              v-model="props.row.alert_template.always_text"
              disable
              dense
            >
              <q-tooltip>
                Setting is overridden by alert template:
                {{ props.row.alert_template.name }}
              </q-tooltip>
            </q-checkbox>

            <q-checkbox
              v-else
              v-model="props.row.text_alert"
              dense
              :disable="!!props.row.policy"
              @update:model-value="editCheck(props.row, { text_alert: !props.row.text_alert })"
            />
          </q-td>
          <!-- email alert -->
          <q-td>
            <q-checkbox
              v-if="props.row.alert_template && props.row.alert_template.always_email != null"
              v-model="props.row.alert_template.always_email"
              disable
              dense
            >
              <q-tooltip>
                Setting is overridden by alert template:
                {{ props.row.alert_template.name }}
              </q-tooltip>
            </q-checkbox>

            <q-checkbox
              v-else
              v-model="props.row.email_alert"
              dense
              :disable="!!props.row.policy"
              @update:model-value="editCheck(props.row, { email_alert: !props.row.email_alert })"
            />
          </q-td>
          <!-- dashboard alert -->
          <q-td>
            <q-checkbox
              v-if="props.row.alert_template && props.row.alert_template.always_alert !== null"
              v-model="props.row.alert_template.always_alert"
              disable
              dense
            >
              <q-tooltip>
                Setting is overridden by alert template:
                {{ props.row.alert_template.name }}
              </q-tooltip>
            </q-checkbox>

            <q-checkbox
              v-else
              v-model="props.row.dashboard_alert"
              dense
              :disable="!!props.row.policy"
              @update:model-value="
                editCheck(props.row, {
                  dashboard_alert: !props.row.dashboard_alert,
                })
              "
            />
          </q-td>
          <!-- policy check icon -->
          <q-td v-if="props.row.policy">
            <q-icon style="font-size: 1.3rem" name="policy">
              <q-tooltip>This check is managed by a policy</q-tooltip>
            </q-icon>
          </q-td>
          <q-td v-else-if="props.row.overridden_by_policy">
            <q-icon style="font-size: 1.3rem" name="remove_circle_outline">
              <q-tooltip>This check is overriden by a policy</q-tooltip>
            </q-icon>
          </q-td>
          <q-td v-else></q-td>
          <!-- status icon -->
          <q-td v-if="Object.keys(props.row.check_result).length === 0"></q-td>
          <q-td v-else-if="props.row.check_result.status === 'passing'">
            <q-icon style="font-size: 1.3rem" :color="dashPositiveColor" name="check_circle">
              <q-tooltip>Passing</q-tooltip>
            </q-icon>
          </q-td>
          <q-td v-else-if="props.row.check_result.status === 'failing'">
            <q-icon
              v-if="getAlertSeverity(props.row) === 'info'"
              style="font-size: 1.3rem"
              :color="dashInfoColor"
              name="info"
            >
              <q-tooltip>Informational</q-tooltip>
            </q-icon>
            <q-icon
              v-else-if="getAlertSeverity(props.row) === 'warning'"
              style="font-size: 1.3rem"
              :color="dashWarningColor"
              name="warning"
            >
              <q-tooltip>Warning</q-tooltip>
            </q-icon>
            <q-icon v-else style="font-size: 1.3rem" :color="dashNegativeColor" name="error">
              <q-tooltip>Error</q-tooltip>
            </q-icon>
          </q-td>
          <q-td v-else></q-td>
          <!-- check description -->
          <q-td>
            <span>
              {{ truncateText(props.row.readable_desc, 40) }}
              <q-tooltip v-if="props.row.readable_desc.length > 40">{{
                props.row.readable_desc
              }}</q-tooltip>
            </span></q-td
          >
          <!-- more info -->
          <q-td>
            <span
              v-if="props.row.check_result.id"
              style="cursor: pointer; text-decoration: underline"
              class="text-primary"
              @click="showCheckGraphModal(props.row)"
              >Show Run History</span
            >
            &nbsp;&nbsp;&nbsp;
            <span
              v-if="props.row.check_type === 'ping' && props.row.check_result.id"
              style="cursor: pointer; text-decoration: underline"
              class="text-primary"
              @click="showPingInfo(props.row)"
              >{{
                grep(props.row.check_result.more_info, ["transmitted", "received", "packet loss"])
              }}</span
            >
            <span
              v-else-if="props.row.check_type === 'script' && props.row.check_result.id"
              style="cursor: pointer; text-decoration: underline"
              class="text-primary"
              @click="showScriptOutput(props.row.check_result)"
              >{{ processOutput(props.row.check_result) }}</span
            >
            <span
              v-else-if="props.row.check_type === 'eventlog' && props.row.check_result.id"
              style="cursor: pointer; text-decoration: underline"
              class="text-primary"
              @click="showEventInfo(props.row)"
              >Last Output</span
            >
            <span
              v-else-if="
                ['diskspace', 'cpuload', 'memory'].includes(props.row.check_type) ||
                (props.row.check_type === 'winsvc' && props.row.check_result.id)
              "
              >{{ props.row.check_result.more_info }}</span
            >
          </q-td>
          <q-td>{{
            props.row.check_result.last_run
              ? dashboardStore.formatDate(props.row.check_result.last_run)
              : "Never"
          }}</q-td>
          <q-td v-if="props.row.assignedtasks.length > 1"
            >{{ props.row.assignedtasks.length }} Tasks</q-td
          >
          <q-td v-else-if="props.row.assignedtasks.length === 1">{{
            props.row.assignedtasks[0].name
          }}</q-td>
          <q-td v-else></q-td>
        </q-tr>
      </template>
    </tactical-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, watch, onMounted } from "vue";
import { useQuasar, type QTableProps } from "quasar";
import { useAgentStore } from "../../api";
import { useCheckStore } from "src/core/checks/api";
import { useDashboardStore } from "src/stores/dashboard";
import { truncateText } from "src/utils/format";
import { notifyWarning } from "src/utils/notify";

// ui imports
import DiskSpaceCheck from "src/core/checks/components/DiskSpaceCheck.vue";
import MemCheck from "src/core/checks/components//MemCheck.vue";
import CpuLoadCheck from "src/core/checks/components//CpuLoadCheck.vue";
import PingCheck from "src/core/checks/components//PingCheck.vue";
import WinSvcCheck from "src/core/checks/components//WinSvcCheck.vue";
import EventLogCheck from "src/core/checks/components//EventLogCheck.vue";
import ScriptCheck from "src/core/checks/components//ScriptCheck.vue";
import ScriptOutput from "src/core/scripts/components/ScriptOutput.vue";
import EventLogCheckOutput from "src/core/checks/components//EventLogCheckOutput.vue";
import CheckGraph from "src/components/graphs/CheckGraph.vue";
import PreDialog from "src/components/ui/PreDialog.vue";
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";

// type imports
import type { Check, CheckResult, CheckType } from "src/core/checks/types";

// static data
const columns: QTableProps["columns"] = [
  { name: "smsalert", field: "text_alert", label: "", align: "left" },
  { name: "emailalert", field: "email_alert", label: "", align: "left" },
  { name: "dashboardalert", field: "dashboard_alert", label: "", align: "left" },
  { name: "policystatus", field: "policystatus", label: "", align: "left" },
  { name: "statusicon", field: "statusicon", label: "", align: "left" },
  {
    name: "desc",
    field: "readable_desc",
    label: "Description",
    align: "left",
    sortable: true,
  },
  {
    name: "moreinfo",
    label: "More Info",
    field: "more_info",
    align: "left",
    sortable: true,
  },
  {
    name: "datetime",
    label: "Last Run",
    field: "last_run",
    align: "left",
    sortable: true,
  },
  {
    name: "assignedtasks",
    label: "Assigned Tasks",
    field: "assigned_task",
    align: "left",
    sortable: true,
  },
];

// setup stores
const dashboardStore = useDashboardStore();
const agentStore = useAgentStore();
const checkStore = useCheckStore();

const tabHeight = computed(() => dashboardStore.tabHeight);

const dashInfoColor = computed(() => dashboardStore.dashboardSettings.dashInfoColor);
const dashPositiveColor = computed(() => dashboardStore.dashboardSettings.dashPositiveColor);
const dashNegativeColor = computed(() => dashboardStore.dashboardSettings.dashNegativeColor);
const dashWarningColor = computed(() => dashboardStore.dashboardSettings.dashWarningColor);

// setup quasar
const $q = useQuasar();

// inject function to refresh dashboard
// TODO: Only affect agent
//const refreshDashboard = inject("refreshDashboard");

// setup checks tab logic
const pagination = ref({
  rowsPerPage: 0,
  sortBy: "status",
  descending: false,
});

// TODO this will break when we add translations
function grep(text: string, stringsToMatch: string[]) {
  try {
    const lines = text.split("\n");
    const matched = [];

    for (const line of lines) {
      if (stringsToMatch.every((str) => line.includes(str))) {
        matched.push(line);
      }
    }

    return matched.length > 0 ? matched.join("\n") : "Last Output";
  } catch (e) {
    console.error(e);
    return "Last Output";
  }
}

function processOutput(result: CheckResult) {
  try {
    if (result.stdout && result.stdout.trim() !== "") {
      return result.stdout.substring(0, 60);
    } else if (result.stderr && result.stderr.trim() !== "") {
      return result.stderr.substring(0, 60);
    } else {
      return "Last Output";
    }
  } catch (e) {
    console.error(e);
    return "Last Output";
  }
}

function getAlertSeverity(check: Check) {
  if (check.check_result?.alert_severity) {
    return check.check_result.alert_severity;
  } else {
    return check.alert_severity;
  }
}

function editCheck(check: Check, data: Partial<Check>) {
  if (check.policy) return;

  checkStore.updateCheck(check.id, data);
}

function deleteCheck(check: Check) {
  $q.dialog({
    title: "Are you sure?",
    message: `Delete ${check.readable_desc}`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
    persistent: true,
  }).onOk(() => {
    checkStore.removeCheck(check.id);
  });
}

function resetCheckStatus(check: Check) {
  // make sure there is a check result before sending
  if (!check.check_result?.status) {
    notifyWarning("Check hasn't run yet");
  } else if (check.check_result.status === "passing") {
    notifyWarning("Check is already passing");
  }

  if (check.check_result?.id) checkStore.resetCheck(check.check_result?.id);
}

function resetAllChecks() {
  $q.dialog({
    title: "Are you sure?",
    message: "Reset all checks status",
    cancel: true,
    ok: { label: "Reset", color: "negative" },
    persistent: true,
  }).onOk(() => {
    if (agentStore.selectedAgentId) agentStore.resetAllAgentChecks(agentStore.selectedAgentId);
  });
}

function showEventInfo(data: Check) {
  $q.dialog({
    component: EventLogCheckOutput,
    componentProps: {
      evtLogData: data,
    },
  });
}

function showCheckGraphModal(check: Check) {
  $q.dialog({
    component: CheckGraph,
    componentProps: {
      check: check,
    },
  });
}

function showScriptOutput(script: CheckResult) {
  $q.dialog({
    component: ScriptOutput,
    componentProps: {
      scriptInfo: script,
    },
  });
}

function showPingInfo(check: Check) {
  $q.dialog({
    component: PreDialog,
    componentProps: {
      title: check.readable_desc,
      dialogStyle: "width: 50vw; max-width: 60vw",
      message: check.check_result?.more_info,
    },
  });
}

function showCheckModal(type: CheckType, check?: Check) {
  if (check && check.policy) return;

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
      parent: !check ? { agent: agentStore.selectedAgentId } : undefined,
      plat: type === "script" ? agentStore.selectedAgentPlatform : undefined,
    },
  });
}

watch(
  () => agentStore.selectedAgentId,
  (newValue) => {
    if (newValue) agentStore.getAgentChecks(newValue);
  },
);

onMounted(() => {
  if (agentStore.selectedAgentId) agentStore.getAgentChecks(agentStore.selectedAgentId);
});
</script>
