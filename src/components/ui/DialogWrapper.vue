<template>
  <q-dialog ref="dialogRef" v-bind="dialogProps" @hide="onDialogHide">
    <q-card
      v-if="!noCard"
      class="q-dialog-plugin"
      :style="`min-width: ${width}vw`"
    >
      <q-bar>
        {{ title }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip content-class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <div class="scroll" :style="`height: ${height}vh`">
        <component
          :is="vuecomponent"
          v-bind="{ ...$attrs, ...componentProps }"
          @close="onDialogOK"
          @hide="onDialogHide"
        />
      </div>
    </q-card>
    <component
      :is="vuecomponent"
      v-else
      class="q-dialog-plugin"
      v-bind="{ ...$attrs, ...componentProps }"
    />
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from "quasar";

export default {
  name: "DialogWrapper",
  inheritAttrs: false,
  props: {
    vuecomponent: {},
    title: String,
    width: {
      type: String,
      default: "50",
    },
    height: {
      type: String,
      default: "50",
    },
    noCard: {
      type: Boolean,
      default: false,
    },
    componentProps: Object,
    dialogProps: Object,
  },
  emits: [...useDialogPluginComponent.emits],
  setup() {
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
      useDialogPluginComponent();

    return {
      // quasar dialog plugin
      dialogRef,
      onDialogHide,
      onDialogOK,
      onDialogCancel,
    };
  },
};
</script>
