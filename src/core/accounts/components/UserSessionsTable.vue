<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="width: 60vw; max-width: 90vw; min-height: 40vh">
      <q-bar>
        User Sessions for {{ user.username }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
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
            class="q-pr-sm"
            @click="removeAllSessions"
          />

          <tactical-table-export />
        </template>
        <template #body="bodyProps">
          <q-tr>
            <q-td v-for="col in bodyProps.cols" :key="col.name" :props="bodyProps">
              <template v-if="col.name === 'action'">
                <q-btn
                  size="sm"
                  label="Disconnect"
                  color="negative"
                  @click="removeSession(bodyProps.row)"
                ></q-btn>
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

<script setup lang="ts">
// composition imports
import { onMounted } from "vue";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { useUserStore } from "../api";
import { useDashboardStore } from "src/stores/dashboard";

//types
import type { User, UserSession } from "../types";
import type { TacticalColumn } from "src/core/dashboard/types";

const columns: TacticalColumn[] = [
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
