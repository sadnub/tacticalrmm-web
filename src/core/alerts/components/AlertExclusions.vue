<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 50vw; max-width: 50vw">
      <q-bar>
        Alert Exclusions for {{ template.name }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-card-section>
          <tactical-dropdown
            v-model="localTemplate.excluded_clients"
            label="Excluded Clients"
            filled
            multiple
            :options="clientOptions"
            use-chips
            map-options
            filterable
          />
        </q-card-section>
        <q-card-section>
          <tactical-dropdown
            v-model="localTemplate.excluded_sites"
            label="Excluded Sites"
            filled
            multiple
            :options="siteOptions"
            use-chips
            map-options
            filterable
          />
        </q-card-section>
        <q-card-section>
          <tactical-dropdown
            v-model="localTemplate.excluded_agents"
            label="Excluded Agents"
            filled
            multiple
            :options="agentOptions"
            use-chips
            map-options
            filterable
          />
        </q-card-section>

        <q-card-section>
          <q-checkbox v-model="localTemplate.exclude_workstations" label="Exclude Workstations" />
          <q-checkbox v-model="localTemplate.exclude_servers" label="Exclude Servers" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup dense flat label="Cancel" />
          <q-btn dense flat label="Save" color="primary" type="submit" :loading="isLoading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { useDialogPluginComponent, extend } from "quasar";
import { useClientDropdown } from "src/core/clients/composables";
import { useSiteDropdown } from "src/core/clients/composables";
import { useAgentDropdown } from "src/core/agents/composables";
import { useAlertTemplateStore } from "src/stores/api";

const { isLoading, updateAlertTemplate } = useAlertTemplateStore();
import type { AlertTemplate } from "src/core/alerts/types";

const props = defineProps<{ template: AlertTemplate }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// Dropdown options from composables
const { clientOptions } = useClientDropdown();
const { siteOptions } = useSiteDropdown();
const { agentOptions } = useAgentDropdown();

const localTemplate = reactive<AlertTemplate>(extend(true, {}, props.template));

async function submit() {
  try {
    await updateAlertTemplate(props.template.id, localTemplate);
    onDialogOK();
  } catch {
    //
  }
}
</script>
