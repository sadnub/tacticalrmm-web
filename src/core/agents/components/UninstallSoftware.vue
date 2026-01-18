<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 50vw; max-width: 50vw">
      <q-bar>
        Uninstalling {{ softwareName }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>

      <q-card-section>
        <p>Confirm or edit the uninstall command:</p>
        <q-input v-model="uninstallString" class="q-mb-md" dense autofocus />
        <q-input
          v-model.number="timeout"
          style="max-width: 150px"
          label="Timeout (seconds)"
          type="number"
          dense
          :rules="[(val: number) => !!val || 'Timeout is required']"
        />
        <q-checkbox v-model="runAsUser" label="Run as user" class="q-mt-sm" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" @click="onDialogCancel" />
        <q-btn color="primary" label="Uninstall" :loading="isLoading" @click="uninstall" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useAgentSoftwareStore } from "src/stores/api";

const agentSoftwareStore = useAgentSoftwareStore();

const props = defineProps<{
  agentId: string;
  softwareName: string;
  initialUninstallString: string;
}>();

defineEmits(useDialogPluginComponent.emits);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();
const { isLoading } = agentSoftwareStore;

const uninstallString = ref(props.initialUninstallString);
const runAsUser = ref(false);
const timeout = ref(1800);

async function uninstall() {
  try {
    await agentSoftwareStore.uninstallAgentSoftware(props.agentId, {
      name: props.softwareName,
      command: uninstallString.value,
      run_as_user: runAsUser.value,
      timeout: timeout.value,
    });

    onDialogOK();
  } catch {
    //
  }
}
</script>
