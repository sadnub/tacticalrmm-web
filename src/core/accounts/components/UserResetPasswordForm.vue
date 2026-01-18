<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card style="width: 60vw">
      <q-bar>
        {{ user.username }} Password Reset
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form ref="form" @submit="onSubmit">
        <q-card-section class="row">
          <div class="col-2">New Password:</div>
          <div class="col-10">
            <q-input
              v-model="password"
              filled
              dense
              :type="hidePassword ? 'password' : 'text'"
              :rules="[(val) => !!val || '*Required']"
            >
              <template #append>
                <q-icon
                  :name="hidePassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="hidePassword = !hidePassword"
                />
              </template>
            </q-input>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup label="Cancel" />
          <q-btn label="Reset" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useDialogPluginComponent } from "quasar";

import { useUserStore } from "src/stores/api";

const userStore = useUserStore();
import type { User } from "../types";

const props = defineProps<{
  user: User;
}>();

defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup stores

const hidePassword = ref(true);

const password = ref("");

async function onSubmit() {
  try {
    await userStore.adminPasswordReset(props.user.id, password.value);
    onDialogOK();
  } catch {
    // do nothing
  }
}
</script>
