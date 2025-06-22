<template>
  <div v-if="!agentStore.selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else>
    <AuditManager :agent="agentStore.selectedAgentId" />
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { useAgentStore } from "../../api";

// ui imports
import AuditManager from "../../core/logs/components/AuditManager.vue";

const agentStore = useAgentStore();
</script>
