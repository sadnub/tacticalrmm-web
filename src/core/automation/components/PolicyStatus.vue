<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 70vw">
      <q-bar>
        <q-btn class="q-mr-sm" dense flat push icon="refresh" @click="refresh" />
        {{ title.slice(0, 27) }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section>
        <tactical-table
          v-model:pagination="pagination"
          style="max-height: 35vh"
          :rows="data"
          :columns="columns"
          :rows-per-page-options="[0]"
          row-key="id"
          binary-state-sort
          dense
          virtual-scroll
          hide-pagination
          no-data-label="There are no agents in this policy"
          storage-key="policy-status"
          :loading="isLoading"
        >
          <!-- header slots -->
          <template #header-cell-statusicon="headerProps">
            <q-th auto-width :props="headerProps"></q-th>
          </template>
          <!-- body slots -->
          <template #body="bodyProps">
            <q-tr :props="bodyProps">
              <q-td v-for="col in bodyProps.cols" :key="col.name" :props="bodyProps">
                <!-- agent hostname -->
                <template v-if="col.name === 'agent'">
                  {{ bodyProps.row.hostname }}
                </template>

                <!-- status icon -->
                <template v-else-if="col.name === 'statusicon'">
                  <q-icon
                    v-if="bodyProps.row.status === 'passing'"
                    style="font-size: 1.3rem"
                    :color="dashboardStore.dashboardSettings.dashPositiveColor"
                    name="check_circle"
                  >
                    <q-tooltip>Passing</q-tooltip>
                  </q-icon>
                  <q-icon
                    v-else-if="
                      bodyProps.row.status === 'failing' && bodyProps.row.alert_severity === 'info'
                    "
                    style="font-size: 1.3rem"
                    :color="dashboardStore.dashboardSettings.dashInfoColor"
                    name="info"
                  >
                    <q-tooltip>Informational</q-tooltip>
                  </q-icon>
                  <q-icon
                    v-else-if="
                      bodyProps.row.status === 'failing' &&
                      bodyProps.row.alert_severity === 'warning'
                    "
                    style="font-size: 1.3rem"
                    :color="dashboardStore.dashboardSettings.dashWarningColor"
                    name="warning"
                  >
                    <q-tooltip>Warning</q-tooltip>
                  </q-icon>
                  <q-icon
                    v-else-if="bodyProps.row.status === 'failing'"
                    style="font-size: 1.3rem"
                    :color="dashboardStore.dashboardSettings.dashNegativeColor"
                    name="error"
                  >
                    <q-tooltip>Error</q-tooltip>
                  </q-icon>
                </template>

                <!-- status text -->
                <template v-else-if="col.name === 'status'">
                  <span v-if="bodyProps.row.status === 'pending'"
                    >Awaiting First Synchronization</span
                  >
                  <span v-else-if="bodyProps.row.sync_status === 'notsynced'"
                    >Will sync on next agent checkin</span
                  >
                  <span v-else-if="bodyProps.row.sync_status === 'synced'">Synced with agent</span>
                  <span v-else-if="bodyProps.row.sync_status === 'pendingdeletion'"
                    >Pending deletion on agent</span
                  >
                  <span v-else-if="bodyProps.row.sync_status === 'initial'"
                    >Waiting for task creation on agent</span
                  >
                </template>

                <!-- more info -->
                <template v-else-if="col.name === 'moreinfo'">
                  <span
                    v-if="bodyProps.row.check_type === 'ping'"
                    class="ping-cell text-primary"
                    @click="pingInfo(bodyProps.row)"
                    >output</span
                  >
                  <span
                    v-else-if="
                      bodyProps.row.check_type === 'script' ||
                      bodyProps.row.retcode ||
                      bodyProps.row.stdout ||
                      bodyProps.row.stderr
                    "
                    class="script-cell text-primary"
                    @click="showScriptOutput(bodyProps.row)"
                    >output</span
                  >
                  <span
                    v-else-if="bodyProps.row.check_type === 'eventlog'"
                    class="eventlog-cell text-primary"
                    @click="showEventInfo(bodyProps.row)"
                    >output</span
                  >
                  <span
                    v-else-if="
                      bodyProps.row.check_type === 'cpuload' ||
                      bodyProps.row.check_type === 'memory'
                    "
                    >{{ bodyProps.row.history_info }}</span
                  >
                  <span v-else-if="bodyProps.row.more_info">{{ bodyProps.row.more_info }}</span>
                  <span v-else>Awaiting Output</span>
                </template>

                <!-- datetime -->
                <template v-else-if="col.name === 'datetime'">
                  {{ bodyProps.row.last_run ? formatDate(bodyProps.row.last_run) : "Never" }}
                </template>

                <!-- default fallback -->
                <template v-else>
                  {{ col.value }}
                </template>
              </q-td>
            </q-tr>
          </template>
        </tactical-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { usePolicyStore, useDashboardStore } from "src/stores/api";

const policyStore = usePolicyStore();
const dashboardStore = useDashboardStore();
import ScriptOutput from "src/core/scripts/components/ScriptOutput.vue";
import EventLogCheckOutput from "src/core/checks/components/EventLogCheckOutput.vue";
import PreDialog from "src/core/dashboard/ui/PreDialog.vue";

// Types
interface PolicyStatusItem {
  id: number;
  hostname: string;
  status: "passing" | "failing" | "pending";
  alert_severity?: "info" | "warning" | "error";
  sync_status?: "notsynced" | "synced" | "pendingdeletion" | "initial";
  check_type?: string;
  retcode?: number;
  stdout?: string;
  stderr?: string;
  history_info?: string;
  more_info?: string;
  last_run?: string;
  readable_desc?: string;
  name: string;
}

// Props and emits
const props = defineProps<{
  item: PolicyStatusItem;
  type: "task" | "check";
}>();
defineEmits([...useDialogPluginComponent.emits]);

const $q = useQuasar();
const { dialogRef, onDialogHide } = useDialogPluginComponent();

// stores
const { isLoading } = policyStore;

// state
const data = ref<PolicyStatusItem[]>([]);

const columns = [
  {
    name: "agent",
    label: "Hostname",
    field: "agent",
    align: "left" as const,
    sortable: true,
  },
  { name: "statusicon", label: "", field: "statusicon", align: "left" as const },
  {
    name: "status",
    label: "Status",
    field: "status",
    align: "left" as const,
    sortable: true,
  },
  {
    name: "moreinfo",
    label: "More Info",
    field: "more_info",
    align: "left" as const,
    sortable: true,
  },
  {
    name: "datetime",
    label: "Date / Time",
    field: "last_run",
    align: "left" as const,
    sortable: true,
  },
];

const pagination = reactive({
  rowsPerPage: 0,
  sortBy: "status",
  descending: false,
});

// Computed
const title = computed(() => {
  return props.item.readable_desc
    ? props.item.readable_desc + " Status"
    : props.item.name + " Status";
});

const formatDate = computed(() => dashboardStore.formatDate);

// Methods
async function getCheckData() {
  try {
    data.value = await policyStore.getCheckStatus(props.item.id);
  } catch {
    //
  }
}

async function getTaskData() {
  try {
    data.value = await policyStore.getTaskStatus(props.item.id);
  } catch {
    //
  }
}

function pingInfo(check: PolicyStatusItem) {
  $q.dialog({
    component: PreDialog,
    componentProps: {
      title: check.readable_desc,
      dialogStyle: "width: 50vw; max-width: 60vw",
      message: check.more_info,
    },
  });
}

function showEventInfo(data: PolicyStatusItem) {
  $q.dialog({
    component: EventLogCheckOutput,
    componentProps: {
      evtLogData: data,
    },
  });
}

function showScriptOutput(script: PolicyStatusItem) {
  $q.dialog({
    component: ScriptOutput,
    componentProps: {
      scriptInfo: script,
    },
  });
}

function refresh() {
  if (props.type === "task") {
    void getTaskData();
  } else {
    void getCheckData();
  }
}

// Lifecycle
onMounted(() => {
  if (props.type === "task") {
    void getTaskData();
  } else {
    void getCheckData();
  }
});
</script>
