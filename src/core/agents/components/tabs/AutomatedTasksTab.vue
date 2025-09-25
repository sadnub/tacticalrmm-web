<template>
  <div v-if="!selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <tactical-table
      v-model:pagination="pagination"
      dense
      :style="{ 'max-height': `${tabHeight}px` }"
      :rows="tasks"
      :columns="columns"
      row-key="id"
      binary-state-sort
      virtual-scroll
      :loading="isLoading"
      :rows-per-page-options="[0]"
      no-data-label="No tasks"
      column-select
      storage-key="agent-tasks-tab"
    >
      <template #top>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="selectedAgentId && getAgentTasks(selectedAgentId, { force: true })"
        />
        <q-btn icon="add" label="Add Task" no-caps dense flat push @click="showAddTask" />

        <q-space />

        <q-input v-model="search" filled label="Search" dense clearable class="q-pr-sm">
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <tactical-table-export />
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
              <q-item v-close-popup clickable @click="runWinTask(props.row)">
                <q-item-section side>
                  <q-icon name="play_arrow" />
                </q-item-section>
                <q-item-section>Run task now</q-item-section>
              </q-item>
              <q-item
                v-if="!props.row.policy"
                v-close-popup
                clickable
                @click="showEditTask(props.row)"
              >
                <q-item-section side>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>Edit</q-item-section>
              </q-item>
              <q-item
                v-if="!props.row.policy"
                v-close-popup
                clickable
                @click="deleteTask(props.row)"
              >
                <q-item-section side>
                  <q-icon name="delete" />
                </q-item-section>
                <q-item-section>Delete</q-item-section>
              </q-item>
              <q-separator></q-separator>
              <q-item v-close-popup clickable>
                <q-item-section>Close</q-item-section>
              </q-item>
            </q-list>
          </q-menu>

          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <!-- enabled -->
            <template v-if="col.name === 'enabled'">
              <q-checkbox
                v-model="props.row.enabled"
                dense
                :disable="!!props.row.policy"
                @update:model-value="editTask(props.row, { enabled: !props.row.enabled })"
              />
            </template>

            <!-- text alert -->
            <template v-else-if="col.name === 'smsalert'">
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
                v-model="props.row.text_alert"
                dense
                :disable="!!props.row.policy"
                @update:model-value="editTask(props.row, { text_alert: !props.row.text_alert })"
              />
            </template>

            <!-- email alert -->
            <template v-else-if="col.name === 'emailalert'">
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
                v-model="props.row.email_alert"
                dense
                :disable="!!props.row.policy"
                @update:model-value="editTask(props.row, { email_alert: !props.row.email_alert })"
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
                  editTask(props.row, {
                    dashboard_alert: !props.row.dashboard_alert,
                  })
                "
              />
            </template>

            <!-- policy check icon -->
            <template v-else-if="col.name === 'policystatus'">
              <q-icon v-if="props.row.policy" style="font-size: 1.3rem" name="policy">
                <q-tooltip>This task is managed by a policy</q-tooltip>
              </q-icon>
            </template>

            <!-- is collector task -->
            <template v-else-if="col.name === 'collector'">
              <q-icon v-if="!!props.row.custom_field" style="font-size: 1.3rem" name="check">
                <q-tooltip>The task updates a custom field on the agent</q-tooltip>
              </q-icon>
            </template>

            <!-- status icon -->
            <template v-else-if="col.name === 'status'">
              <template v-if="Object.keys(props.row.task_result).length === 0"></template>
              <template v-else-if="props.row.task_result.status === 'passing'">
                <q-icon style="font-size: 1.3rem" :color="dashPositiveColor" name="check_circle">
                  <q-tooltip>Passing</q-tooltip>
                </q-icon>
              </template>
              <template v-else-if="props.row.task_result.status === 'failing'">
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
              </template>
            </template>

            <!-- sync status -->
            <template v-else-if="col.name === 'sync_status'">
              <template v-if="props.row.task_result.sync_status === 'notsynced'"
                >Will sync on next agent checkin</template
              >
              <template v-else-if="props.row.task_result.sync_status === 'synced'"
                >Synced with agent</template
              >
              <template v-else-if="props.row.task_result.sync_status === 'pendingdeletion'"
                >Pending deletion on agent</template
              >
              <template v-else>Waiting for task creation on agent</template>
            </template>

            <!-- more info -->
            <template v-else-if="col.name === 'more_info'">
              <span
                v-if="
                  props.row.task_result.retcode !== null ||
                  props.row.task_result.stdout ||
                  props.row.task_result.stderr
                "
                style="cursor: pointer; text-decoration: underline"
                class="text-primary"
                @click="showScriptOutput(props.row)"
              >
                output
              </span>
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
import { taskStore } from "src/stores/api";
import { agentStore } from "src/stores/api";
import { useDashboardStore } from "src/stores/dashboard";
import { notifyError } from "src/utils/notify";

// ui imports
import AutomatedTaskForm from "src/core/tasks/components/AutomatedTaskForm.vue";
import ScriptOutput from "src/core/scripts/components/ScriptOutput.vue";

// type imports
import type { AutomatedTaskUI } from "src/core/tasks/types";
import type { TacticalColumn } from "src/core/dashboard/types";

// static data
const columns: TacticalColumn[] = [
  { name: "enabled", align: "left", field: "enabled", label: "Enabled", sortable: true },
  { name: "smsalert", field: "text_alert", align: "left", label: "SMS Alert" },
  { name: "emailalert", field: "email_alert", align: "left", label: "Email Alert" },
  { name: "dashboardalert", field: "dashboard_alert", align: "left", label: "Dashboard Alert" },
  { name: "policystatus", field: "policystatus", align: "left", label: "Policy Status" },
  {
    name: "collector",
    label: "Collector",
    field: "custom_field",
    align: "left",
    sortable: true,
  },
  { name: "status", field: "status", align: "left", label: "Status", sortable: true },
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
    field: (row) => row.task_result.last_run,
    align: "left",
    sortable: true,
    format: (val: string) => (val ? dashboardStore.formatDate(val) : "Has not run yet"),
  },
  {
    name: "schedule",
    label: "Schedule",
    field: "schedule",
    align: "left",
    sortable: true,
  },
  {
    name: "check_name",
    label: "Assigned Check",
    field: "check_name",
    align: "left",
    sortable: true,
  },
];

// setup stores
const dashboardStore = useDashboardStore();
const { selectedAgentPlatform, selectedAgentId } = agentStore;
const { tasks, getAgentTasks, isLoading, updateTaskPartial, removeTask, runTask } = taskStore;

const tabHeight = computed(() => dashboardStore.tabHeight);

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

const search = ref("");

async function editTask(task: AutomatedTaskUI, data: Partial<AutomatedTaskUI>) {
  if (task.policy) return;

  if (task.id) await updateTaskPartial(task.id, data);
}

function deleteTask(task: AutomatedTaskUI) {
  if (task.policy) return;

  $q.dialog({
    title: "Are you sure?",
    message: `Delete ${task.name} task`,
    cancel: true,
    color: "primary",
    noBackdropDismiss: true,
  }).onOk(() => {
    if (task.id) void removeTask(task.id);
  });
}

function runWinTask(task: AutomatedTaskUI) {
  if (!task.enabled) {
    notifyError("Task cannot be run when it's disabled. Enable it first.");
    return;
  }

  $q.dialog({
    title: "Are you sure?",
    message: `Run ${task.name} task`,
    cancel: true,
    color: "primary",
    noBackdropDismiss: true,
  }).onOk(() => {
    if (task.id && selectedAgentId.value) runTask(task.id, selectedAgentId.value);
  });
}

function showAddTask() {
  $q.dialog({
    component: AutomatedTaskForm,
    componentProps: {
      parent: { agent: selectedAgentId.value },
      plat: selectedAgentPlatform.value,
    },
  });
}

function showEditTask(task: AutomatedTaskUI) {
  if (task.policy) return;

  $q.dialog({
    component: AutomatedTaskForm,
    componentProps: {
      task: task,
      parent: { agent: selectedAgentId.value },
      plat: selectedAgentPlatform.value,
    },
  });
}

function showScriptOutput(script: AutomatedTaskUI) {
  $q.dialog({
    component: ScriptOutput,
    componentProps: {
      scriptInfo: script.task_result,
    },
  });
}

watch(selectedAgentId, (newValue) => {
  if (newValue) {
    getAgentTasks(newValue);
  }
});

onMounted(() => {
  if (selectedAgentId.value) getAgentTasks(selectedAgentId.value);
});
</script>
