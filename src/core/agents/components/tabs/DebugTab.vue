<template>
  <div v-if="selectedAgentIds.length === 0" class="q-pa-sm">No agent selected</div>
  <div v-else-if="selectedAgentIds.length > 1"></div>
  <div v-else>
    <DebugLog v-if="selectedAgentId" :agent="selectedAgentId" :modal="false" />
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { useAgentStore } from "src/stores/api";

const { selectedAgentId, selectedAgentIds } = useAgentStore();

// ui imports
import DebugLog from "src/core/logs/components/DebugLog.vue";
</script>
