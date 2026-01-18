<template>
  <div v-if="!selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <tactical-table
      v-model:pagination="pagination"
      dense
      :style="{ 'max-height': `${tabHeight}px` }"
      :rows="checks"
      :columns="columns"
      row-key="id"
      binary-state-sort
      :loading="isLoading"
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
          @click="checkStore.getAgentChecks(selectedAgentId, { force: true })"
        />
        <q-btn-dropdown icon="add" label="New" no-caps dense flat class="q-mr-md">
          <q-list dense style="min-width: 200px">
            <q-item
              v-if="selectedAgentPlatform === 'windows'"
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
              v-if="selectedAgentPlatform === 'windows'"
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
              v-if="selectedAgentPlatform === 'windows'"
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
              v-if="selectedAgentPlatform === 'windows'"
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
              v-if="selectedAgentPlatform === 'windows'"
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
          @click="checkStore.runAgentChecks(selectedAgentId)"
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

        <q-space />

        <q-input
          v-model="search"
          style="width: 300px"
          filled
          label="Search"
          dense
          clearable
          class="q-pr-sm"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <tactical-table-export />
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
      <template #header-cell-status="props">
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
              <q-item
                v-close-popup
                clickable
                :disable="
                  !props.row.check_result?.last_run || props.row.check_result?.status === 'passing'
                "
                @click="resetCheckStatus(props.row)"
              >
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

          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <!-- text alert -->
            <template v-if="col.name === 'smsalert'">
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
            </template>

            <!-- email alert -->
            <template v-else-if="col.name === 'emailalert'">
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
            </template>

            <!-- dashboard alert -->
            <template v-else-if="col.name === 'dashboardalert'">
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
            </template>

            <!-- policy check icon -->
            <template v-else-if="col.name === 'policystatus'">
              <template v-if="props.row.policy">
                <q-icon style="font-size: 1.3rem" name="policy">
                  <q-tooltip>This check is managed by a policy</q-tooltip>
                </q-icon>
              </template>

              <template v-else-if="props.row.overridden_by_policy">
                <q-icon style="font-size: 1.3rem" name="remove_circle_outline">
                  <q-tooltip>This check is overriden by a policy</q-tooltip>
                </q-icon>
              </template>
            </template>

            <!-- status icon -->
            <template v-else-if="col.name === 'status'">
              <template
                v-if="props.row.check_result && props.row.check_result.status === 'passing'"
              >
                <q-icon style="font-size: 1.3rem" :color="dashPositiveColor" name="check_circle">
                  <q-tooltip>Passing</q-tooltip>
                </q-icon>
              </template>

              <template
                v-else-if="props.row.check_result && props.row.check_result.status === 'failing'"
              >
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
              </template>
            </template>

            <!-- check description -->
            <template v-else-if="col.name === 'desc'">
              <truncate-text :text="props.row.readable_desc" />
            </template>

            <!-- more info -->
            <template v-else-if="col.name === 'moreinfo'">
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
            </template>

            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
    </tactical-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, watch, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useAgentStore, useCheckStore, useDashboardStore } from "src/stores/api";

const agentStore = useAgentStore();
const checkStore = useCheckStore();
const dashboardStore = useDashboardStore();
import { notifyWarning } from "src/utils/notify";

// ui imports
import DiskSpaceCheck from "src/core/checks/components/DiskSpaceCheck.vue";
import MemCheck from "src/core/checks/components/MemCheck.vue";
import CpuLoadCheck from "src/core/checks/components/CpuLoadCheck.vue";
import PingCheck from "src/core/checks/components/PingCheck.vue";
import WinSvcCheck from "src/core/checks/components/WinSvcCheck.vue";
import EventLogCheck from "src/core/checks/components/EventLogCheck.vue";
import ScriptCheck from "src/core/checks/components/ScriptCheck.vue";
import ScriptOutput from "src/core/scripts/components/ScriptOutput.vue";
import EventLogCheckOutput from "src/core/checks/components/EventLogCheckOutput.vue";
import CheckGraph from "src/core/checks/components/CheckGraph.vue";
import PreDialog from "src/core/dashboard/ui/PreDialog.vue";

// type imports
import type { Check, CheckResult, CheckType } from "src/core/checks/types";
import type { AutomatedTask } from "src/core/tasks/types";
import type { TacticalColumn } from "src/core/dashboard/types";

// static data
const columns: TacticalColumn[] = [
  { name: "smsalert", field: "text_alert", label: "SMS Alert", align: "left" },
  { name: "emailalert", field: "email_alert", label: "Email Alert", align: "left" },
  { name: "dashboardalert", field: "dashboard_alert", label: "Dashboard Alert", align: "left" },
  { name: "policystatus", field: "policystatus", label: "Policy Status", align: "left" },
  { name: "status", field: "statusicon", label: "Check Status", align: "left" },
  {
    name: "desc",
    field: "readable_desc",
    label: "Description",
    align: "left",
    sortable: true,
    required: true,
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
    field: (row) => row.check_result?.last_run,
    align: "left",
    sortable: true,
    format: (val: string) => (val ? dashboardStore.formatDate(val) : "Never"),
  },
  {
    name: "assignedtasks",
    label: "Assigned Tasks",
    field: "assignedtasks",
    align: "left",
    sortable: true,
    format: (val: AutomatedTask[]) => {
      if (!val) return "";
      else if (val.length > 1) return `${val.length} Tasks`;
      else if (val.length === 1 && val[0]) return val[0].name;
      else return "";
    },
  },
];

// setup stores
const { selectedAgentId, selectedAgentPlatform } = agentStore;
const { checks, isLoading } = checkStore;

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

const search = ref("");
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

  void checkStore.updateCheck(check.id, data);
}

function deleteCheck(check: Check) {
  $q.dialog({
    title: "Are you sure?",
    message: `Delete ${check.readable_desc}`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
    noBackdropDismiss: true,
  }).onOk(() => {
    void checkStore.removeCheck(check.id);
  });
}

function resetCheckStatus(check: Check) {
  // make sure there is a check result before sending
  if (!check.check_result?.status) {
    notifyWarning("Check hasn't run yet");
  } else if (check.check_result.status === "passing") {
    notifyWarning("Check is already passing");
  }

  if (check.check_result?.id) void checkStore.resetCheck(check.check_result?.id);
}

function resetAllChecks() {
  $q.dialog({
    title: "Are you sure?",
    message: "Reset all checks status",
    cancel: true,
    ok: { label: "Reset", color: "negative" },
    noBackdropDismiss: true,
  }).onOk(() => {
    if (selectedAgentId.value) void checkStore.resetAllAgentChecks(selectedAgentId.value);
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
      parent: { agent: selectedAgentId.value },
      plat: type === "script" ? selectedAgentPlatform.value : undefined,
    },
  });
}

watch(selectedAgentId, (newValue) => {
  if (newValue) checkStore.getAgentChecks(newValue);
});

onMounted(() => {
  if (selectedAgentId.value) checkStore.getAgentChecks(selectedAgentId.value);
});
</script>
