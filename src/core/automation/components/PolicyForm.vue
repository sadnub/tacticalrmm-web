<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ policy ? "Edit Policy" : "Add Policy" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit="submit">
        <q-card-section v-if="copyPolicy">
          <div class="text-subtitle1">
            You are copying checks and tasks from Policy:
            <b>{{ copyPolicy.name }}</b> into a new policy.
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-2">Name:</div>
          <div class="col-10">
            <q-input
              v-model="localPolicy.name"
              filled
              dense
              :rules="[(val) => !!val || '*Required']"
            />
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-2">Description:</div>
          <div class="col-10">
            <q-input v-model="localPolicy.desc" filled dense />
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-2">Active:</div>
          <div class="col-10">
            <q-toggle v-model="localPolicy.active" color="green" />
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-2">Enforced:</div>
          <div class="col-10">
            <q-toggle v-model="localPolicy.enforced" color="green" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup dense flat label="Cancel" />
          <q-btn flat label="Submit" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { useDialogPluginComponent, extend } from "quasar";
import { usePolicyStore } from "src/stores/api";

const { updatePolicy, addPolicy } = usePolicyStore();
import type { Policy } from "src/core/automation/types";

const props = defineProps<{
  policy?: Policy;
  copyPolicy?: Policy;
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// state - initialize inline with extend
const localPolicy = reactive<Policy>(
  props.policy
    ? extend(true, {}, props.policy)
    : {
        id: 0,
        name: "",
        desc: "",
        enforced: false,
        active: false,
        alert_template: null,
        excluded_sites: [],
        excluded_clients: [],
        excluded_agents: [],
      },
);

async function submit() {
  try {
    if (props.policy) {
      await updatePolicy(localPolicy.id, localPolicy);
    } else {
      await addPolicy(localPolicy, props.copyPolicy?.id);
    }
    onDialogOK();
  } catch {
    //
  }
}
</script>
