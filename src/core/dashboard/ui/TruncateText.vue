<template>
  <span class="truncate-container" :style="containerStyle">
    {{ text }}
    <q-tooltip v-if="text" :delay="500" anchor="bottom middle" self="top middle">
      <div class="tooltip-content">
        {{ text }}
      </div>
    </q-tooltip>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    text: string | null | undefined;
    /** Pixels if number, or any CSS length. Defaults to 350px. */
    width?: string | number;
  }>(),
  { width: 350 },
);

const containerStyle = computed(() => {
  const raw = props.width;
  if (raw === "") return undefined;
  const w = typeof raw === "number" ? `${raw}px` : raw;
  return {
    width: w,
    maxWidth: w,
    minWidth: 0,
  };
});
</script>

<style lang="sass" scoped>
.truncate-container
  display: inline-block
  box-sizing: border-box
  max-width: 100%
  min-width: 0
  overflow: hidden
  text-overflow: ellipsis
  white-space: nowrap
  vertical-align: middle
  cursor: pointer

.tooltip-content
  max-width: 300px
  white-space: normal
  word-break: break-word
</style>
