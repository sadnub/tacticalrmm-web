<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="min-width: 60vw; height: 75vh">
      <q-bar>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          icon="refresh"
          @click="roleStore.getRoles({ force: true })"
        />
        <q-space />Manage Roles
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <tactical-table
        dense
        style="max-height: 70vh"
        binary-state-sort
        virtual-scroll
        :rows="roleStore.roles"
        :columns="columns"
        row-key="id"
        :pagination="{ rowsPerPage: 0, sortBy: 'name', descending: false }"
        no-data-label="No Roles"
        :rows-per-page-options="[0]"
        column-select
        storage-key="permission-manager"
      >
        <template #top>
          <q-btn flat dense icon="add" label="New Role" @click="showAddRoleModal" />
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
        <template #body="props">
          <q-tr :props="props" class="cursor-pointer" @dblclick="showEditRoleModal(props.row)">
            <q-menu context-menu auto-close>
              <q-list dense style="min-width: 200px">
                <q-item clickable @click="showEditRoleModal(props.row)">
                  <q-item-section side>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item
                  clickable
                  :disable="props.row.user_count > 0"
                  @click="deleteRole(props.row)"
                >
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item clickable>
                  <q-item-section>Close</q-item-section>
                </q-item>
              </q-list>
            </q-menu>

            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <!-- is super user column-->
              <template v-if="col.name === 'is_superuser'">
                <q-icon v-if="props.row.is_superuser" name="done" color="primary" size="sm" />
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
import { onMounted, ref } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { useRoleStore } from "../api";

// type imports
import type { Role } from "../types";

// ui imports
import RolesForm from "./RolesForm.vue";
import type { TacticalColumn } from "src/core/dashboard/types";

// static data
const columns: TacticalColumn[] = [
  { name: "name", label: "Name", field: "name", align: "left", sortable: true, required: true },
  {
    name: "is_superuser",
    label: "Superuser",
    field: "is_superuser",
    align: "left",
    sortable: true,
  },
  {
    name: "user_count",
    label: "Assigned Users",
    field: "user_count",
    align: "left",
    sortable: true,
  },
];

defineEmits(useDialogPluginComponent.emits);

// setup quasar
const $q = useQuasar();
const { dialogRef, onDialogHide } = useDialogPluginComponent();

// setup stores
const roleStore = useRoleStore();

const search = ref("");

function showEditRoleModal(role: Role) {
  $q.dialog({
    component: RolesForm,
    componentProps: {
      role: role,
    },
  });
}

function showAddRoleModal() {
  $q.dialog({
    component: RolesForm,
  });
}

function deleteRole(role: Role) {
  $q.dialog({
    title: `Delete role ${role.name}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    if (role.id) roleStore.removeRole(role.id);
  });
}

onMounted(roleStore.getRoles);
</script>
