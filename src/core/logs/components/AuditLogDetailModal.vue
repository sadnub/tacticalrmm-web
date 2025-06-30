<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 70vw" persistent>
      <q-bar>
        {{ log.message }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section class="scroll" style="max-height: 65vh">
        <q-splitter v-model="splitterModel">
          <template #before>
            <div class="text-h6">Before</div>
            <pre>{{ JSON.stringify(log.before_value, null, 4) }}</pre>
          </template>

          <template #after>
            <div class="text-h6">After</div>
            <pre>{{ JSON.stringify(log.after_value, null, 4) }}</pre>
          </template>
        </q-splitter>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup flat dense push label="Cancel" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useDialogPluginComponent } from "quasar";
import type { AuditLog } from "../types";

defineProps<{
  log: AuditLog;
}>();

defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

const splitterModel = ref(50);
</script>
