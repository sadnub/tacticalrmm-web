<template>
  <div v-if="selectedAgentIds.length === 0" class="q-pa-sm">No agent selected</div>
  <div v-else-if="selectedAgentIds.length > 1"></div>
  <div v-else>
    <AuditManager v-if="selectedAgentId" :modal="false" :agent="selectedAgentId" />
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { useAgentStore } from "src/stores/api";

const { selectedAgentId, selectedAgentIds } = useAgentStore();

// ui imports
import AuditManager from "src/core/logs/components/AuditManager.vue";
</script>
