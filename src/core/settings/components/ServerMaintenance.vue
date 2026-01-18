<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card style="min-width: 400px">
      <q-bar>
        Server Maintenace
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-card-section>
          <q-select
            v-model="state.action"
            :rules="[(val: number) => !!val || '*Required']"
            filled
            options-dense
            label="Actions"
            :options="actions"
            emit-value
            map-options
            dense
            @update:model-value="clear"
          />
        </q-card-section>

        <q-card-section v-if="state.action === 'prune_db'">
          <q-checkbox v-model="state.prune_tables" val="audit_logs" label="Audit Log">
            <q-tooltip>Removes agent check results</q-tooltip>
          </q-checkbox>
          <q-checkbox v-model="state.prune_tables" val="pending_actions" label="Pending Actions">
            <q-tooltip>Removes completed pending actions</q-tooltip>
          </q-checkbox>
          <q-checkbox v-model="state.prune_tables" val="alerts" label="Alerts">
            <q-tooltip>Removes all alerts</q-tooltip>
          </q-checkbox>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn label="Submit" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useCoreStore } from "src/stores/api";

const coreStore = useCoreStore();

const actions = [
  {
    label: "Reload Nats Configuration",
    value: "reload_nats",
  },
  {
    label: "Remove Orphaned Tasks",
    value: "rm_orphaned_tasks",
  },
  {
    label: "Prune DB Tables",
    value: "prune_db",
  },
];

// setup quasar plugins
defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const state = reactive({
  action: null,
  prune_tables: [],
});

function clear() {
  state.prune_tables = [];
}

async function submit() {
  try {
    await coreStore.runServerMaintenace(state);
    onDialogOK();
  } catch {
    //
  }
}
</script>
