<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        Reset Password
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
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
          <q-btn v-close-popup label="Cancel" />
          <q-btn color="primary" label="Reset" :disable="!pass || pass !== pass2" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useUserStore } from "src/stores/api";

const { resetUserPassword } = useUserStore();

const pass = ref("");
const pass2 = ref("");
const hidePassword = ref(true);

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

async function submit() {
  try {
    await resetUserPassword(pass.value);
    onDialogOK();
  } catch {
    // do nothing
  }
}
</script>
