<template>
  <div>
    <div class="row">
      <div class="text-subtitle2">API Keys</div>
      <q-space />
      <q-btn
        size="sm"
        color="grey-5"
        icon="fas fa-plus"
        text-color="black"
        label="Add key"
        @click="addAPIKey"
      />
    </div>
    <q-separator />
    <tactical-table
      v-model:pagination="pagination"
      dense
      :rows="keyStore.apiKeys"
      :columns="columns"
      row-key="id"
      binary-state-sort
      hide-pagination
      virtual-scroll
      :rows-per-page-options="[0]"
      no-data-label="No API tokens added yet"
      storage-key="apiKeyTable"
    >
      <!-- header slots -->
      <template #header-cell-actions="props">
        <q-th :props="props" auto-width> </q-th>
      </template>

      <!-- body slots -->
      <template #body="props">
        <q-tr :props="props" class="cursor-pointer" @dblclick="editAPIKey(props.row)">
          <!-- context menu -->
          <q-menu context-menu>
            <q-list dense style="min-width: 200px">
              <q-item v-close-popup clickable @click="editAPIKey(props.row)">
                <q-item-section side>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>Edit</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="deleteAPIKey(props.row)">
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
            <template v-if="col.name === 'actions'">
              <q-icon size="sm" name="content_copy" @click="copyKeyToClipboard(props.row.key)">
                <q-tooltip>Copy API Key to clipboard</q-tooltip>
              </q-icon>
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
// composition imports
import { ref, onMounted } from "vue";
import { useQuasar, copyToClipboard } from "quasar";
import { useDashboardStore } from "src/stores/dashboard";
import { useAPIKeyStore } from "../api";
import { notifySuccess, notifyError } from "src/utils/notify";
import APIKeysForm from "src/core/settings/components/APIKeysForm.vue";
import type { APIKey } from "../types";
import type { TacticalColumn } from "src/core/dashboard/types";

const columns: TacticalColumn[] = [
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left",
    sortable: true,
    required: true,
  },
  {
    name: "username",
    label: "User",
    field: "username",
    align: "left",
    sortable: true,
  },
  {
    name: "expiration",
    label: "Expiration",
    field: "expiration",
    align: "left",
    sortable: true,
    format: (val: string) => dashboardStore.formatDate(val),
  },
  {
    name: "created_time",
    label: "Created",
    field: "created_time",
    align: "left",
    sortable: true,
    format: (val: string) => dashboardStore.formatDate(val),
  },
  {
    name: "actions",
    label: "Actions",
    field: "actions",
    required: true,
  },
];

// setup quasar
const $q = useQuasar();

// setup stores
const dashboardStore = useDashboardStore();
const keyStore = useAPIKeyStore();

// setup table
const pagination = ref({
  rowsPerPage: 0,
  sortBy: "name",
  descending: true,
});

function copyKeyToClipboard(apikey: string) {
  copyToClipboard(apikey)
    .then(() => {
      notifySuccess("Key was copied to clipboard!");
    })
    .catch(() => {
      notifyError("Unable to copy to clipboard!");
    });
}

function deleteAPIKey(key: APIKey) {
  $q.dialog({
    title: `Delete API key: ${key.name}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => key.id && void keyStore.removeAPIKey(key.id));
}

// quasar dialog functions
function editAPIKey(key: APIKey) {
  $q.dialog({
    component: APIKeysForm,
    componentProps: {
      APIKey: key,
    },
  });
}

function addAPIKey() {
  $q.dialog({
    component: APIKeysForm,
  });
}

onMounted(keyStore.getAPIKeys);
</script>
