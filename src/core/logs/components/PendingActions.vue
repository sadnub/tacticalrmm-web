<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="height: 70vh; min-width: 70vw" persistent>
      <q-bar>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="actionStore.getPendingActions"
        />
        {{ agent ? `Pending Actions for ${agent.hostname}` : "All Pending Actions" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <tactical-table
        dense
        style="max-height: 65vh"
        :rows="filteredActions"
        :columns="columns"
        :visible-columns="visibleColumns"
        :pagination="{ rowsPerPage: 0, sortBy: 'status', descending: false }"
        row-key="id"
        virtual-scroll
        :rows-per-page-options="[0]"
        no-data-label="No Pending Actions"
        :loading="loading"
        storage-key="pending-actions-table"
      >
        <template #top>
          <q-space />
          <q-btn
            :label="
              showCompleted
                ? `Hide ${completedCount} Completed`
                : `Show ${completedCount} Completed`
            "
            :icon="showCompleted ? 'visibility_off' : 'visibility'"
            dense
            flat
            @click="showCompleted = !showCompleted"
          />
        </template>

        <template #body="{ row }">
          <q-tr class="cursor-pointer">
            <q-menu context-menu auto-close>
              <q-list dense>
                <q-item
                  :disable="row.status === 'completed' || row.action_type === 'agentinstall'"
                  clickable
                  @click="cancelPendingAction(row)"
                >
                  <q-item-section side>
                    <q-icon name="fas fa-trash-alt" size="xs" />
                  </q-item-section>
                  <q-item-section>Cancel Action</q-item-section>
                </q-item>
                <q-separator />
                <q-item v-close-popup clickable>
                  <q-item-section>Close</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
            <q-td v-if="row.action_type === 'schedreboot'">
              <q-icon name="power_settings_new" size="sm" />
            </q-td>
            <q-td v-else-if="row.action_type === 'agentupdate'">
              <q-icon name="update" size="sm" />
            </q-td>
            <q-td v-else-if="row.action_type === 'chocoinstall'">
              <q-icon name="download" size="sm" />
            </q-td>
            <q-td v-if="row.status !== 'completed'">
              <span v-if="row.action_type === 'agentupdate'">{{ getNextAgentUpdateTime() }}</span>
              <span v-else>{{
                row.action_type === "schedreboot" ? dashboardStore.formatDate(row.due) : row.due
              }}</span>
            </q-td>
            <q-td v-else>Completed</q-td>
            <q-td>{{ row.description }}</q-td>
            <q-td v-if="!agent">{{ row.hostname }}</q-td>
            <q-td v-if="!agent">{{ row.client }}</q-td>
            <q-td v-if="!agent">{{ row.site }}</q-td>
            <q-td v-if="row.action_type === 'chocoinstall' && row.status === 'completed'">
              <q-btn
                color="primary"
                icon="preview"
                size="sm"
                label="View output"
                @click="showOutput(row.details.output)"
              />
            </q-td>
            <q-td v-else></q-td>
          </q-tr>
        </template>
      </tactical-table>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, onMounted } from "vue";
import { useQuasar, useDialogPluginComponent, type QTableProps } from "quasar";
import { usePendingActionStore } from "../api";
import { useDashboardStore } from "src/stores/dashboard";
import { getNextAgentUpdateTime } from "src/utils/format";

// ui imports
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";
import PreDialog from "src/components/ui/PreDialog.vue";

// types
import type { Agent } from "src/core/agents/types";
import type { PendingAction } from "../types";
// static data
const columns: QTableProps["columns"] = [
  { name: "id", field: "id", label: "" },
  { name: "status", field: "status", label: "" },
  {
    name: "type",
    label: "Type",
    field: "action_type",
    align: "left",
    sortable: true,
  },
  { name: "due", label: "Due", field: "due", align: "left", sortable: true },
  {
    name: "desc",
    label: "Description",
    field: "description",
    align: "left",
    sortable: true,
  },
  {
    name: "agent",
    label: "Agent",
    field: "hostname",
    align: "left",
    sortable: true,
  },
  {
    name: "client",
    label: "Client",
    field: "client",
    align: "left",
    sortable: true,
  },
  { name: "site", label: "Site", field: "site", align: "left", sortable: true },
  { name: "details", field: "details", label: "", align: "left", sortable: false },
];

const props = defineProps<{
  agent: Agent;
}>();

defineEmits(useDialogPluginComponent.emits);

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

// setup stores
const actionStore = usePendingActionStore();
const dashboardStore = useDashboardStore();

// pending actions logic
const showCompleted = ref(false);
const loading = ref(false);
const completedCount = computed(() => {
  try {
    return actionStore.pendingActions.filter((action) => action.status === "completed").length;
  } catch (e) {
    console.error(e);
    return 0;
  }
});

const visibleColumns = computed(() => {
  if (props.agent) return ["type", "due", "desc", "details"];
  else return ["type", "due", "desc", "agent", "client", "site", "details"];
});

const filteredActions = computed(() => {
  if (showCompleted.value) return actionStore.pendingActions;
  else return actionStore.pendingActions.filter((action) => action.status !== "completed");
});

function showOutput(details: string) {
  $q.dialog({
    component: PreDialog,
    componentProps: {
      title: "Pending Action Output Details",
      dialogStyle: "width: 75vw; max-width: 85vw; max-height: 65vh;",
      message: details,
    },
  });
}

function cancelPendingAction(action: PendingAction) {
  $q.dialog({
    title: "Delete this pending action?",
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    loading.value = true;

    actionStore.deletePendingAction(action.id);

    // TODO: Only update the agent and not pull every single agent
    // store.dispatch("refreshDashboard");

    loading.value = false;
  });
}

onMounted(actionStore.getPendingActions);
</script>
