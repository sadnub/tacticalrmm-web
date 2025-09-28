<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ apiKey ? "Edit API Key" : "Add API Key" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-card-section>
          <span v-if="!apiKey">API Key will be generated on save</span>
        </q-card-section>
        <!-- name -->
        <q-card-section>
          <q-input
            v-model="localKey.name"
            label="Name"
            filled
            dense
            :rules="[(val) => !!val || '*Required']"
          />
        </q-card-section>

        <!-- user -->
        <q-card-section>
          <tactical-dropdown
            v-model="localKey.user"
            filled
            label="User"
            :options="userOptions"
            map-options
            filterable
          />
        </q-card-section>

        <!-- key -->
        <q-card-section v-if="apiKey">
          <q-input v-model="localKey.key" readonly label="Key" filled dense />
        </q-card-section>

        <!-- expiration -->
        <q-card-section>
          <q-input
            v-model="localKey.expiration"
            type="datetime-local"
            dense
            label="Key Expiration (Not required)"
            stack-label
            filled
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn flat label="Submit" color="primary" type="submit" :loading="isLoading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { reactive } from "vue";
import { useDialogPluginComponent } from "quasar";
import { apiKeyStore } from "src/stores/api";
import { useUserDropdown } from "src/core/accounts/composables";
import { formatDateInputField, formatDateStringwithTimezone } from "src/utils/format";

// ui imports
import type { APIKey } from "../types";

const props = defineProps<{
  apiKey: APIKey;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup quasar plugins
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup stores
const { isLoading } = apiKeyStore;

// setup dropdowns
const { userOptions } = useUserDropdown();

// setup api key form logic
const localKey = props.apiKey
  ? reactive<APIKey>(Object.assign({}, props.apiKey))
  : reactive<APIKey>({ name: "", expiration: "", key: "", user: 0 });

// remove Z from date string
if (props.apiKey) {
  localKey.expiration = formatDateInputField(localKey.expiration);
}

async function submit() {
  try {
    // convert date to local timezone if exists
    if (localKey.expiration)
      localKey.expiration = formatDateStringwithTimezone(localKey.expiration);

    if (props.apiKey && localKey.id) await apiKeyStore.updateAPIKey(localKey.id, localKey);
    else await apiKeyStore.addAPIKey(localKey);

    onDialogOK();
  } catch {
    localKey.expiration = formatDateInputField(localKey.expiration);
  }
}
</script>
