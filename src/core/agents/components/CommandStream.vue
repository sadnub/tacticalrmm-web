<template>
  <q-card-section v-if="hasText" class="q-px-xs q-pb-md q-pt-xs">
    <script-output-copy-clip label="Live Output" :data="outputText" />
    <q-separator class="q-my-sm" />
  </q-card-section>
  <div v-if="hasText" ref="streamContainer" class="command-stream">
    <div class="terminal">
      <pre class="mt-0">{{ outputText }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watchEffect, nextTick, computed, useTemplateRef } from "vue";
import { useAgentCmdWSConnection } from "src/websocket/websocket";
import ScriptOutputCopyClip from "src/core/scripts/components/ScriptOutputCopyClip.vue";
import { uid } from "quasar";

const props = defineProps<{
  agentId: string;
  cmd: string;
  shell: string;
  customShell?: string | null;
  timeout?: number;
}>();

const emit = defineEmits<{
  (e: "updateOutput", output: string): void;
  (e: "streamLoaded"): void;
  (e: "streamClosed"): void;
}>();

const cmdId = uid();
const { send, data, reset, close, status } = useAgentCmdWSConnection(props.agentId, cmdId);

const outputText = ref("");
const streamContainer = useTemplateRef<HTMLElement>("streamContainer");
let firstChunk = false;

const hasText = computed(() => outputText.value.trim() !== "");

watchEffect(() => {
  if (data.value.length) {
    outputText.value = data.value.map((msg) => msg.output).join("\n");
    emit("updateOutput", outputText.value);

    if (!firstChunk && data.value.length > 0) {
      firstChunk = true;
      emit("streamLoaded");
    }

    void nextTick(() => {
      if (streamContainer.value) {
        streamContainer.value.scrollTop = streamContainer.value.scrollHeight;
      }
    });
  }
});

watchEffect(() => {
  if (status.value === "CLOSED") emit("streamClosed");
});

onMounted(() => {
  outputText.value = "";
  reset();
  send(
    JSON.stringify({
      shell: props.shell,
      cmd: props.cmd,
      timeout: props.timeout ?? 10,
      run_as_user: false,
      custom_shell: props.customShell,
      stream: true,
      cmd_id: cmdId,
    }),
  );
});

onUnmounted(close);
</script>

<style scoped>
.command-stream {
  font-family: monospace;
  background: #191818;
  color: #fff;
  padding: 0 10px;
  height: 30vh;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.terminal {
  white-space: pre-wrap;
}
</style>
