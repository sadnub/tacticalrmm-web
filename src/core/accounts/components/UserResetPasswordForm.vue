<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="width: 60vw">
      <q-form ref="form" @submit="onSubmit">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ user.username }} Password Reset</div>
          <q-space />
          <q-btn v-close-popup icon="close" flat round dense />
        </q-card-section>
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
        <q-card-section class="row items-center">
          <q-btn label="Reset" color="primary" type="submit" />
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { until } from "@vueuse/shared";
import { useDialogPluginComponent } from "quasar";

import { useUserStore } from "../api";
import type { User } from "../types";

const props = defineProps<{
  user: User;
}>();

defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup stores
const userStore = useUserStore();

const hidePassword = ref(true);

const password = ref("");

async function onSubmit() {
  userStore.adminPasswordReset(props.user.id, password.value);

  // stops the dialog from closing when there is an error
  await until(() => userStore.isLoading).toBe(false);
  if (userStore.isError) return;

  onDialogOK();
}
</script>
