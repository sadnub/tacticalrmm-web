<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ readonly ? "View Disk Check" : check ? "Edit Disk Check" : "Add Disk Check" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>

      <q-form @submit.prevent="submit">
        <div style="max-height: 70vh" class="scroll">
          <q-card-section>
            <q-select
              v-model="localCheck.disk"
              dense
              :disable="!!check || readonly"
              filled
              :options="diskOptions"
              label="Disk"
              :rules="[(val) => !!val || '*Required']"
            />
          </q-card-section>
          <q-card-section>
            <q-input
              v-model.number="localCheck.warning_threshold"
              dense
              filled
              :readonly="readonly"
              type="number"
              label="Warning Threshold Remaining (%)"
              :rules="[
                (val) => val >= 0 || 'Minimum threshold is 0',
                (val) => val < 100 || 'Maximum threshold is 99',
              ]"
            />
          </q-card-section>
          <q-card-section>
            <q-input
              v-model.number="localCheck.error_threshold"
              dense
              filled
              :readonly="readonly"
              type="number"
              label="Error Threshold Remaining (%)"
              :rules="[
                (val) => val >= 0 || 'Minimum threshold is 0',
                (val) => val < 100 || 'Maximum threshold is 99',
              ]"
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
              dense
              filled
              :readonly="readonly"
              type="number"
              label="Run this check every (seconds)"
              hint="Setting this value to anything other than 0 will override the 'Run checks every' setting on the agent"
            />
          </q-card-section>
        </div>
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
import { reactive } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useCheckStore, usePolicyChecksStore } from "src/stores/api";
import { isValidThreshold } from "src/utils/validation";
import { useAgentDiskDropdown } from "src/core/agents/composables";
import { failOptions, defaultDiskOptions } from "../composables";

// import types
import { isAgent, type Check } from "../types";

const props = defineProps<{
  check?: Check;
  parent: { agent: string } | { policy: number };
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
const { agentDiskOptions } = useAgentDiskDropdown(
  isAgent(props.parent) ? props.parent.agent : null,
);

const diskOptions = isAgent(props.parent) ? agentDiskOptions : defaultDiskOptions;

// setup quasar dialog
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// check logic
const localCheck = props.check
  ? reactive<Check>(Object.assign({}, props.check))
  : reactive<Check>({
      id: 0,
      ...props.parent,
      disk: null,
      check_type: "diskspace",
      warning_threshold: 25,
      error_threshold: 10,
      fails_b4_alert: 1,
      run_interval: 0,
    });

async function submit() {
  if (localCheck.warning_threshold && localCheck.error_threshold) {
    if (!isValidThreshold(localCheck.warning_threshold, localCheck.error_threshold, true)) return;

    try {
      if (props.check) await updateCheck(localCheck.id, localCheck);
      else await addCheck(localCheck);

      onDialogOK();
    } catch {
      //
    }
  }
}
</script>
