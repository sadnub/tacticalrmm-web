<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ field ? "Edit Custom Field" : "Add Custom Field" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <!-- model select -->
        <q-card-section>
          <q-select
            v-model="localField.model"
            label="Target"
            :options="modelOptions"
            map-options
            emit-value
            filled
            dense
            :disable="!!field"
            :rules="[(val: string) => !!val || '*Required']"
          />
        </q-card-section>
        <!-- name -->
        <q-card-section>
          <q-input
            v-model="localField.name"
            label="Name"
            filled
            dense
            :rules="[(val: string) => !!val || '*Required']"
          />
        </q-card-section>
        <!-- type select -->
        <q-card-section>
          <q-select
            v-model="localField.type"
            label="Field Type"
            :options="typeOptions"
            map-options
            emit-value
            filled
            dense
            :disable="!!field"
            :rules="[(val: string) => !!val || '*Required']"
            @update:model-value="clear"
          />
        </q-card-section>
        <!-- input options select for single and multiple input type -->
        <q-card-section v-if="localField.type === 'single' || localField.type == 'multiple'">
          <q-select
            v-model="localField.options"
            dense
            label="Input Options (press Enter after typing each option)"
            filled
            use-input
            use-chips
            multiple
            hide-dropdown-icon
            input-debounce="0"
            new-value-mode="add-unique"
            @update:model-value="
              localField.default_value_string = '';
              localField.default_values_multiple = [];
            "
          />
        </q-card-section>
        <!-- default value -->
        <q-card-section v-if="!!localField.type">
          <!-- For datetime field -->
          <q-input
            v-if="localField.type === 'datetime'"
            v-model="localField.default_value_string"
            type="datetime-local"
            dense
            label="Default Value"
            stack-label
            filled
            :rules="defaultValueRules"
            reactive-rules
          />

          <!-- For Checkbox -->
          <q-toggle
            v-else-if="localField.type == 'checkbox'"
            v-model="localField.default_value_bool"
            label="Default Value"
            color="green"
          />

          <!-- Dropdown Single -->
          <q-select
            v-else-if="localField.type === 'single'"
            v-model="localField.default_value_string"
            label="Default Value"
            :options="localField.options"
            filled
            dense
            :rules="defaultValueRules"
            reactive-rules
          />

          <!-- Dropdown Multiple -->
          <q-select
            v-else-if="localField.type === 'multiple'"
            v-model="localField.default_values_multiple"
            label="Default Value(s)"
            :options="localField.options"
            filled
            dense
            multiple
            :rules="defaultValueRules"
            reactive-rules
          />

          <!-- For everything else -->
          <q-input
            v-else
            v-model="localField.default_value_string"
            label="Default Value"
            :type="localField.type === 'text' ? 'text' : 'number'"
            filled
            dense
            :rules="defaultValueRules"
            reactive-rules
            autogrow
          />
        </q-card-section>
        <q-card-section>
          <q-toggle
            v-if="localField.type !== 'checkbox'"
            v-model="localField.required"
            label="Required"
            color="green"
          />
          <q-toggle v-model="localField.hide_in_ui" label="Hide in Dashboard" color="green" />
          <q-toggle
            v-model="localField.hide_in_summary"
            label="Hide in Summary Tab"
            color="green"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn flat label="Submit" color="primary" :loading="isLoading" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { reactive, computed } from "vue";
import { customFieldStore } from "src/stores/api";
import { useDialogPluginComponent } from "quasar";

// type imports
import type { CustomField, CustomFieldModel } from "../types";

const modelOptions = [
  { label: "Client", value: "client" },
  { label: "Site", value: "site" },
  { label: "Agent", value: "agent" },
];

const typeOptions = [
  { label: "Text", value: "text" },
  { label: "Number", value: "number" },
  { label: "Dropdown Single", value: "single" },
  { label: "Dropdown Multiple", value: "multiple" },
  { label: "DateTime", value: "datetime" },
  { label: "Checkbox", value: "checkbox" },
];

const props = defineProps<{ field?: CustomField; model: CustomFieldModel }>();

// setup quasar plugins
defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup stores
const { isLoading } = customFieldStore;

const localField = props.field
  ? reactive<CustomField>(Object.assign({}, props.field))
  : reactive<CustomField>({
      id: 0,
      name: "",
      model: props.model,
      type: "text",
      options: [],
      required: false,
      default_value_string: "",
      default_value_bool: false,
      default_values_multiple: [],
      hide_in_ui: false,
      hide_in_summary: false,
    });

const defaultValueRules = computed(() => {
  if (localField.required) {
    return [(val: boolean) => !!val || "Default Value needs to be set for required fields"];
  } else {
    return [];
  }
});

async function submit() {
  try {
    if (props.field) await customFieldStore.updateCustomField(localField.id, localField);
    else await customFieldStore.addCustomField(localField);
    onDialogOK();
  } catch {
    //
  }
}

function clear() {
  localField.options = [];
  localField.required = false;
  localField.default_value_string = "";
  localField.default_values_multiple = [];
  localField.default_value_bool = false;
}
</script>
