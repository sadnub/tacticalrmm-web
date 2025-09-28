<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 50vw; max-width: 50vw">
      <q-bar>
        Policy Exclusions for {{ policy.name }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-card-section>
          <tactical-dropdown
            v-model="localPolicy.excluded_clients"
            :options="clientOptions"
            label="Excluded Clients"
            filled
            multiple
            map-options
            filterable
          />
        </q-card-section>
        <q-card-section>
          <tactical-dropdown
            v-model="localPolicy.excluded_sites"
            :options="siteOptions"
            label="Excluded Sites"
            filled
            multiple
            map-options
            filterable
          />
        </q-card-section>
        <q-card-section>
          <tactical-dropdown
            v-model="localPolicy.excluded_agents"
            :options="agentOptions"
            label="Excluded Agents"
            filled
            multiple
            map-options
            filterable
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup dense flat label="Cancel" />
          <q-btn dense flat label="Save" color="primary" type="submit" :loading="isLoading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { useDialogPluginComponent, extend } from "quasar";
import { useClientDropdown } from "src/core/clients/composables";
import { useSiteDropdown } from "src/core/clients/composables";
import { useAgentDropdown } from "src/core/agents/composables";
import { policyStore } from "src/stores/api";
import type { Policy } from "src/core/automation/types";

const props = defineProps<{ policy: Policy }>();
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// Dropdown options from composables
const { clientOptions } = useClientDropdown();
const { siteOptions } = useSiteDropdown();
const { agentOptions } = useAgentDropdown();

// Local editable copy of the policy, typed, copied in one line
const localPolicy = reactive<Policy>(extend(true, {}, props.policy));

const { isLoading } = policyStore;

async function submit() {
  try {
    await policyStore.updatePolicy(props.policy.id, localPolicy);
    onDialogOK();
  } catch {
    //
  }
}
</script>
