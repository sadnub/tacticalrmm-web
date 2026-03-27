<template>
  <div>
    <div class="row">
      <div class="text-subtitle2">Custom Fields</div>
      <q-space />
      <q-btn
        size="sm"
        color="grey-5"
        icon="fas fa-plus"
        text-color="black"
        label="Add custom field"
        @click="addCustomFieldForm"
      />
    </div>
    <q-separator />
    <div>
      <q-tabs
        v-model="tab"
        dense
        inline-label
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
        narrow-indicator
        no-caps
      >
        <q-tab name="client" label="Clients" />
        <q-tab name="site" label="Sites" />
        <q-tab name="agent" label="Agents" />
      </q-tabs>

      <q-separator />
      <q-scroll-area style="height: 50vh">
        <q-tab-panels v-model="tab" :animated="false">
          <q-tab-panel
            v-for="t in ['client', 'site', 'agent']"
            :key="t"
            :name="t"
            class="q-pa-none"
          >
            <tactical-table
              v-model:pagination="pagination"
              dense
              :rows="customFields"
              :columns="columns"
              row-key="id"
              binary-state-sort
              hide-pagination
              virtual-scroll
              :rows-per-page-options="[0]"
              no-data-label="No Custom Fields"
            >
              <!-- body slots -->
              <template #body="props">
                <q-tr
                  :props="props"
                  class="cursor-pointer"
                  @dblclick="editCustomFieldForm(props.row)"
                >
                  <!-- context menu -->
                  <q-menu context-menu>
                    <q-list dense style="min-width: 200px">
                      <q-item v-close-popup clickable @click="editCustomFieldForm(props.row)">
                        <q-item-section side>
                          <q-icon name="edit" />
                        </q-item-section>
                        <q-item-section>Edit</q-item-section>
                      </q-item>
                      <q-item v-close-popup clickable @click="deleteCustomField(props.row)">
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
                    <!-- name -->
                    <template v-if="col.name === 'name'">
                      {{ col.value }}
                      <q-tooltip :delay="600">ID: {{ props.row.id }}</q-tooltip>
                    </template>

                    <!-- hide in ui -->
                    <template v-else-if="col.name === 'hide_in_ui'">
                      <q-icon v-if="col.value" name="check" />
                    </template>

                    <!-- hide in summary tab -->
                    <template v-else-if="col.name === 'hide_in_summary'">
                      <q-icon v-if="col.value" name="check" />
                    </template>

                    <!-- default value -->
                    <template v-else-if="col.name === 'default_value'">
                      <truncate-text :text="col.value" />
                    </template>

                    <!-- required -->
                    <template v-else-if="col.name === 'required'">
                      <q-icon v-if="col.value" name="check" />
                    </template>

                    <template v-else>
                      {{ col.value }}
                    </template>
                  </q-td>
                </q-tr>
              </template>
            </tactical-table>
          </q-tab-panel>
        </q-tab-panels>
      </q-scroll-area>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from "vue";
import { useQuasar } from "quasar";
import { useCustomFieldStore } from "src/stores/api";
import { capitalize } from "src/utils/format";

// ui imports
import CustomFieldsForm from "./CustomFieldsForm.vue";

// type imports
import type { TacticalColumn } from "src/core/dashboard/types";
import type { CustomField } from "../types";

const columns: TacticalColumn[] = [
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left",
    sortable: true,
  },
  {
    name: "type",
    label: "Field Type",
    field: "type",
    align: "left",
    sortable: true,
    format: (val: string) => capitalize(val),
  },
  {
    name: "hide_in_ui",
    label: "Hide in UI",
    field: "hide_in_ui",
    align: "left",
    sortable: true,
  },
  {
    name: "hide_in_summary",
    label: "Hide in Summary Tab",
    field: "hide_in_summary",
    align: "left",
    sortable: true,
  },
  {
    name: "default_value",
    label: "Default Value",
    field: "default_value",
    align: "left",
    sortable: true,
  },
  {
    name: "required",
    label: "Required",
    field: "required",
    align: "left",
    sortable: true,
  },
];

const pagination = ref({
  rowsPerPage: 0,
  sortBy: "name",
  descending: true,
});

// setup stores
const { customFields: allCustomFields, getCustomFields, removeCustomField } = useCustomFieldStore();

const $q = useQuasar();

const tab = ref("client");

const customFields = computed(() =>
  allCustomFields.value.filter((field) => field.model === tab.value),
);

function editCustomFieldForm(field: CustomField) {
  $q.dialog({
    component: CustomFieldsForm,
    componentProps: {
      field: field,
    },
  });
}

function addCustomFieldForm() {
  $q.dialog({
    component: CustomFieldsForm,
    componentProps: {
      model: tab.value,
    },
  });
}

function deleteCustomField(field: CustomField) {
  $q.dialog({
    title: `Delete custom field ${field.name}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => void removeCustomField(field.id));
}

onMounted(() => getCustomFields());
</script>
