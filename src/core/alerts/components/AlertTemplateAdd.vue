<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        Edit Alert Template assigned to {{ type }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-card-section v-if="alertTemplateOptions.length > 0">
          <q-select
            v-model="selectedTemplate"
            :options="alertTemplateOptions"
            filled
            dense
            clearable
            emit-value
            map-options
            :label="capitalize(type) + ' Alert Template'"
          >
          </q-select>
        </q-card-section>
        <q-card-section v-else>
          No Alert Templates have been setup. Go to Settings > Alerts Manager
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup dense flat label="Cancel" />
          <q-btn
            v-if="alertTemplateOptions.length > 0"
            flat
            label="Submit"
            color="primary"
            type="submit"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useClientStore, useSiteStore, usePolicyStore } from "src/stores/api";

const { updateClient } = useClientStore();
const { updateSite } = useSiteStore();
const { updatePolicy } = usePolicyStore();
import { useAlertTemplateDropdown } from "src/core/alerts/composables";
import { capitalize } from "src/utils/format";

type AlertAssignType = "site" | "client" | "policy";

const props = defineProps<{
  object: {
    id: number;
    alert_template?: number | null;
  };
  type: AlertAssignType;
}>();
defineEmits(["hide", "ok", "cancel", ...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// Use alert template dropdown composable
const { alertTemplateOptions } = useAlertTemplateDropdown();

const selectedTemplate = ref<number | null>(null);

async function submit() {
  if (props.object.alert_template === selectedTemplate.value || !selectedTemplate.value) {
    onDialogOK();
    return;
  }

  try {
    const payload = { alert_template: selectedTemplate.value };
    if (props.type === "client") {
      await updateClient(props.object.id, payload);
    } else if (props.type === "site") {
      await updateSite(props.object.id, payload);
    } else if (props.type === "policy") {
      await updatePolicy(props.object.id, payload);
    }
    onDialogOK();
  } catch {
    // Error handling is done in the store
  }
}

onMounted(() => {
  selectedTemplate.value = props.object.alert_template ?? null;
});
</script>
