<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 65vw">
      <q-bar>
        Script Test
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section v-if="scriptTestResult" style="height: 70vh" class="scroll">
        <div>
          Run Time:
          <code>{{ scriptTestResult.execution_time }} seconds</code>
          <br />Return Code:
          <code>{{ scriptTestResult.retcode }}</code>
          <br />
        </div>
        <br />
        <div v-if="scriptTestResult.stdout">
          <script-output-copy-clip label="Standard Output" :data="scriptTestResult.stdout" />
          <q-separator />
          <pre>{{ scriptTestResult.stdout }}</pre>
        </div>
        <div v-if="scriptTestResult.stderr">
          <script-output-copy-clip label="Standard Error" :data="scriptTestResult.stderr" />
          <q-separator />
          <pre>{{ scriptTestResult.stderr }}</pre>
        </div>
        <q-inner-loading :showing="isLoading" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { onMounted, ref } from "vue";
import { useScriptStore } from "src/stores/api";

const scriptStore = useScriptStore();

import { useDialogPluginComponent } from "quasar";
import ScriptOutputCopyClip from "./ScriptOutputCopyClip.vue";
import type { Script, ScriptResult } from "../types";

defineEmits(useDialogPluginComponent.emits);

const props = defineProps<{
  script: Script;
  agent: string;
  ctx: string;
}>();

// setup quasar dialog plugin
const { dialogRef, onDialogHide } = useDialogPluginComponent();

// setup stores
const { isLoading } = scriptStore;

const scriptTestResult = ref<ScriptResult | null>(null);

async function runTestScript() {
  const data = {
    code: props.script.script_body,
    timeout: props.script.default_timeout,
    args: props.script.args,
    shell: props.script.shell,
    run_as_user: props.script.run_as_user,
    env_vars: props.script.env_vars,
  };

  const result =
    props.ctx === "server"
      ? await scriptStore.testScriptOnServer(data)
      : await scriptStore.testScript(props.agent, data);
  if (result) {
    scriptTestResult.value = result;
  }
}

onMounted(runTestScript);
</script>
