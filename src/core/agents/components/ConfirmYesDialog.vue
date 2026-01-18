<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 25vw; max-width: 70vw">
      <q-card-section class="text-h6">{{ title }}</q-card-section>

      <q-card-section>
        Please type <span class="text-negative text-h5">yes</span> in the box below to confirm
        {{ actionVerb }} of
        <span class="text-negative text-h5">{{ hostname }}</span
        >.
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="model"
          autofocus
          label="Type yes to confirm"
          :rules="[(val) => (val || '').toLowerCase() === 'yes']"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn
          :color="okColor"
          :label="okLabel"
          :disable="(model || '').toLowerCase() !== 'yes'"
          @click="onDialogOK()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useDialogPluginComponent } from "quasar";

defineProps<{
  hostname: string;
  actionVerb: string;
  title?: string;
  okLabel?: string;
  okColor?: string;
}>();

defineEmits(useDialogPluginComponent.emits);

const model = ref("");

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
</script>
