<template>
  <div v-if="!agentStore.selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <q-table
      dense
      :table-class="{
        'table-bgcolor': !$q.dark.isActive,
        'table-bgcolor-dark': $q.dark.isActive,
      }"
      class="tabs-tbl-sticky"
      :style="{ 'max-height': `${tabHeight}px` }"
      :rows="agentStore.agentTasks"
      :columns="columns"
      row-key="id"
      binary-state-sort
      virtual-scroll
      v-model:pagination="pagination"
      :loading="agentStore.isLoading"
      :rows-per-page-options="[0]"
      no-data-label="No tasks"
    >
      <template #top>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          push
          @click="
            agentStore.selectedAgentId && agentStore.getAgentTasks(agentStore.selectedAgentId)
          "
          icon="refresh"
        />
        <q-btn icon="add" label="Add Task" no-caps dense flat push @click="showAddTask" />
      </template>

      <template #loading>
        <q-inner-loading showing color="primary" />
      </template>

      <!-- header slots -->
      <template #header-cell-enabled="props">
        <q-th auto-width :props="props">
          <q-icon name="power_settings_new" size="1.5em">
            <q-tooltip>Enabled</q-tooltip>
          </q-icon>
        </q-th>
      </template>

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

      <template #header-cell-policystatus="props">
        <q-th auto-width :props="props"></q-th>
      </template>

      <template #header-cell-collector="props">
        <q-th auto-width :props="props">
          <q-icon name="mdi-database-arrow-up" size="1.5em">
            <q-tooltip>Collector Task</q-tooltip>
          </q-icon>
        </q-th>
      </template>

      <template #header-cell-status="props">
        <q-th auto-width :props="props"></q-th>
      </template>

      <!-- body slots -->
      <template #body="props">
        <q-tr :props="props" class="cursor-pointer" @dblclick="showEditTask(props.row)">
          <!-- context menu -->
          <q-menu context-menu>
            <q-list dense style="min-width: 200px">
              <q-item clickable v-close-popup @click="runWinTask(props.row)">
                <q-item-section side>
                  <q-icon name="play_arrow" />
                </q-item-section>
                <q-item-section>Run task now</q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                @click="showEditTask(props.row)"
                v-if="!props.row.policy"
              >
                <q-item-section side>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>Edit</q-item-section>
              </q-item>
              <q-item
                clickable
                v-close-popup
                @click="deleteTask(props.row)"
                v-if="!props.row.policy"
              >
                <q-item-section side>
                  <q-icon name="delete" />
                </q-item-section>
                <q-item-section>Delete</q-item-section>
              </q-item>
              <q-separator></q-separator>
              <q-item clickable v-close-popup>
                <q-item-section>Close</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
          <!-- tds -->
          <q-td>
            <q-checkbox
              dense
              @update:model-value="editTask(props.row, { enabled: !props.row.enabled })"
              v-model="props.row.enabled"
              :disable="!!props.row.policy"
            />
          </q-td>
          <!-- text alert -->
          <q-td>
            <q-checkbox
              v-if="props.row.alert_template && props.row.alert_template.always_text !== null"
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
              dense
              @update:model-value="editTask(props.row, { text_alert: !props.row.text_alert })"
              v-model="props.row.text_alert"
              :disable="!!props.row.policy"
            />
          </q-td>
          <!-- email alert -->
          <q-td>
            <q-checkbox
              v-if="props.row.alert_template && props.row.alert_template.always_email !== null"
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
              dense
              @update:model-value="editTask(props.row, { email_alert: !props.row.email_alert })"
              v-model="props.row.email_alert"
              :disable="!!props.row.policy"
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
              dense
              @update:model-value="
                editTask(props.row, {
                  dashboard_alert: !props.row.dashboard_alert,
                })
              "
              v-model="props.row.dashboard_alert"
              :disable="!!props.row.policy"
            />
          </q-td>
          <!-- policy check icon -->
          <q-td>
            <q-icon v-if="props.row.policy" style="font-size: 1.3rem" name="policy">
              <q-tooltip>This task is managed by a policy</q-tooltip>
            </q-icon>
          </q-td>

          <!-- is collector task -->
          <q-td>
            <q-icon v-if="!!props.row.custom_field" style="font-size: 1.3rem" name="check">
              <q-tooltip>The task updates a custom field on the agent</q-tooltip>
            </q-icon>
          </q-td>
          <!-- status icon -->
          <q-td v-if="Object.keys(props.row.task_result).length === 0"></q-td>
          <q-td v-else-if="props.row.task_result.status === 'passing'">
            <q-icon style="font-size: 1.3rem" :color="dashPositiveColor" name="check_circle">
              <q-tooltip>Passing</q-tooltip>
            </q-icon>
          </q-td>
          <q-td v-else-if="props.row.task_result.status === 'failing'">
            <q-icon
              v-if="props.row.alert_severity === 'info'"
              style="font-size: 1.3rem"
              :color="dashInfoColor"
              name="info"
            >
              <q-tooltip>Informational</q-tooltip>
            </q-icon>
            <q-icon
              v-else-if="props.row.alert_severity === 'warning'"
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
          <!-- name -->
          <q-td
            >{{ props.row.name
            }}<q-tooltip v-if="props.row?.win_task_name" :delay="700">{{
              props.row.win_task_name
            }}</q-tooltip></q-td
          >
          <!-- sync status -->
          <q-td v-if="props.row.task_result.sync_status === 'notsynced'"
            >Will sync on next agent checkin</q-td
          >
          <q-td v-else-if="props.row.task_result.sync_status === 'synced'">Synced with agent</q-td>
          <q-td v-else-if="props.row.task_result.sync_status === 'pendingdeletion'"
            >Pending deletion on agent</q-td
          >
          <q-td v-else>Waiting for task creation on agent</q-td>
          <q-td
            v-if="
              props.row.task_result.retcode !== null ||
              props.row.task_result.stdout ||
              props.row.task_result.stderr
            "
          >
            <span
              style="cursor: pointer; text-decoration: underline"
              class="text-primary"
              @click="showScriptOutput(props.row)"
              >output</span
            >
          </q-td>
          <q-td v-else>Awaiting output</q-td>
          <q-td v-if="props.row.task_result.last_run">{{
            dashboardStore.formatDate(props.row.task_result.last_run)
          }}</q-td>
          <q-td v-else>Has not run yet</q-td>
          <q-td
            >{{ truncateText(props.row.schedule, 70) }}
            <q-tooltip v-if="props.row.schedule.length > 70">{{ props.row.schedule }}</q-tooltip>
          </q-td>
          <q-td>
            <span v-if="props.row.check_name">
              {{ truncateText(props.row.check_name, 40) }}
              <q-tooltip v-if="props.row.check_name.length > 40">{{
                props.row.check_name
              }}</q-tooltip>
            </span>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, watch, onMounted } from "vue";
import type { QTableProps } from "quasar";
import { useQuasar } from "quasar";
import { useTaskStore } from "src/core/tasks/api";
import { useAgentStore } from "../../api";
import { useDashboardStore } from "src/stores/dashboard";
import { truncateText } from "src/utils/format";
import { notifyError } from "src/utils/notify";

// ui imports
import AutomatedTaskForm from "src/components/tasks/AutomatedTaskForm.vue";
import ScriptOutput from "src/core/scripts/components/ScriptOutput.vue";
import type { AutomatedTask } from "src/core/tasks/types";

// static data
const columns: QTableProps["columns"] = [
  { name: "enabled", align: "left", field: "enabled", label: "" },
  { name: "smsalert", field: "text_alert", align: "left", label: "" },
  { name: "emailalert", field: "email_alert", align: "left", label: "" },
  { name: "dashboardalert", field: "dashboard_alert", align: "left", label: "" },
  { name: "policystatus", field: "policystatus", align: "left", label: "" },
  {
    name: "collector",
    label: "Collector",
    field: "custom_field",
    align: "left",
    sortable: true,
  },
  { name: "status", field: "status", align: "left", label: "" },
  { name: "name", label: "Name", field: "name", align: "left", sortable: true },
  {
    name: "sync_status",
    label: "Sync Status",
    field: "sync_status",
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
    label: "Last Run Time",
    field: "last_run",
    align: "left",
    sortable: true,
  },
  {
    name: "schedule",
    label: "Schedule",
    field: "schedule",
    align: "left",
    sortable: true,
  },
  {
    name: "assignedcheck",
    label: "Assigned Check",
    field: "assigned_check",
    align: "left",
    sortable: true,
  },
];

// setup stores
const dashboardStore = useDashboardStore();
const agentStore = useAgentStore();
const taskStore = useTaskStore();

const tabHeight = computed(() => dashboardStore.tabHeight);
const agentPlatform = computed(() => agentStore.selectedAgentPlatform);

const dashInfoColor = computed(() => dashboardStore.dashboardSettings.dashInfoColor);
const dashPositiveColor = computed(() => dashboardStore.dashboardSettings.dashPositiveColor);
const dashNegativeColor = computed(() => dashboardStore.dashboardSettings.dashNegativeColor);
const dashWarningColor = computed(() => dashboardStore.dashboardSettings.dashWarningColor);

// setup quasar
const $q = useQuasar();

// automated tasks logic
const pagination = ref({
  rowsPerPage: 0,
  sortBy: "name",
  descending: false,
});

function editTask(task: AutomatedTask, data: Partial<AutomatedTask>) {
  if (task.policy) return;
  taskStore.updateTask(task.id, data);
}

function deleteTask(task: AutomatedTask) {
  if (task.policy) return;

  $q.dialog({
    title: "Are you sure?",
    message: `Delete ${task.name} task`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    taskStore.removeTask(task.id);
  });
}

function runWinTask(task: AutomatedTask) {
  if (!task.enabled) {
    notifyError("Task cannot be run when it's disabled. Enable it first.");
    return;
  }

  $q.dialog({
    title: "Are you sure?",
    message: `Run ${task.name} task`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    taskStore.runTask(task.id, agentStore.selectedAgentId!);
  });
}

function showAddTask() {
  $q.dialog({
    component: AutomatedTaskForm,
    componentProps: {
      parent: { agent: agentStore.selectedAgentId },
      plat: agentPlatform.value,
    },
  });
}

function showEditTask(task: AutomatedTask) {
  if (task.policy) return;

  $q.dialog({
    component: AutomatedTaskForm,
    componentProps: {
      task: task,
      parent: { agent: agentStore.selectedAgentId },
      plat: agentPlatform.value,
    },
  });
}

function showScriptOutput(script: AutomatedTask) {
  $q.dialog({
    component: ScriptOutput,
    componentProps: {
      scriptInfo: script.task_result,
    },
  });
}

watch(
  () => agentStore.selectedAgentId,
  (newValue) => {
    if (newValue) {
      agentStore.getAgentTasks(newValue);
    }
  },
);

onMounted(() => {
  if (agentStore.selectedAgentId) agentStore.getAgentTasks(agentStore.selectedAgentId);
});
</script>
