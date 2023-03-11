<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <q-bar>
        Integration Manager
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-table
        :rows="integrations"
        :columns="columns"
        row-key="name"
        selection="multiple"
        v-model:selected="selected"
        :filter="filter"
        :loading="isLoading"
        grid
        hide-header
      >
        <template v-slot:top>
          <q-btn
            label="Add"
            dense
            flat
            color="primary"
            icon="add"
            @click="openNewIntegrationForm"
          ></q-btn>
          <q-space />
          <q-input
            v-model="filter"
            outlined
            label="Search"
            dense
            clearable
            class="q-pr-sm"
          >
            <template v-slot:prepend>
              <q-icon name="search" color="primary" />
            </template>
          </q-input>
        </template>

        <template v-slot:item="props">
          <div
            class="q-pa-xs col-xs-12 col-sm-6 col-md-4 col-lg-3 grid-style-transition"
            :style="props.selected ? 'transform: scale(0.95);' : ''"
          >
            <q-card>
              <q-card-section horizontal>
                <q-checkbox
                  dense
                  v-model="props.selected"
                  :label="props.row.name"
                />
                <q-space />
                <q-toggle
                  v-model="props.row.enabled"
                  @update:model-value="
                    toggleIntegration(props.row, props.row.enabled)
                  "
                ></q-toggle>
              </q-card-section>
              <q-separator />
              <q-list dense>
                <q-item
                  v-for="col in props.cols.filter((col) => col.name !== 'desc')"
                  :key="col.name"
                >
                  <q-item-section>
                    <q-item-label>{{ col.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label caption>{{ col.value }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <q-separator />
              <q-card-section horizontal>
                <q-space />
                <q-btn
                  flat
                  dense
                  icon="edit"
                  @click="openEditIntegrationForm(props.row)"
                ></q-btn>
                <q-btn
                  flat
                  dense
                  icon="delete"
                  @click="removeIntegration(props.row)"
                ></q-btn>
              </q-card-section>
            </q-card>
          </div>
        </template>
      </q-table>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// composition imports
import { ref, onMounted } from "vue";
import { useDialogPluginComponent, useQuasar } from "quasar";
import { useSharedIntegrationsApi } from "@/api/core_ts";

// ui import
import IntegrationForm from "@/components/core/IntegrationForm.vue";

// types
import type { Integration } from "@/types/core";

// emits
defineEmits([...useDialogPluginComponent.emits]);

// setup quasar dialog
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

const columns = [
  {
    name: "name",
    label: "Name",
    field: "name",
    sortable: true,
  },
  {
    name: "desc",
    label: "Description",
    field: "desc",
    sortable: true,
  },
  {
    name: "version",
    label: "Version",
    field: "version",
    sortable: true,
  },
  {
    name: "installed",
    label: "Installed",
    field: "installed",
    sortable: true,
  },
  {
    name: "update_available",
    label: "Update Available",
    field: "update_available",
    sortable: true,
  },
];

const filter = ref("");
const selected = ref([]);

// reports manager logic
const {
  integrations,
  isLoading,
  getIntegrations,
  editIntegration,
  deleteIntegration,
  installIntegration,
} = useSharedIntegrationsApi;

function openNewIntegrationForm() {
  $q.dialog({
    component: IntegrationForm,
  });
}

function openEditIntegrationForm(integration: Integration) {
  $q.dialog({
    component: IntegrationForm,
    componentProps: {
      integration,
    },
  });
}

function removeIntegration(integration: Integration) {
  $q.dialog({
    title: `Delete Integration: ${integration.name}?`,
    message:
      "This will uninstall the Integration from the system. Any database data will need to be removed manually. Do you want to proceed?",
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    deleteIntegration(integration.id);
  });
}

function toggleIntegration(integration: Integration, enabled: boolean) {
  if (enabled) {
    $q.dialog({
      title: `Install Integration: ${integration.name}?`,
      message:
        "This will download and install the integration from the install url. Do you want to proceed?",
      cancel: true,
      ok: { label: "Install", color: "primary" },
    })
      .onOk(async () => {
        const { output, success } = await installIntegration(integration.id);
        if (!success) integration.enabled = false;

        $q.dialog({
          title: "Integration installation results",
          message: `Installation ${
            success ? "was successfull" : "failed"
          }\n${output}`,
        });
      })
      .onCancel(() => (integration.enabled = false));
  } else {
    $q.dialog({
      title: `Disable Integration: ${integration.name}?`,
      message:
        "This will disable the intgration from showing in the UI. To uninstall you must delete it. Do you want to proceed?",
      cancel: true,
      ok: { label: "Disable", color: "negative" },
    })
      .onOk(() => {
        editIntegration(integration.id, { enabled: false });
      })
      .onCancel(() => (integration.enabled = true));
  }
}

onMounted(getIntegrations);
</script>
