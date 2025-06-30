<!--
Copyright (c) 2023-present Amidaware Inc.
This file is subject to the EE License Agreement.
For details, see: https://license.tacticalrmm.com/ee
-->

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 50">
      <q-bar>
        SSO Settings
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <!-- disable sso-->
      <q-card-section>
        <q-checkbox v-model="ssoSettings.sso_enabled" dense label="Enable SSO" />
      </q-card-section>

      <!-- block local user logon -->
      <q-card-section>
        <q-checkbox
          v-model="ssoSettings.block_local_user_logon"
          dense
          label="Block Local User Login"
          :disable="!ssoSettings.sso_enabled"
          hint="When enabled, only users with SSO accounts can log in, with the exception of local superuser accounts."
        >
          <q-tooltip class="text-caption"
            >When enabled, only users with SSO accounts can log in, with the exception of local
            superuser accounts.</q-tooltip
          >
        </q-checkbox>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-close-popup flat label="Cancel" />
        <q-btn flat label="Submit" color="primary" :loading="loading" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// composition imports
import { ref, watch, onMounted } from "vue";
import { useDialogPluginComponent } from "quasar";
import { notifySuccess, notifyWarning } from "src/utils/notify";
import { fetchSSOSettings, updateSSOSettings } from "src/ee/sso/api/sso";

// types
import type { SSOSettingsType } from "../types/sso";
import axios from "axios";

// define emits
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const ssoSettings = ref({} as SSOSettingsType);
const loading = ref(false);

async function getSSOSettings() {
  loading.value = true;
  try {
    ssoSettings.value = await fetchSSOSettings();
  } catch (e) {
    console.error(e);
  }
  loading.value = false;
}

async function submit() {
  loading.value = true;
  try {
    await updateSSOSettings(ssoSettings.value);
    notifySuccess("Settings updated successfully");
    onDialogOK(ssoSettings.value);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response?.status === 423) {
        notifyWarning(e.response.data, 7000);
      }
    }
  }
  loading.value = false;
}

onMounted(async () => {
  await getSSOSettings();
  // watcher to disable block local login if sso is disabled
  watch(
    () => ssoSettings.value.sso_enabled,
    (newValue) => {
      if (!newValue) {
        ssoSettings.value.block_local_user_logon = false;
      }
    },
  );
});
</script>
