<template>
  <div v-if="!selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <DebugLog :agent="selectedAgentId" :modal="false" />
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { agentStore } from "src/stores/api";

// ui imports
import DebugLog from "src/core/logs/components/DebugLog.vue";

const { selectedAgentId } = agentStore;
</script>
