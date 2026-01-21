<template>
  <q-dialog
    ref="dialogRef"
    maximized
    no-esc-dismiss
    @hide="onDialogHide"
    @show="loadEditor"
    @before-hide="unloadEditor"
    @keydown.esc.stop="closeEditor"
  >
    <q-card class="q-dialog-plugin">
      <q-bar>
        <span class="q-pr-sm">{{ title }}</span>
        <q-space />
        <q-btn dense flat icon="close" @click="closeEditor" />
      </q-bar>
      <q-banner
        v-if="script.script_body && missingShebang"
        dense
        inline-actions
        class="text-black bg-warning"
      >
        <template #avatar> <q-icon class="text-center" name="warning" color="black" /> </template
        >Shell/Python scripts on Linux/Mac need a shebang at the top of the script e.g.
        <code>#!/bin/bash</code> or <code>#!/usr/bin/python3</code><br />Add one to get rid of this
        warning. Ignore if windows.
      </q-banner>
      <div class="row q-pa-sm">
        <q-scroll-area
          :thumb-style="{
            right: '4px',
            borderRadius: '5px',
            width: '5px',
            opacity: '0.75',
          }"
          :bar-style="{
            right: '2px',
            borderRadius: '9px',
            width: '9px',
            opacity: '0.2',
          }"
          class="col-4 q-mb-none q-pb-none"
          :style="{ height: `${$q.screen.height - 106}px` }"
        >
          <div class="q-gutter-sm q-pr-sm">
            <q-input
              v-model="script.name"
              filled
              dense
              :readonly="readonly"
              label="Name"
              :rules="[(val) => !!val || '*Required']"
              hide-bottom-space
            />
            <q-input
              v-model="script.description"
              filled
              dense
              :readonly="readonly"
              label="Description"
              type="textarea"
              rows="2"
            />
            <q-select
              v-model="script.shell"
              :readonly="readonly"
              options-dense
              filled
              dense
              :options="shellOptions"
              emit-value
              map-options
              label="Shell Type"
            />
            <tactical-dropdown
              v-model="script.supported_platforms"
              :options="agentPlatformOptions"
              label="Supported Platforms (All supported if blank)"
              clearable
              map-options
              filled
              multiple
              :readonly="readonly"
            />
            <tactical-dropdown
              v-model="script.category"
              filled
              :options="categories"
              use-input
              clearable
              new-value-mode="add-unique"
              filterable
              label="Category"
              :readonly="readonly"
              hide-bottom-space
            />
            <tactical-dropdown
              v-model="script.args"
              label="Script Arguments (press Enter after typing each argument)"
              filled
              use-input
              multiple
              hide-dropdown-icon
              input-debounce="0"
              new-value-mode="add"
              :readonly="readonly"
            />
            <tactical-dropdown
              v-model="script.env_vars"
              :label="envVarsLabel"
              filled
              use-input
              multiple
              hide-dropdown-icon
              input-debounce="0"
              new-value-mode="add"
              :readonly="readonly"
            />
            <q-input
              v-model.number="script.default_timeout"
              type="number"
              filled
              dense
              :readonly="readonly"
              label="Timeout (seconds)"
              :rules="[(val) => val >= 5 || 'Minimum is 5']"
              hide-bottom-space
            />
            <q-input
              v-model="script.syntax"
              label="Syntax"
              dense
              filled
              autogrow
              :readonly="readonly"
            />
            <q-checkbox v-model="script.run_as_user" label="Run As User (Windows only)">
              <q-tooltip
                >Setting this value on the script model will always override any 'Run As User'
                checkboxes in the UI and force this script to always be run in the context of the
                logged in user. If no user is logged in, the script will run as SYSTEM.
              </q-tooltip>
            </q-checkbox>
          </div>
        </q-scroll-area>
        <div
          ref="scriptEditor"
          class="col-8 q-mb-none q-pb-none"
          :style="{ height: `${$q.screen.height - 106}px` }"
        ></div>
      </div>
      <q-card-actions>
        <tactical-dropdown
          v-model="testAgent"
          style="width: 550px"
          dense
          :loading="agentLoading"
          filled
          :options="agentOptions"
          label="Agent to run test script on"
          map-options
          filterable
        >
          <template #after>
            <q-btn
              size="md"
              color="primary"
              dense
              flat
              label="Test Script"
              :disable="!testAgent || !script.script_body || !script.default_timeout"
              @click="openTestScriptModal('agent')"
            />
            <q-btn
              v-if="!hosted"
              size="md"
              color="secondary"
              dense
              flat
              label="Test on Tactical's Server"
              :disable="!script.script_body || !script.default_timeout || !serverScriptsEnabled"
              @click="openTestScriptModal('server')"
            >
              <q-tooltip
                anchor="top middle"
                self="bottom middle"
                transition-show="fade"
                transition-hide="fade"
              >
                <div>
                  <strong>Runs on Tactical RMM local Linux Server.</strong><br />
                  Only available interpreters or frameworks will be used.<br />
                  <em>Example:</em> PowerShell scripts require PowerShell to be installed on the
                  system.
                </div>
              </q-tooltip>
            </q-btn>
          </template>
        </tactical-dropdown>
        <q-space />
        <q-btn dense flat label="Cancel" @click="closeEditor" />
        <q-btn
          v-if="!readonly"
          :loading="isLoading"
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
import { ref, reactive, watch, computed } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { useAgentDropdown, agentPlatformOptions } from "src/core/agents/composables";
import { notifyError } from "src/utils/notify";
import { useScriptStore, useDashboardStore } from "src/stores/api";

const { isLoading, updateScript, addScript, getScriptContents } = useScriptStore();
const { dashboardSettings } = useDashboardStore();
import { shellOptions } from "../composables";
import { envVarsLabel } from "src/constants/constants";
// ui imports
import TestScriptModal from "./TestScriptModal.vue";
import * as monaco from "monaco-editor";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import jsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

// type imports
import type { Script } from "../types";

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
const props = defineProps<{
  script?: Script;
  categories?: string[];
  readonly: boolean;
  clone?: boolean;
}>();

// emits
defineEmits([...useDialogPluginComponent.emits]);

// setup quasar plugins
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();


// setup agent dropdown
const { agentOptions, isLoading: agentLoading } = useAgentDropdown();

const hosted = computed(() => dashboardSettings.hosted);
const serverScriptsEnabled = computed(() => dashboardSettings.serverScriptsEnabled);

// script form logic
const script = props.script
  ? reactive<Script>(Object.assign({}, { ...props.script, script_body: "" }))
  : reactive<Script>({
      name: "",
      shell: "powershell",
      default_timeout: 90,
      args: [],
      script_body: "",
      run_as_user: false,
      env_vars: [],
      description: "",
      syntax: "",
      favorite: false,
      category: "",
      supported_platforms: [],
    });

const testAgent = ref<string | null>(null);

if (props.clone) script.name = `(Copy) ${script.name}`;

const missingShebang = computed(() => {
  if (script.shell === "shell" || script.shell === "python") {
    return !script.script_body.startsWith("#!");
  } else {
    return false;
  }
});

const title = computed(() => {
  if (props.script) {
    return props.readonly
      ? `Viewing ${script.name}`
      : props.clone
        ? `Copying ${script.name}`
        : `Editing ${script.name}`;
  } else {
    return "Adding new script";
  }
});

// convert highlighter language to match what ace expects
const lang = computed(() => {
  switch (script.shell) {
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
  try {
    // edit existing script
    if (props.script && !props.clone && props.script.id) {
      await updateScript(props.script.id, script);
    } else {
      await addScript(script);
    }
    onDialogOK();
  } catch {
    //
  }
}

function openTestScriptModal(ctx: string) {
  if (ctx === "server" && !script.script_body.startsWith("#!")) {
    notifyError(
      "A shebang is required at the top of the script to specify the interpreter's path. Please ensure your script begins with a shebang line.",
      7000,
    );
    return;
  }
  $q.dialog({
    component: TestScriptModal,
    componentProps: {
      script: { ...script },
      agent: testAgent.value,
      ctx: ctx,
    },
  });
}

const scriptEditor = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor;

function loadEditor() {
  const model = monaco.editor.createModel(script.script_body, lang.value);

  const theme = $q.dark.isActive ? "vs-dark" : "vs-light";

  editor = monaco.editor.create(scriptEditor.value!, {
    readOnly: props.readonly,
    automaticLayout: true,
    model: model,
    theme: theme,
  });

  editor.onDidChangeModelContent(() => {
    script.script_body = editor.getValue();
  });

  // get code if editing or cloning script
  if (props.script && script.id) {
    void getScriptContents(script.id, props.readonly).then((r: string) => {
      script.script_body = r;
      editor.setValue(r);

      // need to add this in the download function otherwise the above will trigger an edit
      watch(
        () => script.script_body,
        () => {
          edited.value = true;
        },
      );
    });
  } else {
    watch(
      () => script.script_body,
      () => {
        edited.value = true;
      },
    );
  }

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

// add are you sure prompt to unsaved script
const edited = ref(false);

function closeEditor() {
  if (edited.value)
    $q.dialog({
      title: "You have unsaved changes. Are you sure you want to close?",
      cancel: true,
      ok: true,
    }).onOk(() => {
      unloadEditor();
    });
  else unloadEditor();
}
</script>
