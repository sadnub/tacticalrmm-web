<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card
      class="q-dialog-plugin"
      :style="{
        width: `${$q.screen.width - 300}px`,
        'max-width': `${$q.screen.width - 300}px`,
        height: `${$q.screen.height - 300}px`,
        'max-height': `${$q.screen.height - 300}px`,
      }"
    >
      <q-bar>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="scriptSnippetStore.getScriptSnippets({ force: true })"
        />Script Snippets
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <tactical-table
        dense
        :style="{ 'max-height': `${$q.screen.height - 300 - 32}px` }"
        :rows="snippets"
        :columns="columns"
        :loading="isLoading"
        :pagination="{ rowsPerPage: 0, sortBy: 'name', descending: true }"
        row-key="id"
        binary-state-sort
        virtual-scroll
        :rows-per-page-options="[0]"
        storage-key="script-snippets"
      >
        <template #top>
          <q-btn dense flat no-caps icon="add" label="New" @click="newSnippetModal" />
          <q-space />

          <q-input
            v-model="search"
            style="width: 300px"
            label="Search"
            dense
            filled
            clearable
            class="q-pr-md q-pb-xs"
          >
            <template #prepend>
              <q-icon name="search" color="primary" />
            </template>
          </q-input>

          <tactical-table-export />
        </template>
        <template #header-cell-shell="props">
          <q-th :props="props" auto-width> Shell </q-th>
        </template>

        <template #body="props">
          <!-- Table View -->
          <q-tr :props="props" class="cursor-pointer" @dblclick="editSnippetModal(props.row)">
            <!-- Context Menu -->
            <q-menu context-menu>
              <q-list dense style="min-width: 200px">
                <q-item v-close-popup clickable @click="editSnippetModal(props.row)">
                  <q-item-section side>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>

                <q-item v-close-popup clickable @click="deleteSnippet(props.row)">
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>

                <q-item v-close-popup clickable>
                  <q-item-section>Close</q-item-section>
                </q-item>
              </q-list>
            </q-menu>

            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <template v-if="col.name === 'shell'">
                <q-icon
                  v-if="props.row.shell === 'powershell'"
                  name="mdi-powershell"
                  color="primary"
                  size="sm"
                >
                  <q-tooltip> Powershell </q-tooltip>
                </q-icon>
                <q-icon
                  v-else-if="props.row.shell === 'python'"
                  name="mdi-language-python"
                  color="primary"
                  size="sm"
                >
                  <q-tooltip> Python </q-tooltip>
                </q-icon>
                <q-icon
                  v-else-if="props.row.shell === 'cmd'"
                  name="mdi-microsoft-windows"
                  color="primary"
                  size="sm"
                >
                  <q-tooltip> Batch </q-tooltip>
                </q-icon>
                <q-icon
                  v-else-if="props.row.shell === 'shell'"
                  name="mdi-bash"
                  color="primary"
                  size="sm"
                >
                  <q-tooltip> Shell </q-tooltip>
                </q-icon>
                <q-icon
                  v-else-if="props.row.shell === 'nushell'"
                  name="mdi-nushell"
                  color="primary"
                  size="sm"
                >
                  <q-tooltip> Nushell </q-tooltip>
                </q-icon>
                <q-icon
                  v-else-if="props.row.shell === 'deno'"
                  name="mdi-typescript"
                  color="primary"
                  size="sm"
                >
                  <q-tooltip> Deno </q-tooltip>
                </q-icon>
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
import { scriptSnippetStore } from "src/stores/api";

// ui imports
import ScriptSnippetFormModal from "./ScriptSnippetFormModal.vue";
import type { TacticalColumn } from "src/core/dashboard/types";
import type { ScriptSnippet } from "../types";

// static data
const columns: TacticalColumn[] = [
  {
    name: "shell",
    label: "Shell",
    field: "shell",
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
    name: "desc",
    label: "Description",
    field: "description",
    align: "left",
    sortable: false,
  },
];

defineEmits(useDialogPluginComponent.emits);

// setup quasar plugins
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

// setup stores
const { snippets, isLoading } = scriptSnippetStore;

const search = ref("");

function deleteSnippet(snippet: ScriptSnippet) {
  $q.dialog({
    title: `Delete script snippet: ${snippet.name}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    if (snippet.id) void scriptSnippetStore.removeScriptSnippet(snippet.id);
  });
}

function newSnippetModal() {
  $q.dialog({
    component: ScriptSnippetFormModal,
  });
}

function editSnippetModal(snippet: ScriptSnippet) {
  $q.dialog({
    component: ScriptSnippetFormModal,
    componentProps: {
      snippet,
    },
  });
}

onMounted(scriptSnippetStore.getScriptSnippets);
</script>
