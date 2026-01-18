<template>
  <div v-if="!selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <AuditManager :modal="false" :agent="selectedAgentId" />
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { useAgentStore } from "src/stores/api";

const agentStore = useAgentStore();

// ui imports
import AuditManager from "src/core/logs/components/AuditManager.vue";

const { selectedAgentId } = agentStore;
</script>
