<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ check ? `Edit Service Check` : "Add Service Check" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>

      <q-form @submit.prevent="submit">
        <div style="max-height: 70vh" class="scroll">
          <q-card-section>
            <!-- policy check, either choose from a list of default services or enter manually -->
            <div v-if="isPolicy(parent)">
              <q-radio
                v-if="!check"
                v-model="localCheck.svc_policy_mode"
                val="default"
                label="Choose from defaults"
              />
              <q-radio
                v-if="!check"
                v-model="localCheck.svc_policy_mode"
                val="manual"
                label="Enter manually"
              />
              <q-select
                v-if="localCheck.svc_policy_mode === 'default' && !check"
                v-model="localCheck.svc_name"
                :rules="[(val: string) => !!val || '*Required']"
                dense
                options-dense
                filled
                :options="defaultServiceOptions"
                label="Service"
                map-options
                emit-value
                :disable="!!check"
              />
              <q-input
                v-if="localCheck.svc_policy_mode === 'manual'"
                v-model="localCheck.svc_name"
                :rules="[(val) => !!val || '*Required']"
                filled
                dense
                label="Service Name"
              />
              <q-input
                v-if="localCheck.svc_policy_mode === 'manual'"
                v-model="localCheck.svc_display_name"
                :rules="[(val) => !!val || '*Required']"
                filled
                dense
                label="Display Name"
              />
            </div>
            <!-- agent check -->
            <!-- disable selection if editing -->
            <tactical-dropdown
              v-if="isAgent(parent)"
              v-model="localCheck.svc_name"
              :rules="[(val: string) => !!val || '*Required']"
              dense
              options-dense
              filled
              :options="agentServiceOptions"
              label="Service"
              map-options
              emit-value
              :disable="!!check"
              filterable
            />
          </q-card-section>
          <q-card-section>
            <q-checkbox
              v-model="localCheck.pass_if_start_pending"
              label="PASS if service is in 'Start Pending' mode"
            />
            <br />
            <q-checkbox
              v-model="localCheck.pass_if_svc_not_exist"
              label="PASS if service doesn't exist"
            />
            <br />
            <q-checkbox
              v-model="localCheck.restart_if_stopped"
              label="Restart service if it's stopped"
            />
          </q-card-section>
          <q-card-section>
            <q-select
              v-model="localCheck.alert_severity"
              filled
              dense
              options-dense
              map-options
              emit-value
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
          <q-btn :loading="isLoading" dense flat label="Save" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { reactive, watch } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useCheckStore, usePolicyChecksStore } from "src/stores/api";
import { failOptions, defaultServiceOptions, severityOptions } from "../composables";
import { useAgentServiceDropdown } from "src/core/agents/composables";

// type imports
import { isAgent, isPolicy, type Check } from "../types";
import type { AgentPlat } from "src/core/agents/types";

const props = defineProps<{
  check?: Check;
  parent: { agent: string } | { policy: number };
  plat?: AgentPlat;
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

const { agentServiceOptions } = useAgentServiceDropdown(
  isAgent(props.parent) ? props.parent.agent : null,
);

// check logic
const localCheck = props.check
  ? reactive<Check>(Object.assign({}, props.check))
  : reactive<Check>({
      ...props.parent,
      id: 0,
      check_type: "winsvc",
      svc_name: null,
      svc_display_name: null,
      svc_policy_mode: null,
      pass_if_start_pending: false,
      pass_if_svc_not_exist: false,
      restart_if_stopped: false,
      fails_b4_alert: 1,
      alert_severity: "warning",
      run_interval: 0,
    });

watch(
  () => localCheck.svc_name,
  () => {
    const service = agentServiceOptions.value.find((i) => i.value === localCheck.svc_name);

    if (service) localCheck.svc_display_name = service.label;
  },
);

watch(
  () => localCheck.svc_policy_mode,
  () => {
    localCheck.svc_name = null;
    localCheck.svc_display_name = null;
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
</script>
