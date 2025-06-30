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
            <q-radio v-model="state.mode" dense val="mesh" label="Mesh Agent" />
            <q-radio v-model="state.mode" dense val="tacagent" label="Tactical Agent" />
          </div>
        </q-card-section>
        <q-card-section v-if="state.mode === 'mesh'">
          Fix issues with the Mesh Agent which handles take control, live terminal and file browser.
        </q-card-section>
        <q-card-section v-else-if="state.mode === 'tacagent'">
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

<script>
// composition imports
import { ref } from "vue";
import { useDialogPluginComponent } from "quasar";
import { sendAgentRecovery } from "src/api/agents";
import { notifySuccess } from "src/utils/notify";

export default {
  name: "AgentRecovery",
  props: {
    agent: !Object,
  },
  emits: [...useDialogPluginComponent.emits],
  setup(props) {
    // setup quasar dialog plugin
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

    // agent recovery logic
    const state = ref({
      mode: "mesh",
    });

    const loading = ref(false);

    async function sendRecovery() {
      loading.value = true;
      try {
        const result = await sendAgentRecovery(props.agent.agent_id, state.value);
        notifySuccess(result);
        onDialogOK();
      } catch (e) {
        console.error(e);
      }
      loading.value = false;
    }

    return {
      // reactive data
      state,
      loading,

      // methods
      sendRecovery,

      // dialog plugin
      dialogRef,
      onDialogHide,
    };
  },
};
</script>
