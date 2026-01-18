<template>
  <div class="q-video" :style="{ height: `${$q.screen.height - 26}px` }">
    <iframe
      v-if="!!webVNCUrl.vnc"
      :src="webVNCUrl.vnc"
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

import { useAgentStore } from "src/stores/api";

const agentStore = useAgentStore();

// type imports
import type { WebVNCUrl } from "src/core/agents/types";

const $q = useQuasar();

const { params } = useRoute();

// setup stores
const { getAgentWebVNCUrl } = agentStore;

const webVNCUrl = ref<WebVNCUrl>({
  hostname: "",
  client: "",
  site: "",
  vnc: "",
});

onMounted(async () => {
  if (
    params.agent_id &&
    typeof params.agent_id === "string" &&
    params.port &&
    typeof params.port === "string"
  ) {
    const result = await getAgentWebVNCUrl(params.agent_id, parseInt(params.port));
    if (result) {
      webVNCUrl.value = result;

      useMeta({
        title: `${webVNCUrl.value.hostname} - ${webVNCUrl.value.client} - ${webVNCUrl.value.site} | VNC`,
      });
    }
  }
});
</script>
