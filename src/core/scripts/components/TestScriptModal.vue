<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 65vw">
      <q-bar>
        Script Test
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section v-if="ret" style="height: 70vh" class="scroll">
        <div>
          Run Time:
          <code>{{ ret.execution_time }} seconds</code>
          <br />Return Code:
          <code>{{ ret.retcode }}</code>
          <br />
        </div>
        <br />
        <div v-if="ret.stdout">
          <script-output-copy-clip label="Standard Output" :data="ret.stdout" />
          <q-separator />
          <pre>{{ ret.stdout }}</pre>
        </div>
        <div v-if="ret.stderr">
          <script-output-copy-clip label="Standard Error" :data="ret.stderr" />
          <q-separator />
          <pre>{{ ret.stderr }}</pre>
        </div>
        <q-inner-loading :showing="scriptStore.isLoading" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { computed, onMounted } from "vue";
import { useScriptStore } from "../api";

import { useDialogPluginComponent } from "quasar";
import ScriptOutputCopyClip from "./ScriptOutputCopyClip.vue";
import type { Script } from "../types";

defineEmits(useDialogPluginComponent.emits);

const props = defineProps<{
  script: Script;
  agent: string;
  ctx: string;
}>();

// setup quasar dialog plugin
const { dialogRef, onDialogHide } = useDialogPluginComponent();

// setup stores
const scriptStore = useScriptStore();

const ret = computed(() => scriptStore.scriptTestResult);
function runTestScript() {
  const data = {
    code: props.script.script_body,
    timeout: props.script.default_timeout,
    args: props.script.args,
    shell: props.script.shell,
    run_as_user: props.script.run_as_user,
    env_vars: props.script.env_vars,
  };

  if (props.ctx === "server") {
    void scriptStore.testScriptOnServer(data);
  } else {
    void scriptStore.testScript(props.agent, data);
  }
}

onMounted(runTestScript);
</script>
