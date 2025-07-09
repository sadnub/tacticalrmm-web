<template>
  <q-dialog
    ref="dialogRef"
    maximized
    @hide="onDialogHide"
    @show="loadEditor"
    @before-hide="unloadEditor"
  >
    <q-card class="q-dialog-plugin">
      <q-bar>
        <span class="q-pr-sm">{{ title }}</span>
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <div class="row">
        <q-input
          v-model="localSnippet.name"
          :rules="[(val: string) => !!val || '*Required']"
          class="q-pa-sm col-4"
          label="Name"
          filled
          dense
        />
        <q-select
          v-model="localSnippet.shell"
          :options="shellOptions"
          class="q-pa-sm col-2"
          label="Shell Type"
          options-dense
          filled
          dense
          emit-value
          map-options
        />
        <q-input
          v-model="localSnippet.desc"
          class="q-pa-sm col-6"
          filled
          dense
          label="Description"
        />
      </div>

      <div ref="snippetEditor" :style="{ height: `${$q.screen.height - 132}px` }"></div>

      <q-card-actions align="right">
        <q-btn v-close-popup dense flat label="Cancel" />
        <q-btn
          :loading="snippetStore.isLoading"
          dense
          flat
          label="Save"
          color="primary"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// composable imports
import { ref, watch, reactive, computed } from "vue";
import { useQuasar } from "quasar";
import { useScriptSnippetStore } from "../api";
import { useDialogPluginComponent } from "quasar";
import { shellOptions } from "../composables";

// ui imports
import * as monaco from "monaco-editor";

// type imports
import type { ScriptSnippet } from "../types";

import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import jsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { until } from "@vueuse/shared";

// https://github.com/microsoft/monaco-editor/issues/4045#issuecomment-1723787448
self.MonacoEnvironment = {
  getWorker: function (_, label) {
    switch (label) {
      case "json":
        return new jsonWorker();
      case "css":
      case "scss":
      case "less":
        return new cssWorker();
      case "html":
      case "handlebars":
      case "razor":
        return new htmlWorker();
      case "typescript":
      case "javascript":
        return new jsWorker();
      default:
        return new editorWorker();
    }
  },
};

// props
const props = defineProps<{ snippet?: ScriptSnippet }>();

// emits
defineEmits([...useDialogPluginComponent.emits]);

// quasar dialog setup
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup quasar
const $q = useQuasar();

// setup stores
const snippetStore = useScriptSnippetStore();

// snippet form logic
const localSnippet = props.snippet
  ? reactive<ScriptSnippet>(Object.assign({}, props.snippet))
  : reactive<ScriptSnippet>({ name: "", code: "", desc: "", shell: "powershell" });

const title = computed(() => {
  if (props.snippet) {
    return `Editing ${localSnippet.name}`;
  } else {
    return "Adding New Script snippet";
  }
});

// convert highlighter language to match what monaco expects
const lang = computed(() => {
  switch (localSnippet.shell) {
    case "cmd":
      return "bat";
    case "powershell":
      return "powershell";
    case "python":
      return "python";
    case "shell":
    case "nushell":
      return "shell";
    case "deno":
      return "typescript";
    default:
      return "";
  }
});

async function submit() {
  if (props.snippet) snippetStore.updateScriptSnippet(localSnippet);
  else snippetStore.addScriptSnippet(localSnippet);

  await until(() => snippetStore.isLoading).toBe(false);

  if (snippetStore.isError) return;
  onDialogOK();
}

const snippetEditor = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor;

function loadEditor() {
  const model = monaco.editor.createModel(localSnippet.code, lang.value);

  const theme = $q.dark.isActive ? "vs-dark" : "vs-light";

  editor = monaco.editor.create(snippetEditor.value!, {
    automaticLayout: true,
    model: model,
    theme: theme,
  });

  editor.onDidChangeModelContent(() => {
    localSnippet.code = editor.getValue();
  });

  // watch for changes in language
  watch(lang, () => {
    monaco.editor.setModelLanguage(model, lang.value);
  });
}

function unloadEditor() {
  editor.getModel()?.dispose();
  editor.dispose();
  onDialogHide();
}
</script>
