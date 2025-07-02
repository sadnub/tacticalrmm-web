<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="width: 40vw">
      <q-bar>
        Add Deployment
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-card-section>
          <tactical-dropdown
            v-model="state.site"
            :rules="[(val: number) => !!val || '*Required']"
            filled
            label="Site"
            :options="siteOptions"
            map-options
            filterable
          />
        </q-card-section>
        <q-card-section>
          <div class="q-pl-sm">Agent Type</div>
          <q-radio
            v-model="state.agenttype"
            val="server"
            label="Server"
            @update:model-value="state.power = false"
          />
          <q-radio v-model="state.agenttype" val="workstation" label="Workstation" />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="state.expires"
            type="datetime-local"
            dense
            label="Expiry"
            stack-label
            filled
          />
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-checkbox v-model="state.rdp" dense label="Enable RDP" />
          <q-checkbox v-model="state.ping" dense label="Enable Ping" />
          <q-checkbox
            v-show="state.agenttype === 'workstation'"
            v-model="state.power"
            dense
            label="Disable sleep/hibernate"
          />
        </q-card-section>
        <q-card-section>
          <div class="q-pl-sm">Arch</div>
          <q-radio v-model="state.goarch" :val="GOARCH_AMD64" label="64 bit" />
          <q-radio v-model="state.goarch" :val="GOARCH_i386" label="32 bit" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup dense flat label="Cancel" />
          <q-btn
            :loading="deployStore.isLoading"
            dense
            flat
            label="Create"
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
import { reactive } from "vue";
import { useDialogPluginComponent, date } from "quasar";
import { useSiteDropdown } from "src/core/clients/composables";
import { useDeploymentStore } from "../api";
import { formatDateInputField, formatDateStringwithTimezone } from "src/utils/format";
import { GOARCH_AMD64, GOARCH_i386 } from "src/constants/constants";
import { until } from "@vueuse/shared";

import type { Deployment } from "../types";

defineEmits(useDialogPluginComponent.emits);

// setup stores
const deployStore = useDeploymentStore();

// setup quasar dialog
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup site dropdown
const { siteOptions } = useSiteDropdown();

// add deployment logic
const state = reactive<Deployment>({
  site: null,
  expires: formatDateInputField(date.addToDate(Date.now(), { days: 30 }).toISOString()),
  agenttype: "server",
  power: false,
  rdp: false,
  ping: false,
  goarch: GOARCH_AMD64,
});

async function submit() {
  if (state.expires) state.expires = formatDateStringwithTimezone(state.expires);

  deployStore.addDeployment(state);

  await until(() => deployStore.isLoading).toBe(false);

  // stops the dialog from closing on errors
  if (deployStore.isError) {
    // revert expires field back
    if (state.expires) state.expires = formatDateInputField(state.expires);
    return;
  }
  onDialogOK();
}
</script>
