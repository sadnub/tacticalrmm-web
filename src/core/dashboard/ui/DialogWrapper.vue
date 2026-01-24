<template>
  <q-dialog ref="dialogRef" v-bind="$attrs" @hide="onDialogHide">
    <q-card v-if="!noCard" class="q-dialog-plugin" :style="`min-width: ${width}`">
      <q-bar v-if="title">
        {{ title }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <component
        :is="vuecomponent"
        v-bind="componentProps"
        @close="onDialogOK"
        @hide="onDialogHide"
      />
    </q-card>
    <component
      :is="vuecomponent"
      v-else
      class="q-dialog-plugin"
      v-bind="componentProps"
      @hide="onDialogHide"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from "quasar";
import type { Component } from "vue";

defineProps<{
  vuecomponent: Component;
  title?: string;
  width?: string;
  noCard?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentProps?: Record<string, any>;
}>();

defineEmits(useDialogPluginComponent.emits);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
</script>

<style scoped>
.scroll {
  overflow-y: auto;
}
</style>
