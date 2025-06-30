<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="dialog-plugin" style="min-width: 30vw">
      <q-bar>
        Schedule reboot on {{ agent.hostname }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section>
        <q-input
          v-model="state.datetime"
          type="datetime-local"
          dense
          label="Reboot time"
          stack-label
          filled
          hint="Uses the agent's local time zone"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup dense flat push label="Cancel" />
        <q-btn
          :loading="loading"
          dense
          flat
          push
          label="Schedule Reboot"
          color="primary"
          @click="scheduleReboot"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
// composition imports
import { ref } from "vue";
import { useQuasar, useDialogPluginComponent, date } from "quasar";
import { scheduleAgentReboot } from "src/api/agents";
import { formatDateInputField } from "src/utils/format";

export default {
  name: "RebootLater",
  props: {
    agent: !Object,
  },
  emits: [...useDialogPluginComponent.emits],
  setup(props) {
    // setup quasar dialog plugin
    const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
    const $q = useQuasar();

    // setup reboot later logic
    const state = ref({
      datetime: formatDateInputField(date.addToDate(Date.now(), { hours: 1 })),
    });
    const loading = ref(false);

    async function scheduleReboot() {
      loading.value = true;

      try {
        const ret = await scheduleAgentReboot(props.agent.agent_id, state.value);
        $q.dialog({
          title: "Reboot pending",
          style: "width: 40vw",
          message: `A reboot has been scheduled for ${ret.time} on ${props.agent.hostname}. It can be cancelled from the Pending Actions menu until the scheduled time.`,
        }).onDismiss(onDialogOK);
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
      scheduleReboot,

      // quasar dialog
      dialogRef,
      onDialogHide,
    };
  },
};
</script>
