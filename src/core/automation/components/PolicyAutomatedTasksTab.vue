<template>
  <tactical-table
    v-model:pagination="pagination"
    :rows="tasks"
    :columns="columns"
    :rows-per-page-options="[0]"
    dense
    row-key="id"
    binary-state-sort
    virtual-scroll
    column-select
    :filter="filter"
    :loading="isLoading"
    storage-key="policy-automated-tasks"
  >
    <template #top>
      <q-btn
        v-if="selectedPolicy"
        class="q-mr-sm"
        dense
        flat
        push
        icon="refresh"
        @click="getPolicyTasks(selectedPolicy, { force: true })"
      />
      <q-btn
        v-if="selectedPolicy"
        icon="add"
        label="Add Task"
        no-caps
        dense
        flat
        push
        @click="showAddTask"
      />
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
        <span v-if="!selectedPolicy">Click on a policy to see the tasks</span>
        <span v-else>There are no tasks added to this policy</span>
      </div>
    </template>
    <!-- header slots -->
    <template #header-cell-enabled="headerProps">
      <q-th auto-width :props="headerProps">
        <small>Enabled</small>
      </q-th>
    </template>

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

    <template #header-cell-collector="headerProps">
      <q-th auto-width :props="headerProps">
        <q-icon name="mdi-database-arrow-up" size="1.5em">
          <q-tooltip>Collector Task</q-tooltip>
        </q-icon>
      </q-th>
    </template>

    <!-- body slots -->
    <template #body="bodyProps">
      <q-tr class="cursor-pointer" @dblclick="showEditTask(bodyProps.row)">
        <!-- context menu -->
        <q-menu context-menu>
          <q-list dense style="min-width: 200px">
            <q-item v-close-popup clickable @click="runTask(bodyProps.row)">
              <q-item-section side>
                <q-icon name="play_arrow" />
              </q-item-section>
              <q-item-section>Run task now</q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="showEditTask(bodyProps.row)">
              <q-item-section side>
                <q-icon name="edit" />
              </q-item-section>
              <q-item-section>Edit</q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="deleteTask(bodyProps.row)">
              <q-item-section side>
                <q-icon name="delete" />
              </q-item-section>
              <q-item-section>Delete</q-item-section>
            </q-item>
            <q-separator />
            <q-item v-close-popup clickable @click="showStatus(bodyProps.row)">
              <q-item-section side>
                <q-icon name="sync" />
              </q-item-section>
              <q-item-section>Policy Status</q-item-section>
            </q-item>
            <q-separator />
            <q-item v-close-popup clickable>
              <q-item-section>Close</q-item-section>
            </q-item>
          </q-list>
        </q-menu>

        <q-td v-for="col in bodyProps.cols" :key="col.name" :props="bodyProps">
          <!-- enabled -->
          <template v-if="col.name === 'enabled'">
            <q-checkbox
              v-model="bodyProps.row.enabled"
              dense
              @update:model-value="(val) => editTask(bodyProps.row.id, { enabled: val })"
            />
          </template>

          <!-- sms alert -->
          <template v-else-if="col.name === 'smsalert'">
            <q-checkbox
              v-model="bodyProps.row.text_alert"
              dense
              @update:model-value="(val) => editTask(bodyProps.row.id, { text_alert: val })"
            />
          </template>

          <!-- email alert -->
          <template v-else-if="col.name === 'emailalert'">
            <q-checkbox
              v-model="bodyProps.row.email_alert"
              dense
              @update:model-value="(val) => editTask(bodyProps.row.id, { email_alert: val })"
            />
          </template>

          <!-- dashboard alert -->
          <template v-else-if="col.name === 'dashboardalert'">
            <q-checkbox
              v-model="bodyProps.row.dashboard_alert"
              dense
              @update:model-value="(val) => editTask(bodyProps.row.id, { dashboard_alert: val })"
            />
          </template>

          <!-- collector -->
          <template v-else-if="col.name === 'collector'">
            <q-icon v-if="!!bodyProps.row.custom_field" style="font-size: 1.3rem" name="check">
              <q-tooltip>The task updates a custom field on the agent</q-tooltip>
            </q-icon>
          </template>

          <!-- name -->
          <template v-else-if="col.name === 'name'">
            {{ bodyProps.row.name }}
          </template>

          <!-- schedule -->
          <template v-else-if="col.name === 'schedule'">
            {{ bodyProps.row.schedule }}
          </template>

          <!-- status -->
          <template v-else-if="col.name === 'status'">
            <span class="status-cell text-primary" @click="showStatus(bodyProps.row)"
              >See Status</span
            >
          </template>

          <!-- check_name -->
          <template v-else-if="col.name === 'check_name'">
            {{ bodyProps.row.check_name }}
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
import { notifyError } from "src/utils/notify";
import AutomatedTaskForm from "src/core/tasks/components/AutomatedTaskForm.vue";
import PolicyStatus from "./PolicyStatus.vue";
import { usePolicyTasksStore } from "src/stores/api";

const {
  isLoading,
  policyTasks: tasks,
  getPolicyTasks,
  updateTaskPartial,
  runTask: executeTask,
  removeTask,
} = usePolicyTasksStore();

// types
import type { AutomatedTaskUI } from "src/core/tasks/types";

const props = defineProps<{
  selectedPolicy: number;
}>();

const $q = useQuasar();
const columns = [
  { name: "enabled", label: "Enabled", align: "left" as const, field: "enabled" },
  { name: "smsalert", label: "SMS Alert", field: "text_alert", align: "left" as const },
  { name: "emailalert", label: "Email Alert", field: "email_alert", align: "left" as const },
  {
    name: "dashboardalert",
    label: "Dashboard Alert",
    field: "dashboard_alert",
    align: "left" as const,
  },
  {
    name: "collector",
    label: "Collector",
    field: "custom_field",
    align: "left" as const,
    sortable: true,
  },
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left" as const,
    sortable: true,
  },
  {
    name: "schedule",
    label: "Schedule",
    field: "schedule",
    align: "left" as const,
    sortable: true,
  },
  {
    name: "status",
    label: "More Info",
    field: "more_info",
    align: "left" as const,
    sortable: true,
  },
  {
    name: "check_name",
    label: "Assigned Check",
    field: "check_name",
    align: "left" as const,
    sortable: true,
  },
];
const pagination = ref({
  rowsPerPage: 0,
  sortBy: "name",
  descending: false,
});

const filter = ref("");
async function editTask(id: number, task: Partial<AutomatedTaskUI>) {
  try {
    await updateTaskPartial(id, task);
  } catch {
    // Error handling is done in the store
  }
}

function showAddTask() {
  $q.dialog({
    component: AutomatedTaskForm,
    componentProps: {
      parent: { policy: props.selectedPolicy },
    },
  });
}

function showEditTask(task: AutomatedTaskUI) {
  $q.dialog({
    component: AutomatedTaskForm,
    componentProps: {
      task: task,
      parent: { policy: props.selectedPolicy },
    },
  });
}

function showStatus(task: AutomatedTaskUI) {
  $q.dialog({
    component: PolicyStatus,
    componentProps: {
      type: "task",
      item: task,
    },
  });
}

function runTask(task: AutomatedTaskUI) {
  if (!task.enabled) {
    notifyError("Task cannot be run when it's disabled. Enable it first.");
    return;
  }

  $q.dialog({
    title: "Are you sure?",
    message: `Run ${task.name} task`,
    cancel: true,
    noBackdropDismiss: true,
  }).onOk(() => {
    if (!task.id) return;
    executeTask(task.id);
  });
}

function deleteTask(task: AutomatedTaskUI) {
  $q.dialog({
    title: "Are you sure?",
    message: `Delete ${task.name} task`,
    cancel: true,
    noBackdropDismiss: true,
  }).onOk(() => {
    if (!task.id) return;
    void removeTask(task.id);
  });
}

// watchers
watch(
  () => props.selectedPolicy,
  (newValue) => {
    if (newValue) getPolicyTasks(newValue);
  },
);

onMounted(() => getPolicyTasks(props.selectedPolicy));
</script>
