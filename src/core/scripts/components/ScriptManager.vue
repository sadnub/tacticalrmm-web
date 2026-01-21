<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card
      id="script-manager-card"
      class="q-dialog-plugin"
      :style="{
        width: `${$q.screen.width - 100}px`,
        'max-width': `${$q.screen.width - 100}px`,
        height: `${$q.screen.height - 100}px`,
        'max-height': `${$q.screen.height - 100}px`,
      }"
    >
      <q-bar>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="getScripts({ force: true })"
        />Script Manager
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <div class="row q-pt-xs q-pl-xs">
        <q-btn-dropdown icon="add" label="New" no-caps dense flat>
          <q-list dense>
            <q-item v-close-popup clickable @click="newScriptModal">
              <q-item-section side>
                <q-icon size="xs" name="add" />
              </q-item-section>
              <q-item-section>
                <q-item-label>New Script</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="uploadScriptModal">
              <q-item-section side>
                <q-icon size="xs" name="cloud_upload" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Upload Script</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-btn
          no-caps
          dense
          flat
          class="q-ml-sm"
          label="Script Snippets"
          icon="mdi-script"
          @click="ScriptSnippetModal"
        />
        <q-btn
          dense
          flat
          no-caps
          class="q-ml-sm"
          :label="tableView ? 'Folder View' : 'Table View'"
          :icon="tableView ? 'folder' : 'list'"
          @click="tableView = !tableView"
        />
        <q-btn
          dense
          flat
          no-caps
          class="q-ml-sm"
          :label="showCommunityScripts ? 'Hide Community Scripts' : 'Show Community Scripts'"
          :icon="showCommunityScripts ? 'visibility_off' : 'visibility'"
          @click="setShowCommunityScripts(!showCommunityScripts)"
        />

        <q-btn
          dense
          flat
          no-caps
          class="q-ml-sm"
          :label="showHiddenScripts ? 'Hide Hidden Scripts' : 'Show Hidden Scripts'"
          :icon="showHiddenScripts ? 'visibility_off' : 'visibility'"
          @click="showHiddenScripts = !showHiddenScripts"
        />

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
      </div>
      <!-- List View -->
      <div
        v-if="!tableView"
        class="scroll q-pl-xs"
        :style="{
          'max-height': `${$q.screen.height - 182}px`,
          'min-height': `${$q.screen.height - 382}px`,
        }"
      >
        <q-tree
          ref="folderTree"
          v-model:expanded="expanded"
          :nodes="tree"
          :filter="search"
          no-connectors
          node-key="id"
          no-results-label="No Scripts Found"
          no-nodes-label="No Scripts Found"
        >
          <template #header-script="props">
            <div
              class="cursor-pointer"
              @dblclick="
                props.node.script_type === 'builtin'
                  ? viewCodeModal(props.node)
                  : editScriptModal(props.node)
              "
            >
              <q-icon
                v-if="props.node.favorite"
                color="yellow-8"
                name="star"
                size="sm"
                class="q-px-sm"
              />
              <q-icon v-else color="yellow-8" name="star_outline" size="sm" class="q-px-sm" />

              <q-icon
                v-if="props.node.shell === 'powershell'"
                name="mdi-powershell"
                color="primary"
              >
                <q-tooltip> Powershell </q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="props.node.shell === 'python'"
                name="mdi-language-python"
                color="primary"
              >
                <q-tooltip> Python </q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="props.node.shell === 'cmd'"
                name="mdi-microsoft-windows"
                color="primary"
              >
                <q-tooltip> Batch </q-tooltip>
              </q-icon>
              <q-icon v-else-if="props.node.shell === 'shell'" name="mdi-bash" color="primary">
                <q-tooltip> Shell </q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="props.node.shell === 'nushell'"
                name="mdi-code-greater-than"
                color="primary"
              >
                <q-tooltip> Nushell </q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="props.node.shell === 'deno'"
                name="mdi-language-typescript"
                color="primary"
              >
                <q-tooltip> Deno </q-tooltip>
              </q-icon>

              <!-- is community script icon -->
              <img
                v-if="props.node.script_type === 'builtin'"
                class="vertical-middle"
                :src="trmmLogo"
                style="height: 20px; max-width: 20px"
              />

              <span
                class="q-pl-xs text-weight-bold"
                :style="{ color: props.node.hidden ? 'grey' : '' }"
                >{{ props.node.name }}</span
              >
              <span class="q-pl-xs">{{ props.node.description }}</span>
            </div>

            <!-- context menu -->
            <q-menu context-menu>
              <q-list dense style="min-width: 200px">
                <q-item v-close-popup clickable @click="viewCodeModal(props.node)">
                  <q-item-section side>
                    <q-icon name="remove_red_eye" />
                  </q-item-section>
                  <q-item-section>View Code</q-item-section>
                </q-item>

                <q-item v-close-popup clickable @click="cloneScriptModal(props.node)">
                  <q-item-section side>
                    <q-icon name="content_copy" />
                  </q-item-section>
                  <q-item-section>Clone</q-item-section>
                </q-item>

                <q-item
                  v-close-popup
                  clickable
                  :disable="props.node.script_type === 'builtin'"
                  @click="editScriptModal(props.node)"
                >
                  <q-item-section side>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>

                <q-item
                  v-close-popup
                  clickable
                  :disable="props.node.script_type === 'builtin'"
                  @click="deleteScript(props.node)"
                >
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item v-close-popup clickable @click="favoriteScript(props.node)">
                  <q-item-section side>
                    <q-icon name="star" />
                  </q-item-section>
                  <q-item-section>{{
                    props.node.favorite ? "Remove as Favorite" : "Add as Favorite"
                  }}</q-item-section>
                </q-item>

                <q-item v-close-popup clickable @click="exportScript(props.node)">
                  <q-item-section side>
                    <q-icon name="cloud_download" />
                  </q-item-section>
                  <q-item-section>Download Script</q-item-section>
                </q-item>

                <q-separator />

                <q-item v-close-popup clickable @click="hideScript(props.node)">
                  <q-item-section side>
                    <q-icon :name="props.node.hidden ? 'visibility' : 'visibility_off'" />
                  </q-item-section>
                  <q-item-section>{{
                    props.node.hidden ? "Show Script" : "Hide Script"
                  }}</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item v-close-popup clickable>
                  <q-item-section>Close</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </template>
        </q-tree>
      </div>
      <tactical-table
        v-if="tableView"
        dense
        :style="{ 'max-height': `${$q.screen.height - 182}px` }"
        :rows="visibleScripts"
        :columns="columns"
        :loading="isLoading"
        :pagination="{ rowsPerPage: 0, sortBy: 'favorite', descending: true }"
        :filter="search"
        row-key="id"
        binary-state-sort
        virtual-scroll
        :rows-per-page-options="[0]"
        column-select
        :storage-key="storageKey"
      >
        <template #header-cell-favorite="props">
          <q-th :props="props" auto-width>
            <q-icon name="star" color="yellow-8" size="sm" />
          </q-th>
        </template>

        <template #header-cell-shell="props">
          <q-th :props="props" auto-width> Shell </q-th>
        </template>

        <template #no-data> No Scripts Found </template>
        <template #body="props">
          <!-- Table View -->
          <q-tr
            :props="props"
            class="cursor-pointer"
            @dblclick="
              props.row.script_type === 'builtin'
                ? viewCodeModal(props.row)
                : editScriptModal(props.row)
            "
          >
            <!-- Context Menu -->
            <q-menu context-menu>
              <q-list dense style="min-width: 200px">
                <q-item v-close-popup clickable @click="viewCodeModal(props.row)">
                  <q-item-section side>
                    <q-icon name="remove_red_eye" />
                  </q-item-section>
                  <q-item-section>View Code</q-item-section>
                </q-item>

                <q-item v-close-popup clickable @click="cloneScriptModal(props.row)">
                  <q-item-section side>
                    <q-icon name="content_copy" />
                  </q-item-section>
                  <q-item-section>Clone</q-item-section>
                </q-item>

                <q-item
                  v-close-popup
                  clickable
                  :disable="props.row.script_type === 'builtin'"
                  @click="editScriptModal(props.row)"
                >
                  <q-item-section side>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>

                <q-item
                  v-close-popup
                  clickable
                  :disable="props.row.script_type === 'builtin'"
                  @click="deleteScript(props.row)"
                >
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item v-close-popup clickable @click="favoriteScript(props.row)">
                  <q-item-section side>
                    <q-icon name="star" />
                  </q-item-section>
                  <q-item-section>{{
                    props.row.favorite ? "Remove as Favorite" : "Add as Favorite"
                  }}</q-item-section>
                </q-item>

                <q-item v-close-popup clickable @click="exportScript(props.row)">
                  <q-item-section side>
                    <q-icon name="cloud_download" />
                  </q-item-section>
                  <q-item-section>Download Script</q-item-section>
                </q-item>

                <q-separator />

                <q-item v-close-popup clickable @click="hideScript(props.row)">
                  <q-item-section side>
                    <q-icon :name="props.row.hidden ? 'visibility' : 'visibility_off'" />
                  </q-item-section>
                  <q-item-section>{{
                    props.row.hidden ? "Show Script" : "Hide Script"
                  }}</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item v-close-popup clickable>
                  <q-item-section>Close</q-item-section>
                </q-item>
              </q-list>
            </q-menu>

            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <!-- favorite -->
              <template v-if="col.name === 'favorite'">
                <q-icon v-if="props.row.favorite" color="yellow-8" name="star" size="sm" />
              </template>

              <!-- shell icon -->
              <template v-else-if="col.name === 'shell'">
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
                  size="sm"
                  name="mdi-bash"
                  color="primary"
                >
                  <q-tooltip> Shell </q-tooltip>
                </q-icon>
                <q-icon
                  v-else-if="props.row.shell === 'nushell'"
                  size="sm"
                  name="mdi-code-greater-than"
                  color="primary"
                >
                  <q-tooltip> Nushell </q-tooltip>
                </q-icon>
                <q-icon
                  v-else-if="props.row.shell === 'deno'"
                  size="sm"
                  name="mdi-language-typescript"
                  color="primary"
                >
                  <q-tooltip> Deno </q-tooltip>
                </q-icon>
              </template>

              <!-- supported platforms -->
              <template v-else-if="col.name === 'supported_platforms'">
                <q-badge v-if="!col.value || col.value.length === 0">All</q-badge>
                <q-badge
                  v-for="plat in col.value"
                  v-else
                  :key="plat"
                  color="primary"
                  class="q-pr-xs"
                  >{{ capitalize(plat) }}</q-badge
                >
              </template>

              <!-- name -->
              <template v-else-if="col.name === 'name'">
                <!-- is community script icon -->
                <img
                  v-if="props.row.script_type === 'builtin'"
                  :src="trmmLogo"
                  style="height: 20px; max-width: 20px"
                />

                <truncate-text :text="col.value" />
              </template>

              <!-- args -->
              <template v-else-if="col.name === 'args'">
                <truncate-text :text="col.value.join(', ')" />
              </template>

              <!-- description -->
              <template v-else-if="col.name === 'desc'">
                <truncate-text :text="col.value" />
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
import { ref, computed, onMounted } from "vue";
import type { QTreeNode } from "quasar";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { useStorage } from "@vueuse/core";
import { useScriptStore, useDashboardStore } from "src/stores/api";

const { scripts, isLoading, getScripts, updateScript, removeScript, downloadScript } = useScriptStore();
const { dashboardSettings, setShowCommunityScripts } = useDashboardStore();
import { capitalize } from "src/utils/format";

// ui imports
import ScriptUploadModal from "./ScriptUploadModal.vue";
import ScriptFormModal from "./ScriptFormModal.vue";
import ScriptSnippets from "./ScriptSnippets.vue";

import trmmLogo from "src/assets/trmm_256.png";

// type imports
import type { TacticalColumn } from "src/core/dashboard/types";
import type { Script } from "../types";

// static data
const columns: TacticalColumn[] = [
  {
    name: "favorite",
    label: "Favorites",
    field: "favorite",
    align: "left",
    sortable: true,
  },
  {
    name: "shell",
    label: "Shell",
    field: "shell",
    align: "left",
    sortable: true,
  },
  {
    name: "supported_platforms",
    label: "Platforms",
    field: "supported_platforms",
    align: "left",
    sortable: true,
  },
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left",
    sortable: true,
    style: (row) => (row.hidden ? "color: grey" : ""),
  },
  {
    name: "args",
    label: "Default Args",
    field: "args",
    align: "left",
    sortable: true,
  },
  {
    name: "category",
    label: "Category",
    field: "category",
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
  {
    name: "default_timeout",
    label: "Default Timeout (seconds)",
    field: "default_timeout",
    align: "left",
    sortable: true,
  },
];

defineEmits(useDialogPluginComponent.emits);

// setup quasar plugins
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

// setup stores

const showCommunityScripts = computed(() => dashboardSettings.showCommunityScripts);

// script manager logic
const showHiddenScripts = ref(false);

function favoriteScript(script: Script) {
  if (script.id)
    void updateScript(script.id, {
      favorite: !script.favorite,
    });
}

function hideScript(script: Script) {
  if (script.id)
    void updateScript(script.id, {
      hidden: !script.hidden,
    });
}

function deleteScript(script: Script) {
  $q.dialog({
    title: `Delete script: ${script.name}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    if (script.id) void removeScript(script.id);
  });
}

function exportScript(script: Script) {
  if (script.id) downloadScript(script.id);
}

// table and tree view setup
const storageKey = "scriptmanager_";
const search = ref("");
const tableView = useStorage(`${storageKey}tableView`, true);
const expanded = useStorage(`${storageKey}expanded`, []);

const visibleScripts = computed(() => {
  if (showHiddenScripts.value) {
    return showCommunityScripts.value
      ? scripts.value
      : scripts.value.filter((i) => i.script_type !== "builtin");
  } else {
    return showCommunityScripts.value
      ? scripts.value.filter((i) => !i.hidden)
      : scripts.value.filter((i) => i.script_type !== "builtin" && !i.hidden);
  }
});

const categories = computed(() => {
  const list = [] as string[];
  visibleScripts.value.forEach((script) => {
    if (!!script.category && !list.includes(script.category)) {
      list.push(script.category);
    }
  });
  return list;
});

const tree = computed<QTreeNode[]>(() => {
  if (tableView.value || visibleScripts.value.length === 0) {
    return [];
  }

  const scriptsTemp = [...visibleScripts.value];
  const allCategories = new Set(scriptsTemp.map((s) => s.category).filter(Boolean));
  allCategories.add("Unassigned");
  const sortedCategories = Array.from(allCategories).sort();
  const sortedScripts = scriptsTemp.sort((a, b) => a.name.localeCompare(b.name));
  const nodes = sortedCategories.map((category): QTreeNode => {
    const scriptsInCategory = sortedScripts.filter((script) => {
      return category === "Unassigned" ? !script.category : script.category === category;
    });

    return {
      id: category,
      label: category,
      icon: "folder",
      iconColor: "yellow-9",
      selectable: false,
      children: scriptsInCategory.map((script) => ({
        label: script.name,
        icon: "script",
        selectable: true,
        header: "script",
        ...script,
      })),
    };
  });

  return nodes.filter((node) => node.children && node.children.length > 0);
});

// dialog open functions
function viewCodeModal(script: Script) {
  $q.dialog({
    component: ScriptFormModal,
    componentProps: {
      script: script,
      readonly: true,
    },
  });
}

function newScriptModal() {
  $q.dialog({
    component: ScriptFormModal,
    componentProps: {
      categories: categories.value,
      readonly: false,
    },
  });
}

function editScriptModal(script: Script) {
  $q.dialog({
    component: ScriptFormModal,
    componentProps: {
      script: script,
      categories: categories.value,
      readonly: false,
    },
  });
}

function cloneScriptModal(script: Script) {
  $q.dialog({
    component: ScriptFormModal,
    componentProps: {
      script: script,
      categories: categories.value,
      readonly: false,
      clone: true,
    },
  });
}

function uploadScriptModal() {
  $q.dialog({
    component: ScriptUploadModal,
    componentProps: {
      categories: categories.value,
    },
  });
}

function ScriptSnippetModal() {
  $q.dialog({
    component: ScriptSnippets,
  });
}

onMounted(() => getScripts());
</script>
