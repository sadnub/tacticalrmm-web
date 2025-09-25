<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide" @keydown.esc="onDialogHide">
    <q-card class="q-dialog-plugin" :style="{ 'min-width': !ret ? '40vw' : '70vw' }">
      <q-bar>
        Send command on {{ agent.hostname }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit="submit">
        <q-card-section>
          <p>Shell</p>
          <div class="q-gutter-sm">
            <q-radio
              v-if="agent.plat !== 'windows'"
              v-model="state.shell"
              dense
              val="/bin/bash"
              label="Bash"
              @update:model-value="state.custom_shell = null"
            />
            <q-radio
              v-if="agent.plat !== 'windows'"
              v-model="state.shell"
              dense
              val="custom"
              label="Custom"
            />
            <q-radio
              v-if="agent.plat === 'windows'"
              v-model="state.shell"
              dense
              val="cmd"
              label="CMD"
            />
            <q-radio
              v-if="agent.plat === 'windows'"
              v-model="state.shell"
              dense
              val="powershell"
              label="Powershell"
            />
          </div>
        </q-card-section>
        <q-card-section v-if="agent.plat === 'windows'">
          <q-checkbox v-model="state.run_as_user" label="Run As User">
            <q-tooltip>{{ runAsUserToolTip }}</q-tooltip>
          </q-checkbox>
        </q-card-section>
        <q-card-section v-if="state.shell === 'custom'">
          <q-input
            v-model="state.custom_shell"
            filled
            label="Custom shell"
            stack-label
            placeholder="/usr/bin/python3"
            :rules="[(val) => !!val || '*Required']"
          />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="state.timeout"
            dense
            filled
            type="number"
            style="max-width: 150px"
            label="Timeout (seconds)"
            stack-label
            :rules="[
              (val) => !!val || '*Required',
              (val) => val >= 10 || 'Minimum is 10 seconds',
              (val) => val <= 3600 || 'Maximum is 3600 seconds',
            ]"
          />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="state.cmd"
            filled
            label="Command"
            stack-label
            :placeholder="cmdPlaceholder(state.shell)"
            :rules="[(val) => !!val || '*Required']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat dense push label="Cancel" />
          <q-btn :loading="isLoading" flat dense push label="Send" color="primary" type="submit" />
        </q-card-actions>
        <q-card-section v-if="ret"
          ><script-output-copy-clip label="Output" :data="ret" /> <q-separator
        /></q-card-section>
        <q-card-section
          v-if="ret !== null"
          class="q-pl-md q-pr-md q-pt-none q-ma-none scroll"
          style="max-height: 50vh"
        >
          <pre>{{ ret }}</pre>
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { ref } from "vue";
import { useDialogPluginComponent } from "quasar";
import { agentStore } from "src/stores/api";
import { cmdPlaceholder } from "src/core/agents/composables";
import { runAsUserToolTip } from "src/constants/constants";

import ScriptOutputCopyClip from "src/core/scripts/components/ScriptOutputCopyClip.vue";

// import typese
import type { Agent, AgentCommandRequest } from "../types";

const props = defineProps<{
  agent: Agent;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup quasar dialog plugin
const { dialogRef, onDialogHide } = useDialogPluginComponent();

// setup stores
const { isLoading } = agentStore;

// run command logic
const state = ref<AgentCommandRequest>({
  shell: props.agent.plat === "windows" ? "cmd" : "/bin/bash",
  cmd: "",
  timeout: 30,
  custom_shell: null,
  run_as_user: false,
});

const ret = ref<string | undefined>(undefined);

async function submit() {
  ret.value = undefined;
  try {
    ret.value = await agentStore.sendAgentCommand(props.agent.agent_id, state.value);
  } catch {
    //
  }
}
</script>
