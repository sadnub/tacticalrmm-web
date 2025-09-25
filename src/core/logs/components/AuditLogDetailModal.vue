<template>
  <q-dialog ref="dialogRef" @before-hide="unloadDiff" @show="loadDiff">
    <q-card class="q-dialog-plugin" style="min-width: 70vw" no-backdrop-dismiss>
      <q-bar>
        {{ log.message }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section class="q-pa-none">
        <div
          ref="editor"
          class="editor-container"
          :style="{ height: `${$q.screen.height - 500}px` }"
        ></div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup flat dense push label="Close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, useTemplateRef } from "vue";
import * as monaco from "monaco-editor";
import { useDialogPluginComponent, useQuasar } from "quasar";

// type imports
import type { AuditLog } from "../types";

const props = defineProps<{
  log: AuditLog;
}>();

defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

const editorContainer = useTemplateRef<HTMLDivElement>("editor");

let editorInstance: monaco.editor.IStandaloneDiffEditor | null = null;

const originalText = computed(() =>
  props.log.before_value ? JSON.stringify(props.log.before_value, null, 2) : "",
);
const modifiedText = computed(() =>
  props.log.after_value ? JSON.stringify(props.log.after_value, null, 2) : "",
);

function loadDiff() {
  if (editorContainer.value) {
    const editorOptions: monaco.editor.IStandaloneDiffEditorConstructionOptions = {
      automaticLayout: true,
      readOnly: true,
      scrollBeyondLastLine: false,
      theme: $q.dark.isActive ? "vs-dark" : "vs",
      minimap: { enabled: false },
    };

    editorInstance = monaco.editor.createDiffEditor(editorContainer.value, editorOptions);

    editorInstance.setModel({
      original: monaco.editor.createModel(originalText.value, "json"),
      modified: monaco.editor.createModel(modifiedText.value, "json"),
    });
  }
}

function unloadDiff() {
  if (editorInstance) {
    editorInstance.dispose();
  }

  onDialogHide();
}
</script>
