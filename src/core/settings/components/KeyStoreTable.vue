<template>
  <div>
    <div class="row">
      <div class="text-subtitle2">Global Key Store</div>
      <q-space />
      <q-btn
        size="sm"
        color="grey-5"
        text-color="black"
        class="q-mr-sm"
        :label="isPwd ? 'Show values' : 'Hide values'"
        :icon="isPwd ? 'visibility_off' : 'visibility'"
        @click="isPwd = !isPwd"
      />
      <q-btn
        size="sm"
        color="grey-5"
        icon="fas fa-plus"
        text-color="black"
        label="Add key"
        @click="addKeyForm"
      />
    </div>
    <q-separator />
    <tactical-table
      v-model:pagination="pagination"
      dense
      :rows="keys"
      :columns="columns"
      row-key="id"
      binary-state-sort
      hide-pagination
      virtual-scroll
      :rows-per-page-options="[0]"
      :loading="isLoading"
      no-data-label="No Keys added yet"
    >
      <!-- body slots -->
      <template #body="props">
        <q-tr :props="props" class="cursor-pointer" @dblclick="editKeyForm(props.row)">
          <!-- context menu -->
          <q-menu context-menu>
            <q-list dense style="min-width: 200px">
              <q-item v-close-popup clickable @click="editKeyForm(props.row)">
                <q-item-section side>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>Edit</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="deleteKey(props.row)">
                <q-item-section side>
                  <q-icon name="delete" />
                </q-item-section>
                <q-item-section>Delete</q-item-section>
              </q-item>

              <q-separator></q-separator>

              <q-item v-close-popup clickable>
                <q-item-section>Close</q-item-section>
              </q-item>
            </q-list>
          </q-menu>

          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <!--  value -->
            <template v-if="col.name === 'value'">
              {{ isPwd ? "****" : col.value }}
            </template>

            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
    </tactical-table>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useGlobalKeyStore } from "src/stores/api";

// ui imports
import KeyStoreForm from "./KeyStoreForm.vue";

// type imports
import type { TacticalColumn } from "src/core/dashboard/types";
import type { GlobalKey } from "../types";

const columns: TacticalColumn[] = [
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "value",
    label: "Value",
    field: "value",
    align: "left",
    sortable: true,
  },
];

// setup stores
const { keys, isLoading, getKeys, removeKey } = useGlobalKeyStore();

const isPwd = ref(true);

const pagination = ref({
  rowsPerPage: 0,
  sortBy: "name",
  descending: true,
});

const $q = useQuasar();

function addKeyForm() {
  $q.dialog({
    component: KeyStoreForm,
  });
}

function editKeyForm(key: GlobalKey) {
  $q.dialog({
    component: KeyStoreForm,
    componentProps: {
      globalKey: key,
    },
  });
}

function deleteKey(key: GlobalKey) {
  $q.dialog({
    title: `Delete key: ${key.name}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => void removeKey(key.id));
}

onMounted(() => getKeys());
</script>
