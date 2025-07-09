<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
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
          <q-btn flat label="Submit" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useGlobalKeyStore } from "../api";

// type imports
import type { GlobalKey } from "../types";

const props = defineProps<{ globalKey: GlobalKey }>();

// setup quasar plugins
defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup stores
const keyStore = useGlobalKeyStore();

const isPwd = ref(true);

const localKey = reactive<GlobalKey>(
  props.globalKey ? Object.assign({}, props.globalKey) : { id: 0, name: "", value: "" },
);

function submit() {
  if (props.globalKey) keyStore.updateKey(localKey.id, localKey);
  else keyStore.addKey(localKey);

  onDialogOK();
}
</script>
