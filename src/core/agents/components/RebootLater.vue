<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="dialog-plugin" style="min-width: 30vw">
      <q-bar>
        Schedule reboot on {{ agent.hostname }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
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

<script lang="ts" setup>
// composition imports
import { reactive, ref } from "vue";
import { useQuasar, useDialogPluginComponent, date } from "quasar";
import { useAgentStore } from "../api";
import { formatDateInputField } from "src/utils/format";
import type { Agent } from "../types";

const props = defineProps<{
  agent: Agent;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup stores
const agentStore = useAgentStore();

// setup quasar dialog plugin
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();

// setup reboot later logic
const state = reactive({
  datetime: formatDateInputField(date.addToDate(Date.now(), { hours: 1 }).toISOString()),
});
const loading = ref(false);

function scheduleReboot() {
  agentStore.scheduleAgentReboot(props.agent.agent_id, state);
  $q.dialog({
    title: "Reboot pending",
    style: "width: 40vw",
    message: `A reboot has been scheduled for ${state.datetime} on ${props.agent.hostname}. It can be cancelled from the Pending Actions menu until the scheduled time.`,
  }).onDismiss(onDialogOK);
}
</script>
