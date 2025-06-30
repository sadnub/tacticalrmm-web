<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ title }}
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-card-section>
          <span v-if="!apiKey">API Key will be generated on save</span>
        </q-card-section>
        <!-- name -->
        <q-card-section>
          <q-input
            label="Name"
            filled
            dense
            v-model="localKey.name"
            :rules="[(val) => !!val || '*Required']"
          />
        </q-card-section>

        <!-- user -->
        <q-card-section>
          <tactical-dropdown
            filled
            v-model="localKey.user"
            label="User"
            :options="userOptions"
            map-options
            filterable
          />
        </q-card-section>

        <!-- key -->
        <q-card-section v-if="apiKey">
          <q-input readonly label="Key" filled dense v-model="localKey.key" />
        </q-card-section>

        <!-- expiration -->
        <q-card-section>
          <q-input
            type="datetime-local"
            dense
            label="Key Expiration (Not required)"
            stack-label
            filled
            v-model="localKey.expiration"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn flat label="Submit" color="primary" type="submit" :loading="loading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, reactive } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useAPIKeyStore } from "../api";
import { useUserDropdown } from "src/core/accounts/composables";
import { formatDateInputField, formatDateStringwithTimezone } from "src/utils/format";

// ui imports
import TacticalDropdown from "src/components/ui/TacticalDropdown.vue";
import type { APIKey } from "../types";
import { until } from "@vueuse/shared";

const props = defineProps<{
  apiKey: APIKey;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup quasar plugins
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup stores
const keyStore = useAPIKeyStore();

// setup dropdowns
const { userOptions } = useUserDropdown();

// setup api key form logic
const localKey = props.apiKey
  ? reactive<APIKey>(Object.assign({}, props.apiKey))
  : reactive<APIKey>({ name: "", expiration: "", key: "", user: 0 });
const loading = ref(false);

// remove Z from date string
if (props.apiKey) {
  localKey.expiration = formatDateInputField(localKey.expiration);
}

const title = computed(() => (props.apiKey ? "Edit API Key" : "Add API Key"));

async function submit() {
  loading.value = true;

  // convert date to local timezone if exists
  if (localKey.expiration) localKey.expiration = formatDateStringwithTimezone(localKey.expiration);

  if (props.apiKey && localKey.id) void keyStore.updateAPIKey(localKey.id, localKey);
  else void keyStore.addAPIKey(localKey);

  await until(() => keyStore.isLoading).toBe(false);
  if (keyStore.isError) return;
  onDialogOK();
}
</script>
