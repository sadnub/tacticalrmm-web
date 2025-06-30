<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 85vh">
      <q-form ref="form" @submit="onSubmit">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ user ? "Edit User" : "Add User" }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="row">
          <div class="col-2">Username:</div>
          <div class="col-10">
            <q-input
              filled
              dense
              v-model="localUser.username"
              :rules="[(val) => !!val || '*Required']"
              class="q-pa-none"
            />
          </div>
        </q-card-section>
        <q-card-section class="row" v-if="!user">
          <div class="col-2">Password:</div>
          <div class="col-10">
            <q-input
              filled
              dense
              v-model="localUser.password"
              :type="hidePassword ? 'password' : 'text'"
              :rules="[(val) => !!val || '*Required']"
              class="q-pa-none"
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
        <q-card-section class="row">
          <div class="col-2">Email:</div>
          <div class="col-10">
            <q-input
              filled
              dense
              v-model="localUser.email"
              :rules="[(val) => isValidEmail(val) || 'Invalid email']"
              class="q-pa-none"
            />
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-2">First Name:</div>
          <div class="col-10">
            <q-input filled dense v-model="localUser.first_name" />
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-2">Last Name:</div>
          <div class="col-10">
            <q-input filled dense v-model="localUser.last_name" />
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-2">Active:</div>
          <div class="col-10">
            <q-checkbox v-model="localUser.is_active" :disable="isLoggedInUser" />
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-2">Role:</div>
          <template v-if="roleOptions.length === 0"
            ><span
              >No roles have been created. Create some from Settings > Permissions Manager</span
            ></template
          >
          <template v-else
            ><q-select
              map-options
              emit-value
              filled
              dense
              options-dense
              v-model="localUser.role"
              :options="roleOptions"
              class="col-10"
          /></template>
        </q-card-section>
        <q-card-section>
          <q-checkbox
            label="Deny Dashboard Logins"
            left-label
            v-model="localUser.block_dashboard_login"
            :disable="isLoggedInUser"
          />
        </q-card-section>
        <q-card-section class="row items-center">
          <q-btn :disable="!disableSave" label="Save" color="primary" type="submit" />
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useAuthStore } from "src/stores/auth";
import { useUserStore } from "../api";
import { useRoleDropdown } from "../composables";
import { isValidEmail } from "src/utils/validation";
import { until } from "@vueuse/shared";

// types
import type { User } from "../types";

const props = defineProps<{
  user?: User;
}>();

defineEmits(useDialogPluginComponent.emits);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup stores
const auth = useAuthStore();
const userStore = useUserStore();

const loggedInUser = computed(() => auth.username);

const { roleOptions } = useRoleDropdown();

const hidePassword = ref(true);

const localUser = reactive<User>({
  id: props.user ? props.user.id : 0,
  is_active: props.user ? props.user.is_active : true,
  username: props.user ? props.user.username : "",
  email: props.user ? props.user.email : "",
  first_name: props.user ? props.user.first_name : "",
  last_name: props.user ? props.user.last_name : "",
  password: "",
  block_dashboard_login: false,
});

const isLoggedInUser = computed(() => props.user && localUser.username === loggedInUser.value);

const disableSave = computed(() => {
  if (props.user) {
    return localUser.username;
  } else {
    return localUser.username && localUser.password;
  }
});

async function onSubmit() {
  if (props.user) {
    // dont allow updating is_active if username is same as logged in user
    if (isLoggedInUser.value) {
      localUser.is_active = true;
      localUser.block_dashboard_login = false;
    }

    userStore.updateUser(localUser.id, localUser);
  } else {
    userStore.addUser(localUser);
  }

  // stops the dialog from closing when there is an error
  await until(() => userStore.isLoading).toBe(false);
  if (userStore.isError) return;

  onDialogOK();
}
</script>
