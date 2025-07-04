<!--
Copyright (c) 2023-present Amidaware Inc.
This file is subject to the EE License Agreement.
For details, see: https://license.tacticalrmm.com/ee
-->

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 35vw; max-width: 35vw">
      <q-bar>
        {{ props.provider ? "Edit OIDC Provider" : "Add OIDC Provider" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <!-- name -->
      <q-card-section>
        <q-input
          v-model="localProvider.name"
          :readonly="!!props.provider"
          :disable="!!props.provider"
          label="Provider Name"
          filled
          dense
          :rules="[
            (val) => !!val || '*Required',
            (val) =>
              /^[a-zA-Z0-9_-]+$/.test(val) ||
              'Only letters, numbers, hyphens, and underscores are allowed',
          ]"
          hint="A unique identifier for the SSO provider. Avoid spaces and special characters, as this will be part of the callback URL."
        />
      </q-card-section>

      <!-- url -->
      <q-card-section>
        <q-input
          v-model="localProvider.server_url"
          label="Issuer URL"
          filled
          dense
          :rules="[(val) => !!val || '*Required']"
          hint="The OpenID Connect Issuer URL provided by the SSO provider. This is typically the base URL where the provider hosts their OIDC configuration."
        />
      </q-card-section>

      <!-- client id -->
      <q-card-section>
        <q-input
          v-model="localProvider.client_id"
          label="Client ID"
          filled
          dense
          :rules="[(val) => !!val || '*Required']"
        />
      </q-card-section>

      <!-- secret -->
      <q-card-section>
        <q-input
          v-model="localProvider.secret"
          filled
          :type="hideSecret ? 'password' : 'text'"
          label="Secret"
          dense
          :rules="[(val) => !!val || '*Required']"
        >
          <template #append>
            <q-icon
              :name="hideSecret ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="hideSecret = !hideSecret"
            />
          </template>
        </q-input>
      </q-card-section>

      <q-card-section>
        <tactical-dropdown
          v-model="localProvider.role"
          label="Default User Role"
          :options="roleOptions"
          filled
          dense
          clearable
          map-options
          hint="The role assigned to users upon first sign-in through this provider."
        />
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
import { ref, reactive } from "vue";
import { useDialogPluginComponent, extend } from "quasar";
import { editSSOProvider, addSSOProvider } from "src/ee/sso/api/sso";
import { notifySuccess } from "src/utils/notify";
import { useRoleDropdown } from "src/core/accounts/composables";

// types
import type { SSOProvider } from "src/ee/sso/types/sso";

// define emits
defineEmits([...useDialogPluginComponent.emits]);

// define props
const props = defineProps<{ provider?: SSOProvider }>();

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const loading = ref(false);

const { roleOptions } = useRoleDropdown();

const hideSecret = ref(true);
const localProvider = props.provider
  ? reactive<SSOProvider>(extend({}, props.provider))
  : reactive<SSOProvider>({
      id: 0,
      name: "",
      client_id: "",
      secret: "",
      server_url: "",
      role: null,
    } as SSOProvider);

async function submit() {
  loading.value = true;

  try {
    if (props.provider) await editSSOProvider(localProvider.id, localProvider);
    else await addSSOProvider(localProvider);
    onDialogOK();
    notifySuccess("SSO Provider was edited!");
  } catch {
    /* empty */
  }

  loading.value = false;
}
</script>
