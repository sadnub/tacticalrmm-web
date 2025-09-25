<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" :style="dialogStyle">
      <q-bar>
        {{ title }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section>
        <q-btn dense flat size="md" icon="content_copy" @click="copyOutput(message)">
          <q-tooltip>Copy to Clipboard</q-tooltip>
        </q-btn>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <pre class="q-pa-sm">{{ message }}</pre>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn label="OK" @click="onDialogOK" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { useDialogPluginComponent } from "quasar";
import { copyOutput } from "src/utils/helpers";

defineProps<{
  title: string;
  dialogStyle: string | object;
  message: string;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
</script>

<style>
pre {
  font-family: monospace;
  white-space: pre-wrap;
}
</style>
