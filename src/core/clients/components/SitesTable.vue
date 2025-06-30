<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        <q-btn
          @click="clientStore.getClient(props.client.id, { force: true })"
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
        />Sites for
        {{ client.name }}
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <tactical-table
        dense
        :rows="sites"
        :columns="columns"
        :pagination="{ rowsPerPage: 0, sortBy: 'name', descending: false }"
        row-key="id"
        binary-state-sort
        virtual-scroll
        :rows-per-page-options="[0]"
        no-data-label="No Sites"
        style="height: 65vh"
        :loading="clientStore.isLoading"
      >
        <template #top>
          <q-btn label="New" dense flat push unelevated no-caps icon="add" @click="showAddSite" />
        </template>

        <!-- loading slot -->
        <template #loading>
          <q-inner-loading showing color="primary" />
        </template>

        <!-- body slots -->
        <template #body="{ row }">
          <q-tr class="cursor-pointer" @dblclick="showEditSite(row)">
            <!-- context menu -->
            <q-menu context-menu>
              <q-list dense style="min-width: 200px">
                <q-item clickable v-close-popup @click="showEditSite(row)">
                  <q-item-section side>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="showSiteDeleteModal(row)">
                  <q-item-section side>
                    <q-icon name="delete" />
                  </q-item-section>
                  <q-item-section>Delete</q-item-section>
                </q-item>

                <q-separator></q-separator>

                <q-item clickable v-close-popup>
                  <q-item-section>Close</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
            <!-- name -->
            <q-td>
              {{ row.name }}
            </q-td>
            <!-- agent count -->
            <q-td>{{ row.agent_count }}</q-td>
          </q-tr>
        </template>
      </tactical-table>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { computed, onMounted } from "vue";
import { useQuasar, useDialogPluginComponent, type QTableColumn } from "quasar";
import { useClientStore, useSiteStore } from "../api";

// ui imports
import SitesForm from "./SitesForm.vue";
import DeleteClient from "./DeleteClient.vue";

// type imports
import type { Client, Site } from "../types";
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";

// static data
const columns: QTableColumn[] = [
  { name: "name", label: "Name", field: "name", align: "left" },
  {
    name: "agent_count",
    label: "Total Agents",
    field: "agent_count",
    align: "left",
  },
];

const props = defineProps<{
  client: Client;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup stores
const clientStore = useClientStore();
const siteStore = useSiteStore();

const sites = computed(() => clientStore.client?.sites || []);

// setup quasar dialog
const $q = useQuasar();
const { dialogRef, onDialogHide } = useDialogPluginComponent();

// sites table logic

function showSiteDeleteModal(site: Site) {
  // agents are still assigned to client. Need to open modal to select which site to move to
  if (site.agent_count && site.agent_count > 0) {
    $q.dialog({
      component: DeleteClient,
      componentProps: {
        object: site,
        type: "site",
      },
    });

    // can delete the client since there are no agents
  } else {
    $q.dialog({
      title: "Are you sure?",
      message: `Delete site: ${site.name}.`,
      cancel: true,
      ok: { label: "Delete", color: "negative" },
    }).onOk(() => siteStore.removeSite(site.id));
  }
}

function showEditSite(site: Site) {
  $q.dialog({
    component: SitesForm,
    componentProps: {
      site: site,
    },
  });
}

function showAddSite() {
  $q.dialog({
    component: SitesForm,
    componentProps: {
      client: props.client.id,
    },
  });
}

onMounted(() => clientStore.getClient(props.client.id));
</script>
