<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ !!site ? `Editing ${site.name}` : "Adding Site" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-card-section>
          <tactical-dropdown
            v-model="state.client"
            label="Client"
            :options="clientOptions"
            filled
            map-options
            :rules="[(val: number) => !!val || 'Client is required']"
            filterable
          />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="state.name"
            :rules="[(val: string) => !!val || 'Name is required']"
            filled
            dense
            label="Name"
          />
        </q-card-section>

        <div v-if="siteCustomFields.length > 0" class="q-pl-sm text-h6">Custom Fields</div>
        <q-card-section v-for="field in siteCustomFields" :key="field.id">
          <CustomField v-model="siteCustomFieldValues[field.name]" :field="field" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup dense flat push label="Cancel" />
          <q-btn :loading="isLoading" dense flat push label="Save" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { computed, onMounted, reactive } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useClientDropdown } from "src/core/clients/composables";
import { useCustomFieldStore, useSiteStore } from "src/stores/api";

const { siteCustomFields, getCustomFields } = useCustomFieldStore();
const { isLoading, addSite, updateSite } = useSiteStore();

import { formatCustomFields } from "src/utils/format";

// ui imports
import CustomField from "src/core/dashboard/ui/CustomField.vue";

// type imports
import type { Site } from "../types";
import type { CustomFieldValueField } from "src/core/settings/types";

const props = defineProps<{
  site?: Site;
  client?: number;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup quasar dialog
const { dialogRef, onDialogOK, onDialogHide } = useDialogPluginComponent();

// setup dropdowns
const { clientOptions } = useClientDropdown();

// sites for logic
const state = reactive({
  client: props.client || undefined,
  name: props.site ? props.site.name : "",
});

async function submit() {
  try {
    const data = {
      site: state,
      custom_fields: formatCustomFields(siteCustomFields.value, siteCustomFieldValues.value),
    };
    if (props.site) await updateSite(props.site.id, data);
    else await addSite(data);

    onDialogOK();
  } catch {
    //
  }
}

const siteCustomFieldValues = computed(() => {
  const mapped_custom_fields = {} as Record<string, unknown>;
  if (props.site && props.site.custom_fields) {
    for (const field of siteCustomFields.value) {
      const value = props.site.custom_fields.find((value) => value.field === field.id);

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
  getCustomFields();
});
</script>
