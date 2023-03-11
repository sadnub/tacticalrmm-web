<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 500px">
      <q-bar>
        New Integration
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <div class="q-pa-sm q-gutter-sm">
        <q-input v-model="state.name" label="Name" filled dense />

        <q-input v-model="state.desc" label="Description" filled dense />

        <q-input v-model="state.install_url" label="Install URL" filled dense />
      </div>
      <q-card-actions align="right">
        <q-btn v-close-popup dense flat label="Cancel" />
        <q-btn
          :loading="isLoading"
          dense
          flat
          label="Save"
          color="primary"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// composition imports
import { reactive } from "vue";
import { useDialogPluginComponent, extend } from "quasar";
import { useSharedIntegrationsApi } from "@/api/core_ts";
import { until } from "@vueuse/shared";

// type imports
import { type Integration } from "@/types/core";

// props
const props = defineProps<{ integration?: Integration }>();

// emits
defineEmits([...useDialogPluginComponent.emits]);

// quasar dialog setup
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// new data query logic
const state: Integration = props.integration
  ? reactive(extend({}, props.integration))
  : reactive({
      id: 0,
      name: "",
      desc: "",
      install_url: "",
      installed: false,
      enabled: false,
    });

const { isLoading, isError, addIntegration, editIntegration } =
  useSharedIntegrationsApi;

async function submit() {
  props.integration ? editIntegration(state.id, state) : addIntegration(state);

  await until(isLoading).not.toBeTruthy();
  if (isError.value) return;

  onDialogOK();
}
</script>
