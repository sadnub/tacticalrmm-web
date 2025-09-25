<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 40vw">
      <q-bar>
        {{ !!client ? `Editing ${client.name}` : "Adding Client" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-card-section>
          <q-input
            v-model="state.name"
            filled
            dense
            label="Name"
            :rules="[(val: string) => (val && val.length > 0) || '*Required']"
          />
        </q-card-section>
        <q-card-section v-if="!client">
          <q-input
            v-model="site.name"
            :rules="[(val: string) => !!val || '*Required']"
            filled
            dense
            label="Default first site"
          />
        </q-card-section>

        <div v-if="clientCustomFields.length > 0" class="q-pl-sm text-h6">Custom Fields</div>
        <q-card-section v-for="field in clientCustomFields" :key="field.id">
          <CustomField v-model="clientCustomFieldValues[field.name]" :field="field" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup dense flat label="Cancel" />
          <q-btn
            :loading="clientStore.isLoading"
            dense
            flat
            push
            label="Save"
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
import { onMounted, reactive, computed } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useClientStore } from "../api";
import { customFieldStore } from "src/stores/api";
import { formatCustomFields } from "src/utils/format";

// ui imports
import CustomField from "src/core/dashboard/ui/CustomField.vue";

import { until } from "@vueuse/shared";

// type imports
import type { CustomFieldValueField } from "src/core/settings/types";
import type { Client } from "../types";

const props = defineProps<{
  client?: Client;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup stores
const clientStore = useClientStore();
const { clientCustomFields } = customFieldStore;
// setup quasar dialog
const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent();

// clients form logic
const state = reactive({ name: props.client ? props.client.name : "" });
const site = reactive({ name: "" });

async function submit() {
  const data = {
    client: state,
    site: site,
    custom_fields: formatCustomFields(clientCustomFields.value, clientCustomFieldValues.value),
  };

  if (props.client) clientStore.updateClient(props.client.id, data);
  else clientStore.addClient(data);

  await until(() => clientStore.isLoading).toBe(false);

  if (clientStore.isError) return;

  onDialogOK();
}

const clientCustomFieldValues = computed(() => {
  const mapped_custom_fields = {} as Record<string, unknown>;
  if (clientStore.client && clientStore.client.custom_fields) {
    for (const field of clientCustomFields.value) {
      const value = clientStore.client.custom_fields.find((value) => value.field === field.id);

      if (field.type === "multiple") {
        if (value) mapped_custom_fields[field.name] = value.value;
        else mapped_custom_fields[field.name] = [];
      } else if (field.type === "checkbox") {
        if (value) mapped_custom_fields[field.name] = value.value;
        else mapped_custom_fields[field.name] = false;
      } else {
        if (value) mapped_custom_fields[field.name] = value.value;
        else mapped_custom_fields[field.name] = "";
      }
    }
  }
  return mapped_custom_fields as Record<string, CustomFieldValueField>;
});

onMounted(() => {
  customFieldStore.getCustomFields();
  if (props.client) clientStore.getClient(props.client.id);
});
</script>
