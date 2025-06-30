<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="width: 65vw; max-width: 70vw; min-height: 50vh">
      <q-bar>
        <q-btn
          ref="refresh"
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="userStore.getUsers"
        />User Administration
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <div class="q-pa-md">
        <div class="q-gutter-sm">
          <q-btn
            ref="new"
            label="New"
            dense
            flat
            push
            unelevated
            no-caps
            icon="add"
            @click="showAddUserModal"
          />
        </div>
        <tactical-table
          v-model:pagination="pagination"
          dense
          :rows="userStore.users"
          :columns="columns"
          row-key="id"
          binary-state-sort
          hide-pagination
          virtual-scroll
          column-select
          storage-key="admin-manager"
        >
          <!-- header slots -->
          <template #header-cell-is_active="props">
            <q-th :props="props" auto-width>
              <q-icon name="power_settings_new" size="1.5em">
                <q-tooltip>Enable User</q-tooltip>
              </q-icon>
            </q-th>
          </template>

          <template #header-cell-sso="props">
            <q-th :props="props" auto-width></q-th>
          </template>

          <!-- No data Slot -->
          <template #no-data>
            <div class="full-width row flex-center q-gutter-sm">
              <span v-if="userStore.userCount === 0">No Users</span>
            </div>
          </template>

          <!-- body slots -->
          <template #body="props">
            <q-tr :props="props" class="cursor-pointer" @dblclick="showEditUserModal(props.row)">
              <!-- context menu -->
              <q-menu context-menu>
                <q-list dense style="min-width: 200px">
                  <q-item v-close-popup clickable @click="showEditUserModal(props.row)">
                    <q-item-section side>
                      <q-icon name="edit" />
                    </q-item-section>
                    <q-item-section>Edit</q-item-section>
                  </q-item>
                  <q-item
                    v-close-popup
                    clickable
                    :disable="props.row.username === loggedInUser"
                    @click="deleteUser(props.row)"
                  >
                    <q-item-section side>
                      <q-icon name="delete" />
                    </q-item-section>
                    <q-item-section>Delete</q-item-section>
                  </q-item>

                  <q-separator></q-separator>

                  <q-item
                    id="context-reset"
                    v-close-popup
                    clickable
                    :disable="props.row.social_accounts.length !== 0"
                    @click="ResetPassword(props.row)"
                  >
                    <q-item-section side>
                      <q-icon name="autorenew" />
                    </q-item-section>
                    <q-item-section>Reset Password</q-item-section>
                  </q-item>

                  <q-item
                    id="context-reset"
                    v-close-popup
                    clickable
                    :disable="props.row.social_accounts.length !== 0"
                    @click="reset2FA(props.row)"
                  >
                    <q-item-section side>
                      <q-icon name="autorenew" />
                    </q-item-section>
                    <q-item-section>Reset Two-Factor Auth</q-item-section>
                  </q-item>

                  <q-separator></q-separator>

                  <q-item
                    id="context-reset"
                    v-close-popup
                    clickable
                    :disable="props.row.social_accounts.length === 0"
                    @click="showSSOAccounts(props.row)"
                  >
                    <q-item-section side>
                      <q-icon name="groups" />
                    </q-item-section>
                    <q-item-section>Show Connected SSO Accounts</q-item-section>
                  </q-item>

                  <q-item
                    id="context-reset"
                    v-close-popup
                    clickable
                    @click="showSessions(props.row)"
                  >
                    <q-item-section side>
                      <q-icon name="groups" />
                    </q-item-section>
                    <q-item-section>Show Active Sessions</q-item-section>
                  </q-item>

                  <q-separator></q-separator>

                  <q-item v-close-popup clickable>
                    <q-item-section>Close</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
              <!-- enabled checkbox -->
              <q-td>
                <q-checkbox
                  v-model="props.row.is_active"
                  dense
                  :disable="props.row.username === loggedInUser"
                  @update:model-value="toggleEnabled(props.row)"
                />
              </q-td>
              <q-td>
                <q-chip v-if="props.row.social_accounts.length > 0" color="primary" dense
                  >SSO</q-chip
                >
              </q-td>
              <q-td>{{ props.row.username }}</q-td>
              <q-td>{{ props.row.first_name }} {{ props.row.last_name }}</q-td>
              <q-td>{{ props.row.email }}</q-td>
              <q-td v-if="props.row.last_login">{{
                dashboardStore.formatDate(props.row.last_login)
              }}</q-td>
              <q-td v-else>Never</q-td>
              <q-td>{{ props.row.last_login_ip }}</q-td>
            </q-tr>
          </template>
        </tactical-table>
      </div>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive } from "vue";
import { useQuasar, useDialogPluginComponent, type QTableProps } from "quasar";
import { useAuthStore } from "src/stores/auth";
import { useUserStore } from "../api";
import { useDashboardStore } from "src/stores/dashboard";

// types
import type { User } from "../types";

// ui imports
import UserForm from "./UserForm.vue";
import UserResetPasswordForm from "./UserResetPasswordForm.vue";
import SSOAccountsTable from "src/ee/sso/components/SSOAccountsTable.vue";
import UserSessionsTable from "./UserSessionsTable.vue";
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";

const columns: QTableProps["columns"] = [
  {
    name: "is_active",
    label: "Active",
    field: "is_active",
    align: "left",
  },
  {
    name: "sso",
    label: "",
    field: "sso",
    align: "left",
    sortable: true,
  },
  {
    name: "username",
    label: "Username",
    field: "username",
    align: "left",
    sortable: true,
  },
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "email",
    label: "Email",
    field: "email",
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
    name: "last_login_ip",
    label: "Last Logon From",
    field: "last_login_ip",
    align: "left",
    sortable: true,
  },
];

// setup stores
const dashboardStore = useDashboardStore();
const userStore = useUserStore();
const auth = useAuthStore();

const loggedInUser = computed(() => auth.username);

const $q = useQuasar();
const { dialogRef, onDialogHide } = useDialogPluginComponent();
defineEmits(useDialogPluginComponent.emits);

const pagination = reactive({
  rowsPerPage: 0,
  sortBy: "username",
  descending: true,
});

function showSSOAccounts(user: User) {
  $q.dialog({
    component: SSOAccountsTable,
    componentProps: {
      user,
    },
  });
}

function showSessions(user: User) {
  $q.dialog({
    component: UserSessionsTable,
    componentProps: {
      user,
    },
  });
}

function deleteUser(user: User) {
  $q.dialog({
    title: `Delete user ${user.username}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    userStore.removeUser(user.id);
  });
}

function showEditUserModal(user: User) {
  $q.dialog({
    component: UserForm,
    componentProps: {
      user: user,
    },
  });
}

function showAddUserModal() {
  $q.dialog({
    component: UserForm,
  });
}

function toggleEnabled(user: User) {
  if (user.username === loggedInUser.value) {
    return;
  }

  const data = {
    id: user.id,
    is_active: !user.is_active,
  };

  userStore.updateUser(user.id, data);
}

function ResetPassword(user: User) {
  $q.dialog({
    component: UserResetPasswordForm,
    componentProps: {
      user: user,
    },
  });
}

function reset2FA(user: User) {
  $q.dialog({
    title: `Reset MFA for ${user.username}?`,
    cancel: true,
    ok: { label: "Reset", color: "positive" },
  }).onOk(() => {
    userStore.adminResetMFA(user);
  });
}
</script>
