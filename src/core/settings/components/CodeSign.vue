<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="min-width: 65vh">
      <q-bar>
        Code Signing
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section class="row">
        <q-btn
          :disable="!token"
          label="Code sign all agents"
          color="positive"
          class="full-width"
          :loading="codeSignStore.isLoading"
          @click="codeSignStore.codeSignAgents"
        >
          <q-tooltip>Force all existing agents to be updated to the code-signed version</q-tooltip>
          <template #loading>
            <q-spinner-facebook />
          </template>
        </q-btn>
      </q-card-section>
      <q-form @submit.prevent="codeSignStore.updateToken(token)">
        <q-card-section class="row">
          <div class="col-2">Token:</div>
          <div class="col-1"></div>
          <q-input
            v-model="token"
            filled
            dense
            class="col-9 q-pa-none"
            :rules="[(val) => !!val || 'Token is required']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="Save" color="primary" type="submit" />
          <q-space />
          <q-btn label="Delete" color="negative" @click="confirmDelete" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { useCodeSignStore } from "../api";

// setup quasar plugins
defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

// setup stores
const codeSignStore = useCodeSignStore();

const token = ref("");

function confirmDelete() {
  $q.dialog({
    title: "Delete token?",
    cancel: true,
    persistent: true,
  }).onOk(() => {
    codeSignStore.removeToken();
  });
}

onMounted(codeSignStore.getToken);
</script>
