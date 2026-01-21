<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        Edit policies assigned to {{ type }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit="submit">
        <q-card-section v-if="policyOptions.length > 0">
          <tactical-dropdown
            v-if="type === 'client' || type === 'site'"
            v-model="form.selectedServerPolicy"
            class="q-mb-md"
            :options="policyOptions"
            label="Server Policy"
            filled
            clearable
            map-options
            filterable
          />
          <tactical-dropdown
            v-if="type === 'client' || type === 'site'"
            v-model="form.selectedWorkstationPolicy"
            :options="policyOptions"
            label="Workstation Policy"
            filled
            clearable
            map-options
            filterable
          />
          <tactical-dropdown
            v-if="type === 'agent'"
            v-model="form.selectedAgentPolicy"
            :options="policyOptions"
            label="Policy"
            filled
            clearable
            map-options
            filterable
          />

          <q-checkbox v-model="form.blockInheritance" label="Block policy inheritance">
            <q-tooltip>This {{ type }} will not inherit from higher policies</q-tooltip>
          </q-checkbox>
        </q-card-section>
        <q-card-section v-else>
          No Automation Policies have been setup. Go to Settings > Automation Manager
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup dense flat label="Cancel" />
          <q-btn
            v-if="policyOptions.length > 0"
            dense
            flat
            label="Submit"
            color="primary"
            type="submit"
            :disable="!hasChanges"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { reactive, computed } from "vue";
import { useDialogPluginComponent } from "quasar";
import { usePolicyDropdown } from "src/core/automation/composables";
import { useClientStore, useSiteStore, useAgentStore } from "src/stores/api";

const { updateClient } = useClientStore();
const { updateSite } = useSiteStore();
const { updateAgent } = useAgentStore();
import type { Client } from "src/core/clients/types";
import type { Site } from "src/core/clients/types";
import type { Agent } from "src/core/agents/types";

const props = defineProps<{
  object: {
    id: number;
    agent_id?: string;
    server_policy?: number | null;
    workstation_policy?: number | null;
    policy?: number | null;
    block_policy_inheritance?: boolean;
  };
  type: "agent" | "site" | "client";
}>();
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// Use policy dropdown composable
const { policyOptions } = usePolicyDropdown();

// Form state - initialized with prop values
const form = reactive({
  selectedWorkstationPolicy:
    props.type !== "agent" ? (props.object.workstation_policy ?? null) : null,
  selectedServerPolicy: props.type !== "agent" ? (props.object.server_policy ?? null) : null,
  selectedAgentPolicy: props.type === "agent" ? (props.object.policy ?? null) : null,
  blockInheritance: props.object.block_policy_inheritance ?? false,
});

const hasChanges = computed(() => {
  if (props.type === "client" || props.type === "site") {
    return (
      props.object.workstation_policy !== form.selectedWorkstationPolicy ||
      props.object.server_policy !== form.selectedServerPolicy ||
      props.object.block_policy_inheritance !== form.blockInheritance
    );
  } else if (props.type === "agent") {
    return (
      props.object.policy !== form.selectedAgentPolicy ||
      props.object.block_policy_inheritance !== form.blockInheritance
    );
  }
  return false;
});

async function submit() {
  if (!hasChanges.value) {
    return;
  }

  try {
    if (props.type === "client") {
      const payload: Partial<Client> = {
        block_policy_inheritance: form.blockInheritance,
      };
      if (form.selectedServerPolicy !== null) {
        payload.server_policy = form.selectedServerPolicy;
      }
      if (form.selectedWorkstationPolicy !== null) {
        payload.workstation_policy = form.selectedWorkstationPolicy;
      }
      await updateClient(props.object.id, payload);
    } else if (props.type === "site") {
      const payload: Partial<Site> = {
        block_policy_inheritance: form.blockInheritance,
      };
      if (form.selectedServerPolicy !== null) {
        payload.server_policy = form.selectedServerPolicy;
      }
      if (form.selectedWorkstationPolicy !== null) {
        payload.workstation_policy = form.selectedWorkstationPolicy;
      }
      await updateSite(props.object.id, payload);
    } else if (props.type === "agent") {
      const payload: Partial<Agent> = {
        block_policy_inheritance: form.blockInheritance,
      };
      if (form.selectedAgentPolicy !== null) {
        payload.policy = form.selectedAgentPolicy;
      }
      await updateAgent(props.object.agent_id!, payload);
    }
    onDialogOK();
  } catch {
    //
  }
}
</script>
