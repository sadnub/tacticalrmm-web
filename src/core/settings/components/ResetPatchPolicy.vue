<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 40vw">
      <q-bar>
        Reset Agent Patch Policy
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section class="text-subtitle3">
        Reset the patch policies for agents in a specific client or site. You can also leave the
        client and site blank to reset the patch policy for all agents. (This might take a while)
      </q-card-section>

      <q-card-section>
        <q-option-group v-model="target" :options="targetOptions" color="primary" inline dense />
      </q-card-section>

      <q-form @submit="submit">
        <q-card-section v-if="target == 'client'">
          <tactical-dropdown
            v-model="state.client"
            :rules="[(val: number) => !!val || '*Required']"
            label="Clients"
            map-options
            filterable
            clearable
            filled
            :options="clientOptions"
          />
        </q-card-section>
        <q-card-section v-if="target == 'site'">
          <tactical-dropdown
            v-model="state.site"
            :rules="[(val: number) => !!val || '*Required']"
            label="Sites"
            map-options
            filterable
            clearable
            filled
            :options="siteOptions"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat push dense label="Cancel" />
          <q-btn
            :loading="loading"
            flat
            dense
            push
            :label="target == 'all' ? 'Clear Policies for ALL Agents' : 'Clear Policies'"
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
import { reactive, ref, watch } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useClientDropdown, useSiteDropdown } from "src/core/clients/composables";
import { sendPatchPolicyReset } from "src/core/automation/api";
import { notifySuccess } from "src/utils/notify";
import type { ResetPatchPolicyRequest } from "src/core/automation/types";

// static data
const targetOptions = [
  { label: "All", value: "all" },
  { label: "Client", value: "client" },
  { label: "Site", value: "site" },
];

defineEmits(useDialogPluginComponent.emits);

// setup quasar dialog plugin
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup dropdowns
const { clientOptions } = useClientDropdown();
const { siteOptions } = useSiteDropdown();

// reset patch policy logic
const state = reactive<ResetPatchPolicyRequest>({
  client: null,
  site: null,
});

const target = ref("all");
const loading = ref(false);

watch(target, () => {
  state.client = null;
  state.site = null;
});

async function submit() {
  loading.value = true;
  try {
    const result = await sendPatchPolicyReset(state);
    notifySuccess(result);
    onDialogOK();
  } catch (e) {
    console.error(e);
  }
  loading.value = false;
}
</script>
