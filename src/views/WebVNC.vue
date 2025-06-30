<template>
  <div class="q-video" :style="{ height: `${$q.screen.height - 26}px` }">
    <iframe
      v-show="vnc"
      :src="vnc"
      allow="clipboard-read; clipboard-write"
      allowfullscreen
      frameborder="0"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useQuasar, useMeta } from "quasar";

import { useAgentStore } from "src/core/agents/api";

const $q = useQuasar();

const { params } = useRoute();
const vnc = ref("");

// setup stores
const agentStore = useAgentStore();

onMounted(() => {
  if (
    params.agent_id &&
    typeof params.agent_id === "string" &&
    params.port &&
    typeof params.port === "string"
  ) {
    agentStore.getAgentWebVNCUrl(params.agent_id, parseInt(params.port));

    useMeta({
      title: `${agentStore.webVNCUrl.hostname} - ${agentStore.webVNCUrl.client} - ${agentStore.webVNCUrl.site} | VNC`,
    });
  }
});
</script>
