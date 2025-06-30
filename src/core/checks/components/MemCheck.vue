<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ check ? `Edit Memory Check` : "Add Memory Check" }}
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-form @submit.prevent="submit">
        <div style="max-height: 70vh" class="scroll">
          <q-card-section>
            <q-input
              dense
              filled
              type="number"
              v-model.number="localCheck.warning_threshold"
              label="Warning Threshold (%)"
              :rules="[
                (val) => val >= 0 || 'Minimum threshold is 0',
                (val) => val < 100 || 'Maximum threshold is 99',
              ]"
            />
          </q-card-section>
          <q-card-section>
            <q-input
              dense
              filled
              type="number"
              v-model.number="localCheck.error_threshold"
              label="Error Threshold (%)"
              :rules="[
                (val) => val >= 0 || 'Minimum threshold is 0',
                (val) => val < 100 || 'Maximum threshold is 99',
              ]"
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
        </div>
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
import { reactive } from "vue";
import { useDialogPluginComponent } from "quasar";
import { isValidThreshold } from "src/utils/validation";
import { useCheckStore } from "../api";
import { failOptions } from "../composables";

// import types
import type { Check } from "../types";
import type { Policy } from "src/core/automation/types";
import type { Agent } from "src/core/agents/types";
import { until } from "@vueuse/core";

const props = defineProps<{
  check: Check;
  parent: Agent | Policy;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup stores
const checkStore = useCheckStore();

// setup quasar dialog
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// check logic
const localCheck = props.check
  ? reactive<Check>(Object.assign({}, props.check))
  : reactive<Check>({
      ...props.parent,
      check_type: "memory",
      warning_threshold: 70,
      error_threshold: 90,
      run_interval: 0,
      fails_b4_alert: 1,
    });

async function submit() {
  if (localCheck.warning_threshold && localCheck.error_threshold) {
    if (!isValidThreshold(localCheck.warning_threshold, localCheck.error_threshold)) return;

    if (props.check) checkStore.updateCheck(localCheck.id, localCheck);
    else checkStore.addCheck(localCheck);

    // stops the dialog from closing when there is an error
    await until(() => checkStore.isLoading).toBe(false);
    if (checkStore.isError) return;

    onDialogOK();
  }
}
</script>
