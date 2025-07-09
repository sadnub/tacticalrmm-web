<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 70vw">
      <q-bar>
        Script Output
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section style="height: 70vh" class="scroll">
        <div>
          Last Run:
          <code>{{ scriptInfo.last_run && dashboardStore.formatDate(scriptInfo.last_run) }}</code>
          <br />Run Time:
          <code>{{ scriptInfo.execution_time }} seconds</code>
          <br />Return Code:
          <code>{{ scriptInfo.retcode }}</code>
          <br />
        </div>
        <br />
        <div v-if="scriptInfo.stdout">
          <script-output-copy-clip label="Standard Output" :data="scriptInfo.stdout" />
          <q-separator />
          <pre>{{ scriptInfo.stdout }}</pre>
        </div>
        <div v-if="scriptInfo.stderr">
          <script-output-copy-clip label="Standard Error" :data="scriptInfo.stderr" />
          <q-separator />
          <pre>{{ scriptInfo.stderr }}</pre>
        </div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-close-popup flat dense push label="Cancel" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { useDialogPluginComponent } from "quasar";
import { useDashboardStore } from "src/stores/dashboard";
import ScriptOutputCopyClip from "./ScriptOutputCopyClip.vue";
import type { CheckResult } from "src/core/checks/types";

defineEmits(useDialogPluginComponent.emits);

defineProps<{
  scriptInfo: CheckResult;
}>();

const dashboardStore = useDashboardStore();

// quasar dialog setup
const { dialogRef, onDialogHide } = useDialogPluginComponent();
</script>
