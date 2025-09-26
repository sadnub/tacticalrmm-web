<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        Edit Alert Template assigned to {{ type }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form ref="form" @submit.prevent="submit">
        <q-card-section v-if="options.length > 0">
          <q-select
            v-model="selectedTemplate"
            :options="options"
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
          <q-btn v-if="options.length > 0" flat label="Submit" color="primary" type="submit" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { alertTemplateStore } from "src/stores/api";
import { capitalize } from "src/utils/format";
import { notifySuccess } from "src/utils/notify";

type AlertAssignType = "site" | "client" | "policy";

const props = defineProps<{ object: any; type: AlertAssignType }>();
defineEmits(["hide", "ok", "cancel", ...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();

const form = ref();
const selectedTemplate = ref<number | null>(null);
const options = ref<{ label: string; value: number }[]>([]);

function submit() {
  if (props.object.alert_template === selectedTemplate.value) {
    hide();
    return;
  }

  $q.loading.show();

  let url = "";
  let data: Record<string, unknown> = {};
  if (props.type === "client") {
    url = `/clients/${props.object.id}/`;
    data = { client: { id: props.object.id, alert_template: selectedTemplate.value } };
  } else if (props.type === "site") {
    url = `/clients/sites/${props.object.id}/`;
    data = { site: { id: props.object.id, alert_template: selectedTemplate.value } };
  } else if (props.type === "policy") {
    url = `/automation/policies/${props.object.id}/`;
    data = { id: props.object.id, alert_template: selectedTemplate.value };
  }

  const text = selectedTemplate.value ? "assigned" : "removed";
  axios
    .put(url, data)
    .then(() => {
      $q.loading.hide();
      onDialogOK();
      notifySuccess(`Alert Template ${text} successfully!`);
    })
    .catch(() => {
      $q.loading.hide();
    });
}

function getAlertTemplates() {
  alertTemplateStore.getAlertTemplates();
  options.value = alertTemplateStore.alertTemplates.map((template) => ({
    label: template.name,
    value: template.id,
  }));
}

function show() {
  (dialogRef as any).value.show();
}
function hide() {
  (dialogRef as any).value.hide();
}

onMounted(() => {
  getAlertTemplates();
  selectedTemplate.value = props.object.alert_template ?? null;
});
</script>
