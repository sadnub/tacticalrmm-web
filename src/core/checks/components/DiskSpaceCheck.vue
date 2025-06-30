<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ check ? `Edit Disk Check` : "Add Disk Check" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-form @submit.prevent="submit">
        <div style="max-height: 70vh" class="scroll">
          <q-card-section>
            <q-select
              v-model="localCheck.disk"
              dense
              :disable="!!check"
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
              :options="failOptions"
              label="Number of consecutive failures before alert"
            />
          </q-card-section>
          <q-card-section>
            <q-input
              v-model.number="localCheck.run_interval"
              dense
              filled
              type="number"
              label="Run this check every (seconds)"
              hint="Setting this value to anything other than 0 will override the 'Run checks every' setting on the agent"
            />
          </q-card-section>
        </div>
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
import { computed, reactive } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useCheckStore } from "../api";
import { isValidThreshold } from "src/utils/validation";
import { useAgentDiskDropdown } from "src/core/agents/composables";
import { failOptions, defaultDiskOptions } from "../composables";

// import types
import { isAgent, type Check } from "../types";
import type { Agent } from "src/core/agents/types";
import type { Policy } from "src/core/automation/types";
import { until } from "@vueuse/core";

const props = defineProps<{
  check?: Check;
  parent: Agent | Policy;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup stores
const checkStore = useCheckStore();

const diskOptions = computed(() => {
  if (isAgent(props.parent)) {
    const { agentDiskOptions } = useAgentDiskDropdown(props.parent.agent_id);
    return agentDiskOptions.value;
  } else {
    return defaultDiskOptions;
  }
});

// setup quasar dialog
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// check logic
const localCheck = props.check
  ? reactive<Check>(Object.assign({}, props.check))
  : reactive<Check>({
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

    if (props.check) checkStore.updateCheck(localCheck.id, localCheck);
    else checkStore.addCheck(localCheck);

    // stops the dialog from closing when there is an error
    await until(() => checkStore.isLoading).toBe(false);
    if (checkStore.isError) return;

    onDialogOK();
  }
}
</script>
