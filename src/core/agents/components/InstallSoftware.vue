<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 40vw; max-width: 50vw">
      <q-bar>
        Install Software
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section class="q-pa-none q-ma-none">
        <tactical-table
          v-model:pagination="pagination"
          dense
          flat
          :rows="chocos"
          :columns="columns"
          :filter="filter"
          :style="{ 'max-height': '50vh' }"
          binary-state-sort
          :rows-per-page-options="[100, 200, 500, 1000]"
          row-key="name"
          :loading="isLoading"
        >
          <template #top-right>
            <q-input v-model="filter" filled label="Search" dense clearable class="q-pr-sm">
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>

            <tactical-table-export />
          </template>
          <template #body="bodyProps">
            <q-tr :props="bodyProps">
              <q-td auto-width>
                <q-btn dense flat push icon="add" @click="installSoftware(bodyProps.row.name)" />
              </q-td>
              <q-td @click="showDescription(bodyProps.row.name)">
                <span style="cursor: pointer; text-decoration: underline">{{
                  bodyProps.row.name
                }}</span>
              </q-td>
            </q-tr>
          </template>
        </tactical-table>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="Close" @click="onDialogHide" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { chocosStore } from "src/stores/api";
import { agentSoftwareStore } from "src/stores/api";

import type { TacticalColumn } from "src/core/dashboard/types";

// static data
const columns: TacticalColumn[] = [
  { name: "install", align: "left", field: "", label: "Install", sortable: false },
  {
    name: "name",
    align: "left",
    label: "Name",
    field: "name",
    sortable: true,
  },
];

const props = defineProps<{
  agentId: string;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup stores
const { chocos, isLoading } = chocosStore;

// quasar setup
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();

// install software logic
const filter = ref("");
const pagination = ref({
  rowsPerPage: 100,
  sortBy: "name",
  descending: false,
});

function showDescription(name: string) {
  window.open(`https://chocolatey.org/packages/${name}`, "_blank");
}

function installSoftware(name: string) {
  const data = { name: name };
  $q.dialog({
    title: `Install ${name}?`,
    ok: { label: "Install" },
    color: "primary",
    cancel: true,
    noBackdropDismiss: true,
  }).onOk(() => {
    agentSoftwareStore
      .installAgentSoftware(props.agentId, data)
      .then(() => {
        onDialogOK();
      })
      .catch(() => {});
  });
}

onMounted(chocosStore.getChocosSoftware);
</script>
