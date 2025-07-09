<template>
  <span class="truncate-container">
    {{ text }}
    <q-tooltip v-if="text" :delay="500" anchor="bottom middle" self="top middle">
      <div class="tooltip-content">
        {{ text }}
      </div>
    </q-tooltip>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  text: string | null | undefined;
}>();
</script>

<style lang="sass" scoped>
.truncate-container
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 350px;
  vertical-align: middle
  cursor: pointer;

.tooltip-content
  max-width: 300px;
  white-space: normal;
  word-break: break-word;
</style>
