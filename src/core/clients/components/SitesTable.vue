<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        <q-btn
          class="q-mr-sm"
          dense
          flat
          push
          icon="refresh"
          @click="clientStore.getClient(props.client.id, { force: true })"
        />Sites for
        {{ client.name }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
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
        column-select
        storage-key="sites manager"
      >
        <template #top>
          <q-btn label="New" dense flat push unelevated no-caps icon="add" @click="showAddSite" />
          <q-space />

          <q-input v-model="search" filled label="Search" dense clearable class="q-pr-sm">
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <tactical-table-export />
        </template>

        <!-- loading slot -->
        <template #loading>
          <q-inner-loading showing color="primary" />
        </template>

        <!-- body slots -->
        <template #body="bodyProps">
          <q-tr class="cursor-pointer" @dblclick="showEditSite(bodyProps.row)">
            <!-- context menu -->
            <q-menu context-menu>
              <q-list dense style="min-width: 200px">
                <q-item v-close-popup clickable @click="showEditSite(bodyProps.row)">
                  <q-item-section side>
                    <q-icon name="edit" />
                  </q-item-section>
                  <q-item-section>Edit</q-item-section>
                </q-item>
                <q-item v-close-popup clickable @click="showSiteDeleteModal(bodyProps.row)">
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

            <q-td v-for="col in bodyProps.cols" :key="col.name" :props="props" />
          </q-tr>
        </template>
      </tactical-table>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { computed, onMounted, ref } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { useClientStore, useSiteStore } from "../api";

// ui imports
import SitesForm from "./SitesForm.vue";
import DeleteClient from "./DeleteClient.vue";

// type imports
import type { Client, Site } from "../types";
import type { TacticalColumn } from "src/core/dashboard/types";

// static data
const columns: TacticalColumn[] = [
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
const search = ref("");

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
