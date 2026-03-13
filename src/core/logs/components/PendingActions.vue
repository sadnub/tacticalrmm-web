<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="height: 70vh; min-width: 70vw" no-backdrop-dismiss>
      <q-bar>
        <q-btn class="q-mr-sm" dense flat push icon="refresh" @click="refreshPendingActions()" />
        {{ agent ? `Pending Actions for ${agent.hostname}` : "All Pending Actions" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <tactical-table
        dense
        style="max-height: 65vh"
        :rows="filteredActions"
        :columns="columns"
        :pagination="{ rowsPerPage: 0, sortBy: 'status', descending: false }"
        row-key="id"
        virtual-scroll
        :rows-per-page-options="[0]"
        no-data-label="No Pending Actions"
        :loading="isLoading"
        :filter="search"
        column-select
        :storage-key="agent ? 'pending-actions-agent' : 'pending-actions-all'"
      >
        <template #top>
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
          <q-space />
          <q-input
            ref="searchInputRef"
            v-model="search"
            filled
            label="Search"
            dense
            clearable
            class="q-pr-sm"
            style="width: 300px"
            @keydown.esc.stop="search = ''"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
          <tactical-table-export />
        </template>

        <template #body="bodyProps">
          <q-tr class="cursor-pointer">
            <q-menu context-menu auto-close>
              <q-list dense>
                <q-item
                  :disable="
                    bodyProps.row.status === 'completed' ||
                    bodyProps.row.action_type === 'agentinstall'
                  "
                  clickable
                  @click="cancelPendingAction(bodyProps.row)"
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

            <q-td v-for="col in bodyProps.cols" :key="col.name" :props="bodyProps">
              <!-- action type -->
              <template v-if="col.name === 'type'">
                <template v-if="col.value === 'schedreboot'">
                  <q-icon name="power_settings_new" size="sm" />
                </template>
                <template v-else-if="col.value === 'agentupdate'">
                  <q-icon name="update" size="sm" />
                </template>
                <template v-else-if="col.value === 'chocoinstall'">
                  <q-icon name="download" size="sm" />
                </template>
              </template>

              <!-- description with optional output button -->
              <template v-else-if="col.name === 'desc'">
                {{ col.value }}
                <q-btn
                  v-if="
                    bodyProps.row.action_type === 'chocoinstall' &&
                    bodyProps.row.status === 'completed'
                  "
                  class="q-ml-sm"
                  color="primary"
                  icon="preview"
                  size="sm"
                  label="View output"
                  @click="showOutput(bodyProps.row.details?.output ?? '')"
                />
              </template>

              <template v-else>
                {{ col.value }}
              </template>
            </q-td>
          </q-tr>
        </template>
      </tactical-table>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useQuasar, useDialogPluginComponent, QInput } from "quasar";
import { usePendingActionStore, useDashboardStore } from "src/stores/api";
import { useAgentStore } from "src/stores/api";

const {
  pendingActions,
  agentPendingActions,
  isLoading,
  getPendingActions,
  getAgentPendingActions,
  deletePendingAction,
} = usePendingActionStore();

const { refreshAgentSearch } = useAgentStore();

const { formatDate } = useDashboardStore();
import { getNextAgentUpdateTime } from "src/utils/format";

// ui imports
import PreDialog from "src/core/dashboard/ui/PreDialog.vue";

// types
import type { Agent } from "src/core/agents/types";
import type { PendingAction } from "../types";
import type { TacticalColumn } from "src/core/dashboard/types";
// static data
const allColumns: TacticalColumn[] = [
  { name: "status", field: "status", label: "Status", align: "left", sortable: true },
  {
    name: "type",
    label: "Type",
    field: "action_type",
    align: "left",
    sortable: true,
  },
  {
    name: "due",
    label: "Due",
    field: "due",
    align: "left",
    sortable: true,
    format: (_, row) => {
      if (row.status !== "completed")
        if (row.action_type === "agentupdate") return getNextAgentUpdateTime();
        else return row.action_type === "schedreboot" ? formatDate(row.due) : row.due;
      else return "Completed";
    },
  },
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
];

const props = defineProps<{
  agent?: Agent;
}>();

defineEmits(useDialogPluginComponent.emits);

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

// pending actions logic - use agent-specific or all actions
const actionsSource = computed(() =>
  props.agent ? agentPendingActions.value : pendingActions.value,
);

const search = ref("");
const searchInputRef = ref<InstanceType<typeof QInput> | null>(null);
const showCompleted = ref(false);
const completedCount = computed(() => {
  try {
    return actionsSource.value.filter((action) => action.status === "completed").length;
  } catch (e) {
    console.error(e);
    return 0;
  }
});

const columns = computed(() => {
  if (props.agent) return allColumns.filter((c) => !["agent", "client", "site"].includes(c.name));
  return allColumns;
});

function refreshPendingActions() {
  if (props.agent) {
    void getAgentPendingActions(props.agent.agent_id);
  } else {
    getPendingActions();
  }
}

const filteredActions = computed(() => {
  if (showCompleted.value) return actionsSource.value;
  else return actionsSource.value.filter((action) => action.status !== "completed");
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
    void deletePendingAction(action.id);
    refreshAgentSearch();
  });
}

function onGlobalKeydown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === "f") {
    const el = dialogRef.value?.$el as HTMLElement | undefined;
    if (el && !el.contains(document.activeElement)) return;
    e.preventDefault();
    searchInputRef.value?.focus();
  }
}

onMounted(() => {
  refreshPendingActions();
  window.addEventListener("keydown", onGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
});
</script>
