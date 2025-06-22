<template>
  <div v-if="!agentStore.selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <DebugLog :agent="agentStore.selectedAgentId" :modal="false" />
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { useAgentStore } from "../../api";

// ui imports
import DebugLog from "src/core/logs/components/DebugLog.vue";

const agentStore = useAgentStore();
</script>
