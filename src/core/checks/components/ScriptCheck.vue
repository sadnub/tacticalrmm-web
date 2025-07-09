<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ check ? `Edit Script Check` : "Add Script Check" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section v-if="filterByPlatformOptions.length === 0">
        <p>You need to upload a script first</p>
        <p>Settings -> Script Manager</p>
      </q-card-section>

      <q-form v-else @submit.prevent="submit">
        <q-card-section>
          <tactical-dropdown
            v-model="localCheck.script"
            :rules="[(val: string) => !!val || '*Required']"
            filled
            :options="filterByPlatformOptions"
            label="Select script"
            map-options
            :disable="!!check"
            filterable
          />
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="localCheck.script_args"
            dense
            label="Script Arguments (press Enter after typing each argument)"
            filled
            use-input
            use-chips
            multiple
            hide-dropdown-icon
            new-value-mode="add"
          />
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="localCheck.env_vars"
            dense
            :label="envVarsLabel"
            filled
            use-input
            use-chips
            multiple
            hide-dropdown-icon
            new-value-mode="add"
          />
        </q-card-section>
        <q-card-section>
          <tactical-dropdown
            v-model="localCheck.info_return_codes"
            label="Informational return codes (press Enter after typing each code)"
            filled
            multiple
            hide-dropdown-icon
            use-input
            input-debounce="0"
            new-value-mode="add-unique"
            @new-value="validateRetcode"
          />
        </q-card-section>
        <q-card-section>
          <tactical-dropdown
            v-model="localCheck.warning_return_codes"
            label="Warning return codes (press Enter after typing each code)"
            filled
            use-input
            multiple
            hide-dropdown-icon
            input-debounce="0"
            new-value-mode="add-unique"
            @new-value="validateRetcode"
          />
        </q-card-section>
        <q-card-section>
          <tactical-dropdown
            v-model="localCheck.success_return_codes"
            label="Success return codes (press Enter after typing each code)"
            filled
            use-input
            multiple
            hide-dropdown-icon
            input-debounce="0"
            new-value-mode="add-unique"
            @new-value="validateRetcode"
          />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="localCheck.timeout"
            filled
            dense
            label="Script Timeout (seconds)"
          />
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="localCheck.fails_b4_alert"
            filled
            dense
            options-dense
            :options="failOptions"
            label="Number of consecutive failures before alert"
          />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="localCheck.run_interval"
            filled
            dense
            type="number"
            label="Run this check every (seconds)"
            hint="Setting this value to anything other than 0 will override the 'Run checks every' setting on the agent"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup dense flat label="Cancel" />
          <q-btn
            :loading="checkStore.isLoading"
            dense
            flat
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
import { reactive, watch, onMounted } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useCheckStore } from "../api";
import { failOptions } from "../composables";
import type { ScriptSelectableOption } from "src/core/scripts/composables";
import { useScriptDropdown } from "src/core/scripts/composables";
import { isHeaderOption } from "src/core/dashboard/types";
import { validateRetcode } from "src/utils/validation";
import { envVarsLabel } from "src/constants/constants";
import { until } from "@vueuse/core";

// type imports
import type { Check } from "../types";
import type { Policy } from "src/core/automation/types";
import type { Agent, AgentPlat } from "src/core/agents/types";

const props = defineProps<{
  check: Check;
  parent: Agent | Policy;
  plat?: AgentPlat;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup stores
const checkStore = useCheckStore();

// setup quasar dialog
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup script dropdown
const { filterByPlatformOptions } = useScriptDropdown(props.plat);

// check logic
const localCheck = props.check
  ? reactive<Check>(Object.assign({}, props.check))
  : reactive<Check>({
      ...props.parent,
      script: null,
      script_args: [],
      env_vars: [],
      timeout: 90,
      check_type: "script",
      fails_b4_alert: 1,
      info_return_codes: [],
      warning_return_codes: [],
      success_return_codes: [],
      run_interval: 0,
    });

watch(
  () => localCheck.script,
  (newValue) => {
    const scriptOptionsOnly = filterByPlatformOptions.value.filter(
      (script) => !isHeaderOption(script),
    ) as ScriptSelectableOption[];
    const script = scriptOptionsOnly.find((script) => newValue === script.value);

    if (script) {
      localCheck.script_args = script.args;
      localCheck.env_vars = script.env_vars;
      localCheck.timeout = script.default_timeout;
    }
  },
);

async function submit() {
  if (props.check) checkStore.updateCheck(localCheck.id, localCheck);
  else checkStore.addCheck(localCheck);

  // stops the dialog from closing when there is an error
  await until(() => checkStore.isLoading).toBe(false);
  if (checkStore.isError) return;

  onDialogOK();
}

onMounted(() => {
  if (props.check) {
    const scriptOptionsOnly = filterByPlatformOptions.value.filter(
      (script) => !isHeaderOption(script),
    ) as ScriptSelectableOption[];
    const script = scriptOptionsOnly.find((script) => props.check.script === script.value);

    if (script) {
      localCheck.script_args = script.args;
      localCheck.env_vars = script.env_vars;
      localCheck.timeout = script.default_timeout;
    }
  }
});
</script>
