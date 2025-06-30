<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-card-section class="row">
        <div class="col-3">New password:</div>
        <div class="col-9">
          <q-input
            v-model="pass"
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
        <div class="col-3">Confirm password:</div>
        <div class="col-9">
          <q-input
            v-model="pass2"
            filled
            dense
            :type="hidePassword ? 'password' : 'text'"
            :rules="[(val) => val === pass || 'Passwords do not match']"
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
        <q-btn color="primary" label="Reset" :disable="!pass || pass !== pass2" @click="onSubmit" />
        <q-btn color="negative" label="Cancel" @click="onDialogCancel" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { until } from "@vueuse/shared";
import { useDialogPluginComponent } from "quasar";
import { useUserStore } from "../api";

// setup stores
const userStore = useUserStore();

const pass = ref("");
const pass2 = ref("");
const hidePassword = ref(true);

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

async function onSubmit() {
  userStore.resetUserPassword(pass.value);

  // stops the dialog from closing when there is an error
  await until(userStore.isLoading).not.toBeTruthy();
  if (userStore.isError) return;

  onDialogOK();
}
</script>
