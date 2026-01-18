<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card style="min-width: 30vw" class="q-dialog-plugin">
      <q-bar>
        {{ user ? "Edit User" : "Add User" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="onSubmit">
        <q-card-section class="row">
          <div class="col-3">Username:</div>
          <div class="col-9">
            <q-input
              v-model="localUser.username"
              filled
              dense
              :rules="[(val) => !!val || '*Required']"
              class="q-pa-none"
            />
          </div>
        </q-card-section>
        <q-card-section v-if="!user" class="row">
          <div class="col-3">Password:</div>
          <div class="col-9">
            <q-input
              v-model="localUser.password"
              filled
              dense
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
          <div class="col-3">Email:</div>
          <div class="col-9">
            <q-input
              v-model="localUser.email"
              filled
              dense
              :rules="[(val) => isValidEmail(val) || 'Invalid email']"
              class="q-pa-none"
            />
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-3">First Name:</div>
          <div class="col-9">
            <q-input v-model="localUser.first_name" filled dense />
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-3">Last Name:</div>
          <div class="col-9">
            <q-input v-model="localUser.last_name" filled dense />
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-3">Active:</div>
          <div class="col-9">
            <q-checkbox v-model="localUser.is_active" :disable="isLoggedInUser" />
          </div>
        </q-card-section>
        <q-card-section class="row">
          <div class="col-3">Role:</div>
          <template v-if="roleOptions.length === 0"
            ><span
              >No roles have been created. Create some from Settings > Permissions Manager</span
            ></template
          >
          <template v-else
            ><q-select
              v-model="localUser.role"
              map-options
              emit-value
              filled
              dense
              options-dense
              :options="roleOptions"
              class="col-9"
          /></template>
        </q-card-section>
        <q-card-section>
          <q-checkbox
            v-model="localUser.block_dashboard_login"
            label="Deny Dashboard Logins"
            left-label
            :disable="isLoggedInUser"
          />
        </q-card-section>
        <q-card-actions align="right" class="row items-center">
          <q-btn v-close-popup label="Cancel" />
          <q-btn label="Save" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useAuthStore, useUserStore } from "src/stores/api";

const userStore = useUserStore();
import { useRoleDropdown } from "../composables";
import { isValidEmail } from "src/utils/validation";

// types
import type { User } from "../types";

const props = defineProps<{
  user?: User;
}>();

defineEmits(useDialogPluginComponent.emits);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup stores
const { username } = useAuthStore();

const loggedInUser = computed(() => username.value);

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

async function onSubmit() {
  try {
    if (props.user) {
      // dont allow updating is_active if username is same as logged in user
      if (isLoggedInUser.value) {
        localUser.is_active = true;
        localUser.block_dashboard_login = false;
      }

      await userStore.updateUser(localUser.id, localUser);
    } else {
      await userStore.addUser(localUser);
    }
  } catch {
    // do nothing
  } finally {
    onDialogOK();
  }
}
</script>
