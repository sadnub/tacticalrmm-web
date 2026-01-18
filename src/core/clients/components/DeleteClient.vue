<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin">
      <q-bar>
        Delete {{ object.name }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit="submit">
        <q-card-section v-if="filteredSiteOptions.length === 0">
          There are no valid sites to move agents to. Add another site and try again
        </q-card-section>
        <q-card-section v-if="filteredSiteOptions.length > 0">
          <tactical-dropdown
            v-model="site"
            label="Site to move agents to"
            filled
            :options="filteredSiteOptions"
            map-options
            :rules="[
              (val: number) => !!val || 'Select the site that the agents should be moved to',
            ]"
            hint="The client you are deleting has agents assigned to it. Select a Site below to move the agents to."
            filterable
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup dense flat push label="Cancel" />
          <q-btn
            :loading="isLoading"
            :disable="filteredSiteOptions.length === 0"
            dense
            flat
            push
            label="Move"
            color="primary"
            type="submit"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { computed, ref } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { useClientStore, useSiteStore } from "src/stores/api";

const clientStore = useClientStore();
const siteStore = useSiteStore();
import { useSiteDropdown } from "../composables";
import { isHeaderOption } from "src/core/dashboard/types";

// type imports
import type { Client, Site } from "../types";

const props = defineProps<{
  type: "client" | "site";
  object: Client | Site;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup stores

// setup dropdowns
const { siteOptions, isLoading } = useSiteDropdown();

// setup quasar dialog
const $q = useQuasar();
const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent();

// Remove the site being currently deleted or the client that is being deleted from the options
const filteredSiteOptions = computed(() => {
  if (props.type === "client") {
    return siteOptions.value.filter((site) =>
      !isHeaderOption(site) ? site.clientId !== props.object.id : site.label !== props.object.name,
    );
  } else {
    return siteOptions.value.filter((site) =>
      !isHeaderOption(site) ? site.value !== props.object.id : true,
    );
  }
});

// delete client logic
const site = ref(undefined);

function submit() {
  $q.dialog({
    title: "Are you sure?",
    message: `Deleting ${props.type} ${props.object.name}. ${props.object.agent_count} agents will be moved to the selected site`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    if (props.type === "client") {
      clientStore
        .removeClient(props.object.id, site.value)
        .then(() => {
          onDialogOK();
        })
        .catch(() => {
          //
        });
    } else {
      siteStore
        .removeSite(props.object.id, site.value)
        .then(() => {
          onDialogOK();
        })
        .catch(() => {
          //
        });
    }
  });
}
</script>
