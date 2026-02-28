<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ readonly ? "View Script Check" : check ? "Edit Script Check" : "Add Script Check" }}
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
            :disable="!!check || readonly"
            filterable
          />
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="localCheck.script_args"
            dense
            :readonly="readonly"
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
            :readonly="readonly"
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
            :readonly="readonly"
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
            :readonly="readonly"
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
            :readonly="readonly"
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
            :readonly="readonly"
            label="Script Timeout (seconds)"
          />
        </q-card-section>
        <q-card-section>
          <q-select
            v-model="localCheck.fails_b4_alert"
            filled
            dense
            options-dense
            :readonly="readonly"
            :options="failOptions"
            label="Number of consecutive failures before alert"
          />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="localCheck.run_interval"
            filled
            dense
            :readonly="readonly"
            type="number"
            label="Run this check every (seconds)"
            hint="Setting this value to anything other than 0 will override the 'Run checks every' setting on the agent"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup dense flat :label="readonly ? 'Close' : 'Cancel'" />
          <q-btn v-if="!readonly" :loading="isLoading" dense flat label="Save" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { reactive, watch, onMounted } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useCheckStore, usePolicyChecksStore } from "src/stores/api";
import { failOptions } from "../composables";
import type { ScriptSelectableOption } from "src/core/scripts/composables";
import { useScriptDropdown } from "src/core/scripts/composables";
import { isHeaderOption } from "src/core/dashboard/types";
import { validateRetcode } from "src/utils/validation";
import { envVarsLabel } from "src/constants/constants";

// type imports
import { isAgent, type Check } from "../types";
import type { AgentPlat } from "src/core/agents/types";

const props = defineProps<{
  check?: Check;
  parent: { agent: string } | { policy: number };
  plat?: AgentPlat;
  readonly?: boolean;
}>();

// Use the appropriate store based on context
const { isLoading: agentIsLoading, addCheck: agentAddCheck, updateCheck: agentUpdateCheck } = useCheckStore();
const { isLoading: policyIsLoading, addCheck: policyAddCheck, updateCheck: policyUpdateCheck } = usePolicyChecksStore();
const isAgentContext = isAgent(props.parent);

const isLoading = isAgentContext ? agentIsLoading : policyIsLoading;
const addCheck = isAgentContext ? agentAddCheck : policyAddCheck;
const updateCheck = isAgentContext ? agentUpdateCheck : policyUpdateCheck;

defineEmits(useDialogPluginComponent.emits);

// setup quasar dialog
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup script dropdown
const { filterByPlatformOptions } = useScriptDropdown(props.plat);

// check logic
const localCheck = props.check
  ? reactive<Check>(Object.assign({}, props.check))
  : reactive<Check>({
      ...props.parent,
      id: 0,
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
  try {
    if (props.check) await updateCheck(localCheck.id, localCheck);
    else await addCheck(localCheck);

    onDialogOK();
  } catch {
    //
  }
}

onMounted(() => {
  if (props.check) {
    const scriptOptionsOnly = filterByPlatformOptions.value.filter(
      (script) => !isHeaderOption(script),
    ) as ScriptSelectableOption[];
    const script = scriptOptionsOnly.find((script) => props.check?.script === script.value);

    if (script) {
      localCheck.script_args = script.args;
      localCheck.env_vars = script.env_vars;
      localCheck.timeout = script.default_timeout;
    }
  }
});
</script>
