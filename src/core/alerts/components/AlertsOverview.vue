<template>
  <q-dialog
    ref="dialogRef"
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    @hide="onDialogHide"
  >
    <q-card>
      <q-bar>
        <q-btn class="q-mr-sm" dense flat push icon="refresh" @click="search" />
        <q-space />
        Alerts Overview
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>

      <div class="text-h6 q-pl-sm q-pt-sm">Filter</div>
      <div class="row">
        <div class="q-pa-sm col-3">
          <q-select
            v-model="clientFilter"
            :options="clientOptions"
            label="Clients"
            multiple
            filled
            dense
            use-chips
            map-options
            emit-value
          />
        </div>
        <div class="q-pa-sm col-3">
          <q-select
            v-model="severityFilter"
            :options="severityOptions"
            label="Severity"
            multiple
            filled
            dense
            use-chips
            map-options
            emit-value
          />
        </div>
        <div class="q-pa-sm col-2">
          <q-select
            v-model="timeFilter"
            filled
            dense
            label="Time"
            emit-value
            map-options
            :options="timeOptions"
          />
        </div>
        <div class="q-pa-sm col-2">
          <q-checkbox v-model="includeSnoozed" filled dense label="Include snoozed" />
          <q-checkbox v-model="includeResolved" filled dense label="Include resolved" />
        </div>
        <div class="q-pa-sm col-2">
          <q-btn color="primary" label="Search" @click="search" />
        </div>
      </div>

      <q-separator />

      <q-card-section>
        <tactical-table
          v-model:pagination="pagination"
          v-model:selected="selectedAlerts"
          :rows="alerts"
          :columns="columns"
          :rows-per-page-options="[25, 50, 100, 500, 1000]"
          :no-data-label="noDataText"
          :visible-columns="visibleColumns"
          selection="multiple"
          binary-state-sort
          row-key="id"
          dense
          virtual-scroll
          :loading="isLoading"
          storage-key="alerts-overview"
        >
          <template #top>
            <div class="col-1 q-table__title">Alerts</div>

            <q-btn-dropdown
              flat
              label="Bulk Actions"
              :disable="selectedAlerts.length === 0 || includeResolved"
            >
              <q-list dense>
                <q-item v-close-popup clickable @click="snoozeAlertBulk(selectedAlerts)">
                  <q-item-section avatar>
                    <q-icon name="alarm_off" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Snooze alerts</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item v-close-popup clickable @click="resolveAlertBulk(selectedAlerts)">
                  <q-item-section avatar>
                    <q-icon name="flag" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>Resolve alerts</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-icon
                v-if="props.row.action_run"
                name="mdi-archive-alert"
                size="sm"
                class="cursor-pointer"
                @click="showScriptOutput(props.row, true)"
              >
                <q-tooltip>Show failure action run results</q-tooltip>
              </q-icon>
              <q-icon
                v-if="props.row.resolved_action_run"
                name="mdi-archive-check"
                size="sm"
                class="cursor-pointer"
                @click="showScriptOutput(props.row, false)"
              >
                <q-tooltip>Show resolved action run results</q-tooltip>
              </q-icon>
              <q-icon
                v-if="!props.row.resolved && !props.row.snoozed"
                name="snooze"
                size="sm"
                class="cursor-pointer"
                @click="snoozeAlert(props.row)"
              >
                <q-tooltip>Snooze alert</q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="!props.row.resolved && props.row.snoozed"
                name="alarm_off"
                size="sm"
                class="cursor-pointer"
                @click="unsnoozeAlert(props.row)"
              >
                <q-tooltip>Unsnooze alert</q-tooltip>
              </q-icon>
              <q-icon
                v-if="!props.row.resolved"
                name="flag"
                size="sm"
                class="cursor-pointer"
                @click="resolveAlert(props.row)"
              >
                <q-tooltip>Resolve alert</q-tooltip>
              </q-icon>
            </q-td>
          </template>

          <template #body-cell-severity="props">
            <q-td :props="props">
              <q-badge :color="alertColor(props.row.severity)">{{
                capitalize(props.row.severity)
              }}</q-badge>
            </q-td>
          </template>
        </tactical-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import ScriptOutput from "src/core/scripts/components/ScriptOutput.vue";
import { useDashboardStore } from "src/stores/dashboard";
import { useClientDropdown } from "src/core/clients/composables";
import { capitalize } from "src/utils/format";
import { alertsStore } from "src/stores/api";
import type { Alert, AlertSearchParams, AlertSeverity } from "src/core/alerts/types";

// emits
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

// stores
const dashboardStore = useDashboardStore();
const { alerts, isLoading } = alertsStore;

// composables
const { clientOptions } = useClientDropdown();

// state
const selectedAlerts = ref<Alert[]>([]);
const severityFilter = ref<AlertSeverity[]>([]);
const clientFilter = ref<number[]>([]);
const timeFilter = ref<number>(30);
const includeResolved = ref(false);
const includeSnoozed = ref(false);
const searched = ref(false);

const severityOptions = [
  { label: "Informational", value: "info" },
  { label: "Warning", value: "warning" },
  { label: "Error", value: "error" },
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

const columns = [
  {
    name: "alert_time",
    label: "Time",
    field: "alert_time",
    align: "left" as const,
    sortable: true,
    format: (a: string) => dashboardStore.formatDate(a),
  },
  { name: "client", label: "Client", field: "client", align: "left" as const, sortable: true },
  { name: "site", label: "Site", field: "site", align: "left" as const, sortable: true },
  { name: "hostname", label: "Agent", field: "hostname", align: "left" as const, sortable: true },
  {
    name: "alert_type",
    label: "Type",
    field: "alert_type",
    align: "left" as const,
    sortable: true,
    format: (a: string) => capitalize(a),
  },
  {
    name: "severity",
    label: "Severity",
    field: "severity",
    align: "left" as const,
    sortable: true,
  },
  { name: "message", label: "Message", field: "message", align: "left" as const, sortable: true },
  {
    name: "resolved_on",
    label: "Resolved On",
    field: "resolved_on",
    align: "left" as const,
    sortable: true,
    format: (a: string) => dashboardStore.formatDate(a),
  },
  {
    name: "snoozed_until",
    label: "Snoozed Until",
    field: "snoozed_until",
    align: "left" as const,
    sortable: true,
    format: (a: string) => dashboardStore.formatDate(a),
  },
  { name: "actions", label: "Actions", field: "actions", align: "left" as const },
];

const pagination = reactive({ rowsPerPage: 50, sortBy: "alert_time", descending: true });

const noDataText = computed(() =>
  searched.value ? "No data found. Try to refine you search" : "Click search to find alerts",
);

const visibleColumns = computed(() => {
  return columns.map((column) => {
    if (column.name === "snoozed_until") {
      if (includeSnoozed.value) return column.name;
    } else if (column.name === "resolved_on") {
      if (includeResolved.value) return column.name;
    } else {
      return column.name;
    }
  });
});

function search() {
  selectedAlerts.value = [];
  searched.value = true;

  const params: AlertSearchParams = {
    snoozedFilter: includeSnoozed.value,
    resolvedFilter: includeResolved.value,
  };

  if (clientFilter.value.length > 0) params.clientFilter = clientFilter.value;
  if (timeFilter.value) params.timeFilter = timeFilter.value;
  if (severityFilter.value.length > 0) params.severityFilter = severityFilter.value;

  void alertsStore.searchAlerts(params);
}

function snoozeAlert(alert: Alert) {
  $q.dialog({
    title: "Snooze Alert",
    message: "How many days to snooze alert?",
    prompt: {
      model: "",
      type: "number",
      isValid: (val: string) => {
        const n = Number(val);
        return !!n && n > 0 && n < 9999;
      },
    },
    cancel: true,
  }).onOk((days: number) => {
    void alertsStore.snoozeAlert(alert.id, days).then(() => {
      search();
    });
  });
}

function unsnoozeAlert(alert: Alert) {
  void alertsStore.unsnoozeAlert(alert.id).then(() => {
    search();
  });
}

function resolveAlert(alert: Alert) {
  void alertsStore.resolveAlert(alert.id).then(() => {
    search();
  });
}

function resolveAlertBulk(alertsParam: Alert[]) {
  const ids = alertsParam.map((a) => a.id);
  void alertsStore.bulkResolveAlerts(ids).then(() => {
    search();
  });
}

function snoozeAlertBulk(alertsParam: Alert[]) {
  $q.dialog({
    title: "Snooze Alert",
    message: "How many days to snooze alert?",
    prompt: {
      model: "",
      type: "number",
      isValid: (val: string) => {
        const n = Number(val);
        return !!n && n > 0 && n < 9999;
      },
    },
    cancel: true,
  }).onOk((days: number) => {
    const ids = alertsParam.map((a) => a.id);
    void alertsStore.bulkSnoozeAlerts(ids, days).then(() => {
      search();
    });
  });
}

function showScriptOutput(alert: Alert, failure = false) {
  const results: Record<string, unknown> = {};
  if (failure) {
    results.readable_desc = `${alert.alert_type} failure action results`;
    results.execution_time = alert.action_execution_time;
    results.retcode = alert.action_retcode;
    results.stdout = alert.action_stdout;
    results.errout = alert.action_errout;
    results.last_run = alert.action_run;
  } else {
    results.readable_desc = `${alert.alert_type} resolved action results`;
    results.execution_time = alert.resolved_action_execution_time;
    results.retcode = alert.resolved_action_retcode;
    results.stdout = alert.resolved_action_stdout;
    results.errout = alert.resolved_action_errout;
    results.last_run = alert.resolved_action_run;
  }

  $q.dialog({
    component: ScriptOutput,
    componentProps: { scriptInfo: results },
  });
}

function alertColor(severity: string) {
  if (severity === "error") return "red";
  if (severity === "warning") return "orange";
  if (severity === "info") return "info";
}
</script>
