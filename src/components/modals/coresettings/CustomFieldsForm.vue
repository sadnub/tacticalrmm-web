<template>
  <q-dialog ref="dialog" @hide="onHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ title }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-form @submit="submit">
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
            :disable="editing"
            :rules="[(val) => !!val || '*Required']"
          />
        </q-card-section>
        <!-- name -->
        <q-card-section>
          <q-input
            v-model="localField.name"
            label="Name"
            filled
            dense
            :rules="[(val) => !!val || '*Required']"
          />
        </q-card-section>
        <!-- type select -->
        <q-card-section>
          <q-select
            label="Field Type"
            :options="typeOptions"
            map-options
            v-model="localField.type"
            emit-value
            filled
            dense
            :disable="editing"
            :rules="[(val) => !!val || '*Required']"
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
          <q-btn flat label="Submit" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script>
import mixins from "src/mixins/mixins";

export default {
  name: "CustomFieldsForm",
  mixins: [mixins],
  props: { field: Object, model: String },
  emits: ["hide", "ok", "cancel"],
  data() {
    return {
      localField: {
        name: "",
        model: "",
        type: "",
        options: [],
        required: false,
        default_value_string: "",
        default_value_bool: false,
        default_values_multiple: [],
        hide_in_ui: false,
        hide_in_summary: false,
      },
      modelOptions: [
        { label: "Client", value: "client" },
        { label: "Site", value: "site" },
        { label: "Agent", value: "agent" },
      ],
      typeOptions: [
        { label: "Text", value: "text" },
        { label: "Number", value: "number" },
        { label: "Dropdown Single", value: "single" },
        { label: "Dropdown Multiple", value: "multiple" },
        { label: "DateTime", value: "datetime" },
        { label: "Checkbox", value: "checkbox" },
      ],
    };
  },
  computed: {
    title() {
      return this.editing ? "Edit Custom Field" : "Add Custom Field";
    },
    editing() {
      return !!this.field;
    },
    defaultValueRules() {
      if (this.localField.required) {
        return [(val) => !!val || "Default Value needs to be set for required fields"];
      } else {
        return [];
      }
    },
  },
  mounted() {
    // If pk prop is set that means we are editing
    if (this.field) Object.assign(this.localField, this.field);

    // Set model to current tab
    if (this.model) this.localField.model = this.model;
  },
  methods: {
    submit() {
      this.$q.loading.show();

      const data = {
        ...this.localField,
      };

      if (this.editing) {
        this.$axios
          .put(`/core/customfields/${data.id}/`, data)
          .then(() => {
            this.$q.loading.hide();
            this.onOk();
            this.notifySuccess("Custom field edited!");
          })
          .catch(() => {
            this.$q.loading.hide();
          });
      } else {
        this.$axios
          .post("/core/customfields/", data)
          .then(() => {
            this.$q.loading.hide();
            this.onOk();
            this.notifySuccess("Custom field added!");
          })
          .catch(() => {
            this.$q.loading.hide();
          });
      }
    },
    clear() {
      this.localField.options = [];
      this.localField.required = false;
      this.localField.default_value_string = "";
      this.localField.default_values_multiple = [];
      this.localField.default_value_bool = false;
    },
    show() {
      this.$refs.dialog.show();
    },
    hide() {
      this.$refs.dialog.hide();
    },
    onHide() {
      this.$emit("hide");
    },
    onOk() {
      this.$emit("ok");
      this.hide();
    },
  },
};
</script>
