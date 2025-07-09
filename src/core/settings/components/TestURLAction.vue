<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 80vw">
      <q-bar>
        Testing {{ urlAction.name }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>

      <q-form @sbumit.prevent="submit">
        <q-card-section>
          <q-option-group v-model="runAgainst" :options="runAgainstOptions" inline dense />
        </q-card-section>

        <q-card-section v-if="runAgainst === 'agent'">
          <tactical-dropdown
            v-model="state.run_instance_id"
            :options="agentOptions"
            label="Agents"
            map-options
            filterable
            dense
            filled
          />
        </q-card-section>

        <q-card-section v-else-if="runAgainst === 'site'">
          <tactical-dropdown
            v-model="state.run_instance_id"
            :options="siteOptions"
            label="Sites"
            map-options
            filterable
            dense
            filled
          />
        </q-card-section>

        <q-card-section v-else-if="runAgainst === 'client'">
          <tactical-dropdown
            v-model="state.run_instance_id"
            :options="clientOptions"
            label="Client"
            map-options
            filterable
            dense
            filled
          />
        </q-card-section>

        <q-card-section style="height: 60vh" class="scroll">
          <div>
            URL:
            <code>{{ result.url }}</code>
          </div>
          <br />
          <div>
            Body
            <q-separator />
            <code>{{ result.request }}</code>
          </div>
          <br />
          <div>
            Response
            <q-separator />
            <code>{{ result.result }}</code>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Close" />
          <q-btn :loading="loading" flat label="Run" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// composition imports
import { ref, reactive } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useAgentDropdown } from "src/core/agents/composables";
import { useSiteDropdown, useClientDropdown } from "src/core/clients/composables";
import { runTestURLAction } from "../api";

// type imports
import type { URLAction } from "src/types/core/urlactions";

// define emits
defineEmits([...useDialogPluginComponent.emits]);

// define props
const props = defineProps<{ urlAction: URLAction }>();

// setup quasar
const { dialogRef, onDialogHide } = useDialogPluginComponent();

// setup dropdowns
const { agentOptions } = useAgentDropdown();
const { clientOptions } = useClientDropdown();
const { siteOptions } = useSiteDropdown();

const runAgainst = ref<"agent" | "site" | "client" | "none">("none");

const runAgainstOptions = [
  { label: "Agent", value: "agent" },
  { label: "Site", value: "site" },
  { label: "Client", value: "client" },
  { label: "None", value: "none" },
];

const state = reactive({
  pattern: props.urlAction.pattern,
  rest_body: props.urlAction.rest_body,
  rest_headers: props.urlAction.rest_headers,
  rest_method: props.urlAction.rest_method,
  run_instance_type: runAgainst,
  run_instance_id: null as string | number | null,
});

const loading = ref(false);

const result = reactive({
  url: "",
  result: "",
  request: "",
});

async function submit() {
  loading.value = true;
  try {
    const r = await runTestURLAction(state);

    result.result = r.result;
    result.url = r.url;
    result.request = r.body;
  } catch {
    //
  } finally {
    loading.value = false;
  }
}
</script>
