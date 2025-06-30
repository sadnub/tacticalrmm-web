<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="width: 60vw; max-width: 90vw; min-height: 40vh">
      <q-bar>
        User Sessions for {{ user.username }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <tactical-table
        dense
        :style="{ 'max-height': `${$q.screen.height - 24}px` }"
        :rows="userStore.userSessions"
        :columns="columns"
        :loading="userStore.isLoading"
        :pagination="{ rowsPerPage: 0, sortBy: 'display', descending: true }"
        row-key="id"
        binary-state-sort
        virtual-scroll
        :rows-per-page-options="[0]"
        column-select
        storage-key="user-sessions"
      >
        <template #top>
          <q-space />
          <q-btn
            label="Remove All Sessions"
            size="sm"
            color="negative"
            @click="removeAllSessions"
          />
        </template>
        <template #body="{ row }">
          <q-tr>
            <!-- rows -->
            <q-td>{{ row.created }}</q-td>
            <q-td>{{ row.expiry }}</q-td>
            <q-td>
              <q-btn
                size="sm"
                label="Disconnect"
                color="negative"
                @click="removeSession(row)"
              ></q-btn>
            </q-td>
          </q-tr>
        </template>
      </tactical-table>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// composition imports
import { onMounted } from "vue";
import { useDialogPluginComponent, useQuasar, type QTableColumn } from "quasar";
import { useUserStore } from "../api";
import { useDashboardStore } from "src/stores/dashboard";

//types
import type { User, UserSession } from "../types";
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";

const columns: QTableColumn[] = [
  {
    name: "created",
    label: "Created",
    field: "created",
    align: "left",
    sortable: true,
    format: (val: string) => dashboardStore.formatDate(val),
  },
  {
    name: "expiry",
    label: "Expires",
    field: "expiry",
    align: "left",
    sortable: true,
    format: (val: string) => dashboardStore.formatDate(val),
  },
  {
    name: "action",
    label: "",
    field: "action",
    align: "left",
    sortable: true,
  },
];

// emits
defineEmits([...useDialogPluginComponent.emits]);

// props
const props = defineProps<{
  user: User;
}>();

// setup stores
const userStore = useUserStore();
const dashboardStore = useDashboardStore();

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

function removeSession(session: UserSession) {
  $q.dialog({
    title: `Disconnect session for ${session.user}?`,
    message: "This user will be signed out immediately.",
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    userStore.removeSession(session.digest);
  });
}

function removeAllSessions() {
  $q.dialog({
    title: `Disconnect all sessions for ${props.user.username}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    userStore.removeAllUserSessions(props.user.id);
  });
}

onMounted(() => userStore.getSessionsForUser(props.user.id));
</script>
