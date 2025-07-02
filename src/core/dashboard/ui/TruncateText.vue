<template>
  <div class="truncate-container">
    {{ text }}
    <q-tooltip v-if="text" :delay="500" anchor="bottom middle" self="top middle">
      <div class="tooltip-content">
        {{ text }}
      </div>
    </q-tooltip>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  text: string | null | undefined;
}>();
</script>

<style lang="sass" scoped>
.truncate-container
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 500px;
  cursor: pointer;

.tooltip-content
  max-width: 300px;
  white-space: normal;
  word-break: break-word;
</style>
