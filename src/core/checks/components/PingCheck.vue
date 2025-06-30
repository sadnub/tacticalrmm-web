<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ check ? `Edit Ping Check` : "Add Ping Check" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-form @submit.prevent="submit">
        <div style="max-height: 70vh" class="scroll">
          <q-card-section>
            <q-input
              v-model="localCheck.name"
              filled
              dense
              label="Descriptive Name"
              :rules="[(val) => !!val || '*Required']"
            />
          </q-card-section>
          <q-card-section>
            <q-input
              v-model="localCheck.ip"
              dense
              filled
              label="Hostname or IP"
              :rules="[(val) => !!val || '*Required']"
            />
          </q-card-section>
          <q-card-section>
            <q-select
              v-model="localCheck.alert_severity"
              filled
              dense
              options-dense
              emit-value
              map-options
              :options="severityOptions"
              label="Alert Severity"
            />
          </q-card-section>
          <q-card-section>
            <q-select
              v-model="localCheck.fails_b4_alert"
              filled
              dense
              options-dense
              map-options
              emit-value
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
import { useCheckStore } from "../api";
import { failOptions, severityOptions } from "../composables";

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
      check_type: "ping",
      name: null,
      ip: null,
      alert_severity: "warning",
      fails_b4_alert: 1,
      run_interval: 0,
    });

async function submit() {
  if (props.check) checkStore.updateCheck(localCheck.id, localCheck);
  else checkStore.addCheck(localCheck);

  // stops the dialog from closing when there is an error
  await until(() => checkStore.isLoading).toBe(false);
  if (checkStore.isError) return;

  onDialogOK();
}
</script>
