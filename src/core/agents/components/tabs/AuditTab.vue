<template>
  <div v-if="!agentStore.selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <AuditManager :modal="false" :agent="agentStore.selectedAgentId" />
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { useAgentStore } from "../../api";

// ui imports
import AuditManager from "src/core/logs/components/AuditManager.vue";

const agentStore = useAgentStore();
</script>
