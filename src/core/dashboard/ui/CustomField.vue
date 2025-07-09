<template>
  <q-input
    v-if="field.type === 'text' || field.type === 'number'"
    v-model="value"
    :class="longTextClass(field)"
    filled
    dense
    :label="field.name"
    :type="field.type === 'text' ? 'text' : 'number'"
    :hint="hintText(field)"
    :rules="[...validationRules]"
    reactive-rules
    autogrow
  />

  <q-toggle
    v-else-if="field.type === 'checkbox'"
    v-model="value"
    :label="field.name"
    :hint="hintText(field)"
  />

  <q-input
    v-else-if="field.type === 'datetime'"
    v-model="value"
    :label="field.name"
    :hint="hintText(field)"
    type="datetime-local"
    dense
    stack-label
    filled
    :rules="[...validationRules]"
    reactive-rules
  />

  <q-select
    v-else-if="field.type === 'single' || field.type === 'multiple'"
    v-model="value"
    filled
    dense
    :hint="hintText(field)"
    :label="field.name"
    :options="field.options"
    :multiple="field.type === 'multiple'"
    :rules="[...validationRules]"
    reactive-rules
    clearable
  />
</template>

<script lang="ts" setup>
import { computed, defineModel } from "vue";
import type { CustomField } from "src/core/settings/types";
import { truncateText } from "src/utils/format";

const props = defineProps<{
  field: CustomField;
}>();

const value = defineModel<string | number | FileList | null | undefined>();

const validationRules = computed(() => {
  const rules = [];

  if (props.field.required) {
    rules.push((val: string) => !!val || `${props.field.name} is required`);
  }

  return rules;
});

function hintText(field: CustomField) {
  let value = "";
  if (field.type === "multiple")
    value =
      field.default_values_multiple.length > 0
        ? `Default value: ${field.default_values_multiple.join(", ")}`
        : "";
  else if (field.type === "checkbox")
    value = field.default_value_bool ? `Default value: ${field.default_value_bool}` : "";
  else value = field.default_value_string ? `Default value: ${field.default_value_string}` : "";

  return value.length > 100 ? truncateText(value, 100) : value;
}

function longTextClass(field: CustomField) {
  return "default_value_string" in field && field.default_value_string.length >= 130
    ? "q-mb-xl q-mt-xl"
    : "";
}
</script>
