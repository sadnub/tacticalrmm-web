<template>
  <div>
    <div class="row">
      <div class="text-subtitle2">
        {{ props.type === "web" ? "URL Actions" : "Web Hooks for Alert Failure/Resolved Actions" }}
      </div>
      <q-space />
      <q-btn
        size="sm"
        color="grey-5"
        icon="fas fa-plus"
        text-color="black"
        :label="`Add ${props.type === 'web' ? 'URL Action' : 'Web Hook'}`"
        @click="addURLAction"
      />
    </div>
    <q-separator />
    <q-table
      dense
      :rows="actionStore.urlActions"
      :columns="columns"
      :pagination="{ rowsPerPage: 0, sortBy: 'name', descending: true }"
      row-key="id"
      binary-state-sort
      hide-pagination
      virtual-scroll
      :rows-per-page-options="[0]"
      :no-data-label="`No ${props.type === 'web' ? 'URL Actions' : 'Web Hooks'} added yet`"
      :loading="actionStore.isLoading"
    >
      <!-- body slots -->
      <template #body="bodyProps">
        <q-tr :props="bodyProps" class="cursor-pointer" @dblclick="editURLAction(bodyProps.row)">
          <!-- context menu -->
          <q-menu context-menu>
            <q-list dense style="min-width: 200px">
              <q-item v-close-popup clickable @click="editURLAction(bodyProps.row)">
                <q-item-section side>
                  <q-icon name="edit" />
                </q-item-section>
                <q-item-section>Edit</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="deleteURLAction(bodyProps.row)">
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

          <q-td v-for="col in bodyProps.cols" :key="col.name" :props="props">
            <template v-if="col.name === 'pattern'">
              <truncate-text :text="col.value" />
            </template>

            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { onMounted } from "vue";
import { useQuasar } from "quasar";
import { useURLActionStore } from "../api";

// ui imports
import URLActionsForm from "./URLActionsForm.vue";

// types
import { type URLActionType, type URLAction } from "src/core/settings/types";
import type { TacticalColumn } from "src/core/dashboard/types";

// define props
const props = defineProps<{ type: URLActionType }>();

// setup quasar
const $q = useQuasar();

// setup stores
const actionStore = useURLActionStore();

const columns: TacticalColumn[] = [
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
    field: "desc",
    align: "left",
    sortable: true,
  },
  {
    name: "pattern",
    label: "URL Pattern",
    field: "pattern",
    align: "left",
    sortable: true,
  },
];

function addURLAction() {
  $q.dialog({
    component: URLActionsForm,
    componentProps: {
      type: props.type,
    },
  });
}

function editURLAction(action: URLAction) {
  $q.dialog({
    component: URLActionsForm,
    componentProps: {
      type: props.type,
      action: action,
    },
  });
}

function deleteURLAction(action: URLAction) {
  $q.dialog({
    title: `Delete URL Action: ${action.name}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => actionStore.removeURLAction(action.id));
}
onMounted(actionStore.getURLActions);
</script>
