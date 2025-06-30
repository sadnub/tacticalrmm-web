<!--
Copyright (c) 2023-present Amidaware Inc.
This file is subject to the EE License Agreement.
For details, see: https://license.tacticalrmm.com/ee
-->

<template>
  <q-splitter
    v-model="horizontalSplitter"
    horizontal
    emit-immediately
    unit="px"
    :limits="[0, splitterHeight - 8]"
    :style="{
      'min-height': `${splitterHeight}px`,
      height: `${splitterHeight}px`,
    }"
  >
    <template #before>
      <iframe
        v-if="previewFormat !== 'pdf'"
        :srcdoc="source"
        :style="{
          'min-width': '100%',
          'background-color': 'white',
          height: `${horizontalSplitter - 6}px`,
        }"
      ></iframe>
      <iframe
        v-else
        :src="source"
        :style="{
          'min-width': '100%',
          'background-color': 'white',
          height: `${horizontalSplitter - 6}px`,
        }"
      ></iframe>
    </template>
    <template #after>
      <q-splitter v-if="debug" v-model="verticalSplitter">
        <template #before>
          <div class="q-pa-xs">
            {{ previewFormat === "plaintext" ? "Text" : "HTML" }}
          </div>
          <div
            id="templateDiv"
            :style="{ height: `${splitterHeight - horizontalSplitter - 33}px` }"
          ></div>
        </template>
        <template #after>
          <div class="q-pa-xs">Variables</div>
          <div
            id="variablesDiv"
            :style="{ height: `${splitterHeight - horizontalSplitter - 33}px` }"
          ></div>
        </template>
      </q-splitter>
      <div v-else style="height: 0px"></div>
    </template>
  </q-splitter>
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted } from "vue";
import { useQuasar } from "quasar";
import * as monaco from "monaco-editor";

// types
import type { ReportFormat } from "../types/reporting";

const props = defineProps<{
  previewFormat: ReportFormat;
  source: string;
  debug: boolean;
  variables?: string;
}>();

const $q = useQuasar();

const splitterHeight = ref($q.screen.height - 82);

const horizontalSplitter = ref(props.debug ? splitterHeight.value / 2 : splitterHeight.value - 8);

const verticalSplitter = ref(props.debug ? 50 : 0);

// for debug editors in preview
if (props.debug) {
  let templateEditor: monaco.editor.IStandaloneCodeEditor;
  let variablesEditor: monaco.editor.IStandaloneCodeEditor;

  onMounted(() => {
    const theme = $q.dark.isActive ? "vs-dark" : "vs-light";

    templateEditor = monaco.editor.create(document.getElementById("templateDiv")!, {
      automaticLayout: true,
      value: props.source || "",
      theme: theme,
      language: "html",
      minimap: { enabled: false },
      readOnly: true,
    });

    variablesEditor = monaco.editor.create(document.getElementById("variablesDiv")!, {
      automaticLayout: true,
      value: props.variables || "",
      language: "json",
      theme: theme,
      minimap: { enabled: false },
      readOnly: true,
    });
  });

  onUnmounted(() => {
    templateEditor?.dispose();
    variablesEditor?.dispose();
  });
}
</script>
