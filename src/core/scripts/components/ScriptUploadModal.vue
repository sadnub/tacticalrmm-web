<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 40vw">
      <q-bar>
        Add Script
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit="submit">
        <q-card-section>
          <q-input
            v-model="script.name"
            label="Name"
            filled
            dense
            :rules="[(val) => !!val || '*Required']"
          />
        </q-card-section>

        <q-card-section>
          <q-input v-model="script.description" label="Description" filled dense />
        </q-card-section>

        <q-card-section>
          <tactical-dropdown
            v-model="script.category"
            :options="categories"
            label="Category"
            hint="Press Enter or Tab when adding a new value"
            filled
            filterable
            clearable
            new-value-mode="add-unique"
          />
        </q-card-section>

        <q-card-section>
          <q-file v-model="file" label="Script Upload" filled dense counter>
            <template #prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
        </q-card-section>

        <q-card-section>
          <tactical-dropdown
            v-model="script.shell"
            :options="shellOptions"
            label="Type"
            filled
            map-options
          />
        </q-card-section>

        <q-card-section>
          <tactical-dropdown
            v-model="script.supported_platforms"
            :options="agentPlatformOptions"
            label="Supported Platforms (All supported if blank)"
            clearable
            map-options
            filled
            multiple
          />
        </q-card-section>

        <q-card-section>
          <tactical-dropdown
            v-model="script.args"
            label="Script Arguments"
            placeholder="(press Enter after typing each argument)"
            filled
            use-input
            multiple
            hide-dropdown-icon
            input-debounce="0"
            new-value-mode="add"
          />
        </q-card-section>

        <q-card-section>
          <tactical-dropdown
            v-model="script.env_vars"
            label="Environment Variables"
            placeholder="(press Enter after typing each key=value pair)"
            filled
            use-input
            multiple
            hide-dropdown-icon
            input-debounce="0"
            new-value-mode="add"
          />
        </q-card-section>

        <q-card-section>
          <q-input
            v-model.number="script.default_timeout"
            label="Default Timeout"
            type="number"
            filled
            dense
            :rules="[(val) => val >= 5 || 'Minimum is 5']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup dense flat label="Cancel" />
          <q-btn :loading="isLoading" dense flat label="Add" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { reactive, ref, watch } from "vue";
import { useDialogPluginComponent } from "quasar";
import { scriptStore } from "src/stores/api";
import { agentPlatformOptions } from "src/core/agents/composables";
import { shellOptions } from "../composables";

// import types
import type { Script } from "../types";

defineEmits(useDialogPluginComponent.emits);

defineProps<{
  categories: string[];
}>();

// setup quasar plugins
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup stores
const { isLoading } = scriptStore;

// script upload logic
const script = reactive<Script>({
  name: "",
  shell: "powershell",
  default_timeout: 90,
  args: [],
  script_body: "",
  run_as_user: false,
  env_vars: [],
  description: "",
  syntax: "",
  favorite: false,
  category: "",
  supported_platforms: [],
});

const file = ref<File | null>(null);

watch(file, (newValue) => {
  if (newValue) {
    // save script contents to local script body
    const reader = new FileReader();
    reader.onloadend = () => {
      script.script_body = reader.result as string;
    };

    if (file.value) reader.readAsText(file.value);
  } else {
    script.script_body = "";
  }
});

async function submit() {
  try {
    await scriptStore.addScript(script);
    onDialogOK();
  } catch {
    //
  }
}
</script>
