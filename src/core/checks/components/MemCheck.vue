<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ check ? `Edit Memory Check` : "Add Memory Check" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <div style="max-height: 70vh" class="scroll">
          <q-card-section>
            <q-input
              v-model.number="localCheck.warning_threshold"
              dense
              filled
              type="number"
              label="Warning Threshold (%)"
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
              label="Error Threshold (%)"
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
              filled
              dense
              type="number"
              label="Run this check every (seconds)"
              hint="Setting this value to anything other than 0 will override the 'Run checks every' setting on the agent"
            />
          </q-card-section>
        </div>
        <q-card-actions align="right">
          <q-btn v-close-popup dense flat label="Cancel" />
          <q-btn :loading="isLoading" dense flat label="Save" color="primary" type="submit" />
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
import { useCheckStore } from "src/stores/api";

const checkStore = useCheckStore();
import { failOptions } from "../composables";

// import types
import type { Check } from "../types";

const props = defineProps<{
  check?: Check;
  parent: { agent: string } | { policy: number };
}>();

defineEmits(useDialogPluginComponent.emits);

// setup stores
const { isLoading } = checkStore;

// setup quasar dialog
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// check logic
const localCheck = props.check
  ? reactive<Check>(Object.assign({}, props.check))
  : reactive<Check>({
      ...props.parent,
      id: 0,
      check_type: "memory",
      warning_threshold: 70,
      error_threshold: 90,
      run_interval: 0,
      fails_b4_alert: 1,
    });

async function submit() {
  if (localCheck.warning_threshold && localCheck.error_threshold) {
    if (!isValidThreshold(localCheck.warning_threshold, localCheck.error_threshold)) return;

    try {
      if (props.check) await checkStore.updateCheck(localCheck.id, localCheck);
      else await checkStore.addCheck(localCheck);

      onDialogOK();
    } catch {
      //
    }
  }
}
</script>
