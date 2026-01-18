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
          <q-btn :loading="isLoading" dense flat push label="Save" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { onMounted, reactive, computed, ref } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useClientStore, useCustomFieldStore } from "src/stores/api";

const clientStore = useClientStore();
const customFieldStore = useCustomFieldStore();
import { formatCustomFields } from "src/utils/format";

// ui imports
import CustomField from "src/core/dashboard/ui/CustomField.vue";

// type imports
import type { CustomFieldValueField } from "src/core/settings/types";
import type { Client } from "../types";

const props = defineProps<{
  client?: Client;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup stores
const { isLoading } = clientStore;
const { clientCustomFields } = customFieldStore;
// setup quasar dialog
const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent();

// clients form logic
const state = reactive({ name: props.client ? props.client.name : "" });
const site = reactive({ name: "" });
const localClient = ref<Client | undefined>(undefined);

async function submit() {
  const data = {
    client: state,
    site: site,
    custom_fields: formatCustomFields(clientCustomFields.value, clientCustomFieldValues.value),
  };

  try {
    if (props.client) await clientStore.updateClient(props.client.id, data);
    else await clientStore.addClient(data);
    onDialogOK();
  } catch {
    //
  }
}

const clientCustomFieldValues = computed(() => {
  const mapped_custom_fields = {} as Record<string, unknown>;
  if (localClient.value?.custom_fields) {
    for (const field of clientCustomFields.value) {
      const value = localClient.value.custom_fields.find((value) => value.field === field.id);

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

async function getClient() {
  if (props.client) localClient.value = await clientStore.getClient(props.client.id);
}

onMounted(() => {
  void getClient();
  customFieldStore.getCustomFields();
});
</script>
