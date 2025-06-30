<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ check ? `Edit Script Check` : "Add Script Check" }}
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section v-if="filterByPlatformOptions.length === 0">
        <p>You need to upload a script first</p>
        <p>Settings -> Script Manager</p>
      </q-card-section>

      <q-form v-else @submit.prevent="submit">
        <q-card-section>
          <tactical-dropdown
            :rules="[(val: string) => !!val || '*Required']"
            filled
            v-model="localCheck.script"
            :options="filterByPlatformOptions"
            label="Select script"
            map-options
            :disable="!!check"
            filterable
          />
        </q-card-section>
        <q-card-section>
          <q-select
            dense
            label="Script Arguments (press Enter after typing each argument)"
            filled
            v-model="localCheck.script_args"
            use-input
            use-chips
            multiple
            hide-dropdown-icon
            new-value-mode="add"
          />
        </q-card-section>
        <q-card-section>
          <q-select
            dense
            :label="envVarsLabel"
            filled
            v-model="localCheck.env_vars"
            use-input
            use-chips
            multiple
            hide-dropdown-icon
            new-value-mode="add"
          />
        </q-card-section>
        <q-card-section>
          <tactical-dropdown
            label="Informational return codes (press Enter after typing each code)"
            filled
            v-model="localCheck.info_return_codes"
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
            label="Warning return codes (press Enter after typing each code)"
            filled
            v-model="localCheck.warning_return_codes"
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
            label="Success return codes (press Enter after typing each code)"
            filled
            v-model="localCheck.success_return_codes"
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
            filled
            dense
            v-model.number="localCheck.timeout"
            label="Script Timeout (seconds)"
          />
        </q-card-section>
        <q-card-section>
          <q-select
            filled
            dense
            options-dense
            v-model="localCheck.fails_b4_alert"
            :options="failOptions"
            label="Number of consecutive failures before alert"
          />
        </q-card-section>
        <q-card-section>
          <q-input
            filled
            dense
            type="number"
            v-model.number="localCheck.run_interval"
            label="Run this check every (seconds)"
            hint="Setting this value to anything other than 0 will override the 'Run checks every' setting on the agent"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn dense flat label="Cancel" v-close-popup />
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
import { useScriptDropdown, isScriptOption } from "src/core/scripts/composables";
import { validateRetcode } from "src/utils/validation";
import { envVarsLabel } from "src/constants/constants";
import { until } from "@vueuse/core";

// type imports
import type { Check } from "../types";
import type { Policy } from "src/core/automation/types";
import type { Agent, AgentPlat } from "src/core/agents/types";

// ui imports
import TacticalDropdown from "src/components/ui/TacticalDropdown.vue";

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
    const scriptOptionsOnly = filterByPlatformOptions.value.filter(isScriptOption);
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
    const scriptOptionsOnly = filterByPlatformOptions.value.filter(isScriptOption);
    const script = scriptOptionsOnly.find((script) => props.check.script === script.value);

    if (script) {
      localCheck.script_args = script.args;
      localCheck.env_vars = script.env_vars;
      localCheck.timeout = script.default_timeout;
    }
  }
});
</script>
