<template>
  <div class="scroll" :style="{ 'max-height': `${tabHeight - 10}px` }">
    <div v-for="i in info" :key="i + uid()">
      <div v-for="j in i" :key="j + uid()">
        <div v-for="(v, k) in j" :key="v + uid()">
          <span class="text-overline">{{ k }}:</span>
          <q-badge color="primary" class="q-ml-sm text-caption">{{ v }}</q-badge>
          <q-btn
            v-if="!!v"
            size="sm"
            class="q-ml-xs"
            flat
            round
            icon="content_copy"
            @click="copyValueToClip(v)"
          >
            <q-tooltip>Copy to Clipboard</q-tooltip>
          </q-btn>
        </div>
      </div>
      <q-separator v-if="info && info.length > 1" />
    </div>
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { computed } from "vue";
import { copyToClipboard, uid } from "quasar";
import { notifySuccess } from "src/utils/notify";
import { useDashboardStore } from "src/stores/dashboard";

defineProps<{
  info: never[] | undefined;
}>();

// setup stores
const dashboardStore = useDashboardStore();

const tabHeight = computed(() => dashboardStore.tabHeight);

function copyValueToClip(val: string) {
  copyToClipboard(val)
    .then(() => {
      notifySuccess("Copied to clipboard");
    })
    .catch(() => {});
}
</script>
