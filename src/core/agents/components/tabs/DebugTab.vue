<template>
  <div v-if="!selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <DebugLog :agent="selectedAgentId" :modal="false" />
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { useAgentStore } from "src/stores/api";

const { selectedAgentId } = useAgentStore();

// ui imports
import DebugLog from "src/core/logs/components/DebugLog.vue";
</script>
