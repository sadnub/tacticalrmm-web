<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ props.globalKey ? "Edit Global Key" : "Add Global Key" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit="submit">
        <!-- name -->
        <q-card-section>
          <q-input
            v-model="localKey.name"
            label="Name"
            filled
            dense
            :rules="[(val: string) => !!val || '*Required']"
          />
        </q-card-section>

        <!-- value -->
        <q-card-section>
          <q-input
            v-model="localKey.value"
            label="Value"
            filled
            dense
            :type="isPwd ? 'password' : 'text'"
            :rules="[(val: string) => !!val || '*Required']"
            ><template #append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn flat label="Submit" color="primary" type="submit" :loading="isLoading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useGlobalKeyStore } from "src/stores/api";

const { isLoading, updateKey, addKey } = useGlobalKeyStore();

// type imports
import type { GlobalKey } from "../types";

const props = defineProps<{ globalKey?: GlobalKey }>();

// setup quasar plugins
defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const isPwd = ref(true);

const localKey = reactive<GlobalKey>(
  props.globalKey ? Object.assign({}, props.globalKey) : { id: 0, name: "", value: "" },
);

async function submit() {
  try {
    if (props.globalKey) await updateKey(localKey.id, localKey);
    else await addKey(localKey);
    onDialogOK();
  } catch {
    //
  }
}
</script>
