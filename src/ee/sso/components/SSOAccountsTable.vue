<!--
Copyright (c) 2023-present Amidaware Inc.
This file is subject to the EE License Agreement.
For details, see: https://license.tacticalrmm.com/ee
-->

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 60vw; max-width: 90vw; min-height: 40vh">
      <q-bar>
        Connected Social Accounts for {{ user.username }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-table
        dense
        :table-class="{
          'table-bgcolor': !$q.dark.isActive,
          'table-bgcolor-dark': $q.dark.isActive,
        }"
        :style="{ 'max-height': `${$q.screen.height - 24}px` }"
        class="tbl-sticky"
        :rows="user.social_accounts"
        :columns="columns"
        :loading="loading"
        :pagination="{ rowsPerPage: 0, sortBy: 'display', descending: true }"
        row-key="id"
        binary-state-sort
        virtual-scroll
        :rows-per-page-options="[0]"
      >
        <template #body="{ row }">
          <q-tr>
            <!-- rows -->
            <td>{{ row.display }}</td>
            <td>{{ row.provider }}</td>
            <td>{{ formatDate(row.last_login) }}</td>
            <td>{{ formatDate(row.date_joined) }}</td>
            <td>
              <q-btn
                size="sm"
                label="Disconnect"
                color="negative"
                @click="removeSSOAccount(row)"
              ></q-btn>
            </td>
          </q-tr>
        </template>
      </q-table>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// composition imports
import { ref } from "vue";
import { useDialogPluginComponent, useQuasar, type QTableColumn } from "quasar";
import { disconnectSSOAccount } from "src/ee/sso/api/sso";
import { notifySuccess } from "src/utils/notify";
import { useAuthStore } from "src/stores/auth";
import { formatDate } from "src/utils/format";

//types
import type { SSOAccount, SSOUser } from "../types/sso";

const columns: QTableColumn[] = [
  {
    name: "display",
    label: "Display Name",
    field: "display",
    align: "left",
    sortable: true,
  },
  {
    name: "provider",
    label: "Provider",
    field: "provider",
    align: "left",
    sortable: true,
  },
  {
    name: "last_login",
    label: "Last Login",
    field: "last_login",
    align: "left",
    sortable: true,
  },
  {
    name: "date_joined",
    label: "Date Joined",
    field: "date_joined",
    align: "left",
    sortable: true,
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
  user: SSOUser;
}>();

const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();
const auth = useAuthStore();

const loading = ref(false);

function removeSSOAccount(account: SSOAccount) {
  $q.dialog({
    title: `Disconnect social account: ${account.display}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    loading.value = true;

    disconnectSSOAccount(account.provider, account.uid)
      .then(async () => {
        notifySuccess("Social account disconnected successfully");
        if (auth.username === props.user.username && auth.ssoLoginProvider === account.provider) {
          await auth.logout();
        }
      })
      .catch(() => {})
      .finally(() => {
        loading.value = false;
        onDialogHide();
      });
  });
}
</script>
