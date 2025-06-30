<template>
  <q-input
    v-if="field.type === 'text' || field.type === 'number'"
    ref="input"
    :class="longTextClass(field)"
    filled
    dense
    :label="field.name"
    :type="field.type === 'text' ? 'text' : 'number'"
    :hint="hintText(field)"
    :model-value="modelValue"
    :rules="[...validationRules]"
    reactive-rules
    autogrow
    @update:model-value="(value) => $emit('update:modelValue', value)"
  />

  <q-toggle
    v-else-if="field.type === 'checkbox'"
    ref="input"
    :label="field.name"
    :hint="hintText(field)"
    :model-value="modelValue"
    @update:model-value="(value) => $emit('update:modelValue', value)"
  />

  <q-input
    v-else-if="field.type === 'datetime'"
    ref="input"
    :label="field.name"
    :hint="hintText(field)"
    type="datetime-local"
    dense
    stack-label
    filled
    :model-value="modelValue"
    :rules="[...validationRules]"
    reactive-rules
    @update:model-value="(value) => $emit('update:modelValue', value)"
  />

  <q-select
    v-else-if="field.type === 'single' || field.type === 'multiple'"
    ref="input"
    :model-value="modelValue"
    filled
    dense
    :hint="hintText(field)"
    :label="field.name"
    :options="field.options"
    :multiple="field.type === 'multiple'"
    :rules="[...validationRules]"
    reactive-rules
    clearable
    @update:model-value="(value) => $emit('update:modelValue', value)"
  />
</template>

<script>
import { truncateText } from "src/utils/format";
export default {
  name: "CustomField",
  props: ["field", "modelValue"],
  emits: ["update:modelValue"],
  computed: {
    validationRules() {
      const rules = [];

      if (this.field.required) {
        rules.push((val) => !!val || `${this.field.name} is required`);
      }

      return rules;
    },
  },
  methods: {
    validate(...args) {
      return this.$refs.input.validate(...args);
    },
    hintText(field) {
      let value = "";
      if (field.type === "multiple")
        value =
          field.default_values_multiple.length > 0
            ? `Default value: ${field.default_values_multiple}`
            : "";
      else if (field.type === "checkbox")
        value = field.default_value_bool ? `Default value: ${field.default_value_bool}` : "";
      else value = field.default_value_string ? `Default value: ${field.default_value_string}` : "";

      return value.length > 100 ? truncateText(value, 100) : value;
    },
    longTextClass(field) {
      return field.hasOwnProperty("default_value_string") &&
        field.default_value_string.length >= 130
        ? "q-mb-xl q-mt-xl"
        : "";
    },
  },
};
</script>
