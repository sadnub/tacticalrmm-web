<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 50vw">
      <q-bar>
        {{ agent.hostname }} Agent recovery
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-form @submit="sendRecovery">
        <q-card-section>
          <div class="q-gutter-sm">
            <q-radio v-model="mode" dense val="mesh" label="Mesh Agent" />
            <q-radio v-model="mode" dense val="tacagent" label="Tactical Agent" />
          </div>
        </q-card-section>
        <q-card-section v-if="mode === 'mesh'">
          Fix issues with the Mesh Agent which handles take control, live terminal and file browser.
        </q-card-section>
        <q-card-section v-else-if="mode === 'tacagent'">
          Fix issues with the Tactical RMM Agent service.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup dense flat push label="Cancel" />
          <q-btn :loading="loading" dense flat push label="Recover" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { ref } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useAgentStore } from "../api";
import type { Agent, AgentRecoveryMode } from "../types";
import { until } from "@vueuse/shared";

const props = defineProps<{
  agent: Agent;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup quasar dialog plugin
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup stores
const agentStore = useAgentStore();

// agent recovery logic
const mode = ref<AgentRecoveryMode>("mesh");

const loading = ref(false);

async function sendRecovery() {
  agentStore.sendAgentRecovery(props.agent.agent_id, mode.value);

  await until(() => agentStore.isLoading).toBe(false);

  if (agentStore.isError) return;
  onDialogOK();
}
</script>
