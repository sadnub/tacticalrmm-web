<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 350px">
      <q-card-section class="row items-center">
        <q-icon v-if="icon" :name="icon" :color="iconColor" size="2em" class="q-mr-sm" />
        <span class="text-h6">{{ title }}</span>
      </q-card-section>

      <q-card-section>
        {{ message }}
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="emit('update:modelValue', false)" />
        <q-btn
          v-if="showConfirm"
          :color="type === 'confirm' ? 'primary' : 'negative'"
          :label="confirmLabel"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
defineProps<{
  modelValue: boolean;
  title: string;
  message: string;
  type?: "confirm" | "alert";
  icon?: string;
  iconColor?: string;
  showConfirm?: boolean;
  confirmLabel?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
}>();

function onConfirm() {
  emit("confirm");
  emit("update:modelValue", false);
}
</script>
