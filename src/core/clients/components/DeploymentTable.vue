<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="min-width: 70vw; height: 70vh">
      <q-bar>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="deployStore.getDeployments({ force: true })"
        />
        Manage Deployments
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <tactical-table
        dense
        style="max-height: 65vh"
        binary-state-sort
        virtual-scroll
        :rows="deployments"
        :columns="columns"
        :rows-per-page-options="[0]"
        row-key="id"
        :pagination="{ rowsPerPage: 0, sortBy: 'id', descending: true }"
        no-data-label="No Deployments"
        :loading="deployStore.isLoading"
        column-select
        storage-key="deployments"
      >
        <template #top>
          <q-btn dense flat icon="add" label="New" @click="showAddDeployment" />

          <q-space />

          <q-input v-model="search" filled label="Search" dense clearable class="q-pr-sm">
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <tactical-table-export />
        </template>

        <template #body="props">
          <q-tr :props="props" class="cursor-pointer" @dblclick="copyLink(props.row)">
            <q-menu context-menu auto-close>
              <q-list dense style="min-width: 200px">
                <q-item clickable @click="deleteDeployment(props.row)">
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable>
                  <q-item-section>Close</q-item-section>
                </q-item>
              </q-list>
            </q-menu>

            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              <template v-if="col.name === 'flags'">
                <q-badge color="grey-8" label="View Flags" />
                <q-tooltip style="font-size: 12px">{{ props.row.install_flags }}</q-tooltip>
              </template>

              <template v-else-if="col.name === 'link'">
                <q-btn
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="content_copy"
                  label="Copy"
                  @click="copyLink(props.row)"
                />
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
import { ref, onMounted } from "vue";
import { useQuasar, useDialogPluginComponent, copyToClipboard } from "quasar";
import { useDashboardStore } from "src/stores/dashboard";
import { useDeploymentStore } from "../api";
import { notifySuccess } from "src/utils/notify";
import { getBaseUrl } from "src/boot/axios";

// ui imports
import DeploymentForm from "./DeploymentForm.vue";

// type imports
import type { Deployment } from "../types";

// static data
const columns = [
  {
    name: "client",
    label: "Client",
    field: "client_name",
    align: "left",
    sortable: true,
  },
  {
    name: "site",
    label: "Site",
    field: "site_name",
    align: "left",
    sortable: true,
  },
  {
    name: "mon_type",
    label: "Type",
    field: "mon_type",
    align: "left",
    sortable: true,
  },
  {
    name: "goarch",
    label: "Arch",
    field: "goarch",
    align: "left",
    sortable: true,
  },
  {
    name: "expiry",
    label: "Expiry",
    field: "expiry",
    align: "left",
    sortable: true,
    format: (val: string) => dashboardStore.formatDate(val),
  },
  {
    name: "created",
    label: "Created",
    field: "created",
    align: "left",
    sortable: true,
    format: (val: string) => dashboardStore.formatDate(val),
  },
  { name: "flags", label: "Flags", field: "install_flags", align: "left" },
  { name: "link", label: "Download Link", align: "left" },
];

defineEmits(useDialogPluginComponent.emits);

// setup stores
const dashboardStore = useDashboardStore();
const deployStore = useDeploymentStore();

// quasar dialog setup
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

// deployment logic
const deployments = ref([]);

const search = ref("");

function deleteDeployment(deployment: Deployment) {
  $q.dialog({
    title: "Delete deployment?",
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    if (deployment.id) deployStore.removeDeployment(deployment.id);
  });
}

function copyLink(deployment: Deployment) {
  const api = getBaseUrl();
  void copyToClipboard(`${api}/clients/${deployment.uid}/deploy/`).then(() => {
    notifySuccess("Link copied to clipboard", 1500);
  });
}

function showAddDeployment() {
  $q.dialog({
    component: DeploymentForm,
  });
}

onMounted(deployStore.getDeployments);
</script>
