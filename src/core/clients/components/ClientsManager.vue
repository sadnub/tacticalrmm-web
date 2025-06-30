<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 70vw">
      <q-bar>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="clientStore.getClients({ force: true })"
        />Clients Manager
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <tactical-table
        :rows="clientStore.clients"
        :columns="columns"
        style="height: 70vh"
        :pagination="{ rowsPerPage: 0, sortBy: 'name', descending: false }"
        dense
        row-key="id"
        binary-state-sort
        virtual-scroll
        :rows-per-page-options="[0]"
        no-data-label="No Clients"
        :loading="clientStore.isLoading"
        storage-key="clients-table"
      >
        <!-- top slot -->
        <template #top>
          <q-btn label="New" dense flat push no-caps icon="add" @click="showAddClient" />
        </template>

        <!-- loading slot -->
        <template #loading>
          <q-inner-loading showing color="primary" />
        </template>

        <!-- body slots -->
        <template #body="{ row }">
          <q-tr class="cursor-pointer" @dblclick="showEditClient(row)">
            <!-- context menu -->
            <q-menu context-menu>
              <q-list dense style="min-width: 200px">
                <q-item v-close-popup clickable @click="showEditClient(row)">
                  <q-item-section side>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item v-close-popup clickable @click="showClientDeleteModal(row)">
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item v-close-popup clickable @click="showAddSite(row)">
                  <q-item-section side>
                    <q-icon name="add" />
                  </q-item-section>
                  <q-item-section>Add Site</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item v-close-popup clickable>
                  <q-item-section>Close</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
            <!-- name -->
            <q-td>
              {{ row.name }}
            </q-td>
            <q-td>
              <span
                style="cursor: pointer; text-decoration: underline"
                class="text-primary"
                @click="showSitesTable(row)"
                >Show Sites ({{ row.sites.length }})</span
              >
            </q-td>
            <q-td>{{ row.agent_count }}</q-td>
          </q-tr>
        </template>
      </tactical-table>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { onMounted } from "vue";
import { useQuasar, useDialogPluginComponent, type QTableColumn } from "quasar";
import { useClientStore } from "../api";

// ui imports
import ClientsForm from "./ClientsForm.vue";
import SitesForm from "./SitesForm.vue";
import DeleteClient from "./DeleteClient.vue";
import SitesTable from "./SitesTable.vue";
import type { Client } from "../types";
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";

// static data
const columns: QTableColumn[] = [
  { name: "name", label: "Name", field: "name", align: "left" },
  { name: "sites", label: "Sites", field: "sites", align: "left" },
  {
    name: "agent_count",
    label: "Total Agents",
    field: "agent_count",
    align: "left",
  },
];

// setup stores
const clientStore = useClientStore();

defineEmits(useDialogPluginComponent.emits);

// setup quasar dialog
const $q = useQuasar();
const { dialogRef, onDialogHide } = useDialogPluginComponent();

function showClientDeleteModal(client: Client) {
  // agents are still assigned to client. Need to open modal to select which site to move to
  if (client.agent_count && client.agent_count > 0) {
    $q.dialog({
      component: DeleteClient,
      componentProps: {
        object: client,
        type: "client",
      },
    });

    // can delete the client since there are no agents
  } else {
    $q.dialog({
      title: "Are you sure?",
      message: `Delete client: ${client.name}.`,
      cancel: true,
      ok: { label: "Delete", color: "negative" },
    }).onOk(() => clientStore.removeClient(client.id));
  }
}

function showEditClient(client: Client) {
  $q.dialog({
    component: ClientsForm,
    componentProps: {
      client: client,
    },
  });
}

function showAddClient() {
  $q.dialog({
    component: ClientsForm,
  });
}

function showAddSite(client: Client) {
  $q.dialog({
    component: SitesForm,
    componentProps: {
      client: client.id,
    },
  });
}

function showSitesTable(client: Client) {
  $q.dialog({
    component: SitesTable,
    componentProps: {
      client: client,
    },
  });
}

onMounted(clientStore.getClients);
</script>
