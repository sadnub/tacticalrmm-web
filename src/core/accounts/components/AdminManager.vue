<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card style="width: 65vw; max-width: 70vw; min-height: 50vh">
      <q-bar>
        <q-btn
          ref="refresh"
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="getUsers({ force: true })"
        />User Administration
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <tactical-table
        v-model:pagination="pagination"
        dense
        :rows="users"
        :columns="columns"
        :filter="search"
        row-key="id"
        binary-state-sort
        column-select
        storage-key="admin-manager"
      >
        <template #top>
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

          <q-space />

          <q-input
            v-model="search"
            style="width: 300px"
            filled
            label="Search"
            dense
            clearable
            class="q-pr-sm"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <tactical-table-export />
        </template>

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
            <span v-if="userCount === 0">No Users</span>
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

                <q-item v-close-popup clickable @click="showSessions(props.row)">
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

            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <!-- enabled checkbox -->
              <template v-if="col.name === 'is_active'">
                <q-checkbox
                  v-model="props.row.is_active"
                  dense
                  :disable="props.row.username === loggedInUser"
                  @update:model-value="toggleEnabled(props.row)"
                />
              </template>

              <!-- sso user -->
              <template v-else-if="col.name === 'sso'">
                <q-chip
                  v-if="props.row.social_accounts && props.row.social_accounts.length > 0"
                  color="primary"
                  dense
                  >SSO
                </q-chip>
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
import { ref, computed, onMounted } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { useAuthStore, useUserStore, useDashboardStore } from "src/stores/api";

const { users, userCount, getUsers, updateUser, removeUser, adminResetMFA } = useUserStore();
const { formatDate } = useDashboardStore();

// ui imports
import UserForm from "./UserForm.vue";
import UserResetPasswordForm from "./UserResetPasswordForm.vue";
import SSOAccountsTable from "src/ee/sso/components/SSOAccountsTable.vue";
import UserSessionsTable from "./UserSessionsTable.vue";

// types
import type { User } from "../types";
import type { TacticalColumn } from "src/core/dashboard/types";

const columns: TacticalColumn[] = [
  {
    name: "is_active",
    label: "Active",
    field: "is_active",
    align: "left",
    sortable: true,
    required: true,
  },
  {
    name: "sso",
    label: "SSO User",
    field: "sso",
    align: "left",
    sortable: true,
    required: true,
  },
  {
    name: "username",
    label: "Username",
    field: "username",
    align: "left",
    sortable: true,
    required: true,
  },
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left",
    sortable: true,
    format: (_: string, row) => `${row.first_name} ${row.last_name}`,
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
    format: (val: string) => (val ? formatDate(val) : "Never"),
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
const { username } = useAuthStore();

const loggedInUser = computed(() => username.value);

const $q = useQuasar();
const { dialogRef, onDialogHide } = useDialogPluginComponent();
defineEmits(useDialogPluginComponent.emits);

const search = ref("");
const pagination = ref({
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
    void removeUser(user.id);
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

  void updateUser(user.id, data);
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
    void adminResetMFA(user);
  });
}

onMounted(getUsers);
</script>
