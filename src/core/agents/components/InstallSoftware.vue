<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 40vw; max-width: 50vw">
      <q-bar>
        Install Software
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <tactical-table
          v-model:pagination="pagination"
          dense
          :rows="chocoStore.chocos"
          :columns="columns"
          :filter="filter"
          binary-state-sort
          hide-bottom
          virtual-scroll
          :rows-per-page-options="[0]"
          row-key="name"
        >
          <template #top-left>
            <q-input v-model="filter" filled label="Search" dense clearable class="q-pr-sm">
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>

            <tactical-table-export />
          </template>
          <template #body="{ row }">
            <q-tr :props="props">
              <q-td auto-width>
                <q-btn dense flat push icon="add" @click="installSoftware(row.name)" />
              </q-td>
              <q-td @click="showDescription(row.name)">
                <span style="cursor: pointer; text-decoration: underline">{{ row.name }}</span>
              </q-td>
            </q-tr>
          </template>
        </tactical-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { useChocosStore } from "src/core/software/api";
import { useAgentStore } from "../api";
import { until } from "@vueuse/shared";
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
const chocoStore = useChocosStore();
const agentStore = useAgentStore();

// quasar setup
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();

// install software logic
const filter = ref("");
const pagination = ref({
  rowsPerPage: 0,
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
    persistent: true,
    ok: { label: "Install" },
    cancel: true,
  }).onOk(() => {
    agentStore.installAgentSoftware(props.agentId, data);

    void until(() => agentStore.isLoading)
      .toBe(false)
      .then(() => {
        if (!agentStore.isError) onDialogOK();
      })
      .catch(() => {});
  });
}

onMounted(chocoStore.getChocosSoftware);
</script>
