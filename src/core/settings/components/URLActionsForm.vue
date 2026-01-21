<template>
  <q-dialog
    ref="dialogRef"
    no-backdrop-dismiss
    @hide="onDialogHide"
    @show="loadEditor"
    @before-hide="cleanupEditors"
  >
    <q-card
      class="q-dialog-plugin"
      :style="`width: ${props.type === 'web' ? 50 : 60}vw; max-width: ${props.type === 'web' ? 60 : 70}vw`"
    >
      <q-bar>
        {{
          props.action
            ? props.type === "web"
              ? "Edit URL Action"
              : "Edit Web Hook"
            : props.type === "web"
              ? "Add URL Action"
              : "Add Web Hook"
        }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <div style="max-height: 80vh" class="scroll">
          <!-- name -->
          <q-card-section>
            <q-input
              v-model="localAction.name"
              label="Name"
              filled
              dense
              :rules="[(val) => !!val || '*Required']"
            />
          </q-card-section>

          <!-- description -->
          <q-card-section>
            <q-input
              v-model="localAction.desc"
              label="Description"
              filled
              dense
              type="textarea"
              rows="2"
            />
          </q-card-section>

          <!-- pattern -->
          <q-card-section>
            <q-input
              v-model="localAction.pattern"
              label="URL Pattern"
              filled
              dense
              :rules="[(val) => !!val || '*Required']"
            />
          </q-card-section>

          <q-card-section v-if="type === 'rest'">
            <q-select
              v-model="localAction.rest_method"
              label="Method"
              :options="URLActionMethods"
              filled
              dense
              map-options
              emit-value
            />
          </q-card-section>

          <q-card-section v-show="type === 'rest'">
            <q-toolbar>
              <q-tabs v-model="tab" dense shrink>
                <q-tab name="body" label="Request Body" :ripple="false" :disable="disableBodyTab" />
                <q-tab name="headers" label="Request Headers" :ripple="false" />
              </q-tabs>
            </q-toolbar>
            <div ref="editorDiv" :style="{ height: '30vh' }"></div>
          </q-card-section>
        </div>

        <q-card-actions align="right">
          <q-btn v-if="type === 'rest'" flat label="Test" color="primary" @click="testWebHook" />
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn flat label="Submit" color="primary" type="submit" :loading="isLoading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { ref, computed, reactive, watch } from "vue";
import { useDialogPluginComponent, useQuasar, extend } from "quasar";
import { useURLActionStore } from "src/stores/api";

const { isLoading, updateURLAction, addURLAction } = useURLActionStore();

// ui imports
import TestURLAction from "./TestURLAction.vue";

// type imports
import type { URLAction, URLActionType } from "src/core/settings/types";

import * as monaco from "monaco-editor";

// define emits
defineEmits([...useDialogPluginComponent.emits]);

// define props
const props = defineProps<{ type: URLActionType; action?: URLAction }>();

// setup quasar
const $q = useQuasar();
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// static data
const URLActionMethods = [
  { value: "get", label: "GET" },
  { value: "post", label: "POST" },
  { value: "put", label: "PUT" },
  { value: "delete", label: "DELETE" },
  { value: "patch", label: "PATCH" },
];

const localAction = props.action
  ? reactive<URLAction>(extend({}, props.action))
  : reactive<URLAction>({
      id: 0,
      name: "",
      desc: "",
      pattern: "",
      action_type: props.type,
      rest_body: "{\n    \n}",
      rest_method: "post",
      rest_headers: `{\n  "Content-Type": "application/json"\n}`,
    });

const disableBodyTab = computed(() => ["get", "delete"].includes(localAction.rest_method));
const tab = ref(disableBodyTab.value ? "headers" : "body");

watch(
  () => localAction.rest_method,
  () => {
    if (disableBodyTab.value) tab.value = "headers";
  },
);

async function submit() {
  try {
    if (props.action) await updateURLAction(localAction.id, localAction);
    else await addURLAction(localAction);

    onDialogOK();
  } catch {
    //
  }
}

const editorDiv = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor;
const modelBodyUri = monaco.Uri.parse("model://body"); // a made up unique URI for our model
const modelHeadersUri = monaco.Uri.parse("model://headers"); // a made up unique URI for our model
const modelBody = monaco.editor.createModel(localAction.rest_body, "json", modelBodyUri);

const modelHeaders = monaco.editor.createModel(localAction.rest_headers, "json", modelHeadersUri);

function testWebHook() {
  $q.dialog({
    component: TestURLAction,
    componentProps: {
      urlAction: localAction,
    },
  });
}

// watch tab change and change model
watch(tab, (newValue, oldValue) => {
  if (oldValue === "body") {
    localAction.rest_body = editor.getValue();
  } else if (oldValue === "headers") {
    localAction.rest_headers = editor.getValue();
  }

  if (newValue === "body") {
    editor.setModel(modelBody);
    editor.setValue(localAction.rest_body);
  } else if (newValue === "headers") {
    editor.setModel(modelHeaders);
    editor.setValue(localAction.rest_headers);
  }
});

function loadEditor() {
  const theme = $q.dark.isActive ? "vs-dark" : "vs-light";

  if (!editorDiv.value) return;

  editor = monaco.editor.create(editorDiv.value, {
    model: tab.value === "body" ? modelBody : modelHeaders,
    theme: theme,
    automaticLayout: true,
    minimap: { enabled: false },
    quickSuggestions: false,
  });

  editor.onDidChangeModelContent(() => {
    if (tab.value === "body") {
      localAction.rest_body = editor.getValue();
    } else if (tab.value === "headers") {
      localAction.rest_headers = editor.getValue();
    }
  });
}

function cleanupEditors() {
  modelBody.dispose();
  modelHeaders.dispose();
  editor.dispose();
}
</script>
