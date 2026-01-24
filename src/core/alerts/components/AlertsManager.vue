<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <div class="q-dialog-plugin" style="width: 90vw; max-width: 90vw">
      <q-card>
        <q-bar>
          <q-btn
            class="q-mr-sm"
            dense
            flat
            push
            icon="refresh"
            @click="getAlertTemplates({ force: true })"
          />Alerts Manager
          <q-space />
          <q-btn v-close-popup dense flat icon="close" />
        </q-bar>
          <tactical-table
            v-model:pagination="pagination"
            dense
            :rows="templates"
            :columns="columns"
            style="min-height: 65vh; max-height: 65vh"
            row-key="id"
            binary-state-sort
            column-select
            virtual-scroll
            :filter="search"
            :rows-per-page-options="[0]"
            no-data-label="No Alert Templates"
            storage-key="alerts-manager"
          >
            <template #top>
              <q-btn
              label="New"
              dense
              flat
              push
              unelevated
              no-caps
              icon="add"
              @click="showAddTemplateModal"
            />
              <q-space />
              <q-input v-model="search" filled label="Search" dense clearable class="q-pr-sm" style="width: 300px">
                <template #prepend>
                  <q-icon name="search" />
                </template>
              </q-input>
              <tactical-table-export />
            </template>

            <!-- header slots -->
            <template #header-cell-is_active="props">
              <q-th :props="props" auto-width>
                <q-icon name="power_settings_new" size="1.5em">
                  <q-tooltip>Enable Template</q-tooltip>
                </q-icon>
              </q-th>
            </template>
            <template #header-cell-agent_settings="props">
              <q-th :props="props" auto-width>
                <q-icon name="devices" size="1.5em">
                  <q-tooltip>Has agent alert settings</q-tooltip>
                </q-icon>
              </q-th>
            </template>
            <template #header-cell-check_settings="props">
              <q-th :props="props" auto-width>
                <q-icon name="fas fa-check-double" size="1.5em">
                  <q-tooltip>Has check alert settings</q-tooltip>
                </q-icon>
              </q-th>
            </template>
            <template #header-cell-task_settings="props">
              <q-th :props="props" auto-width>
                <q-icon name="fas fa-tasks" size="1.5em">
                  <q-tooltip>Has task alert settings</q-tooltip>
                </q-icon>
              </q-th>
            </template>
            <!-- body slots -->
            <template #body="props">
              <q-tr
                :props="props"
                class="cursor-pointer"
                @dblclick="showEditTemplateModal(props.row)"
              >
                <!-- context menu -->
                <q-menu context-menu>
                  <q-list dense style="min-width: 200px">
                    <q-item v-close-popup clickable @click="showEditTemplateModal(props.row)">
                      <q-item-section side>
                        <q-icon name="edit" />
                      </q-item-section>
                      <q-item-section>Edit</q-item-section>
                    </q-item>
                    <q-item v-close-popup clickable @click="deleteTemplate(props.row)">
                      <q-item-section side>
                        <q-icon name="delete" />
                      </q-item-section>
                      <q-item-section>Delete</q-item-section>
                    </q-item>

                    <q-separator></q-separator>

                    <q-item v-close-popup clickable @click="showAlertExclusions(props.row)">
                      <q-item-section side>
                        <q-icon name="rule" />
                      </q-item-section>
                      <q-item-section>Alert Exclusions</q-item-section>
                    </q-item>

                    <q-separator></q-separator>

                    <q-item v-close-popup clickable>
                      <q-item-section>Close</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
                <q-td v-for="col in props.cols" :key="col.name" :props="props">
                  <!-- is_active -->
                  <template v-if="col.name === 'is_active'">
                    <q-checkbox
                      v-model="props.row.is_active"
                      dense
                      @update:model-value="(val) => toggleEnabled(props.row, val)"
                    />
                  </template>

                  <!-- agent_settings -->
                  <template v-else-if="col.name === 'agent_settings'">
                    <q-icon v-if="props.row.agent_settings" color="primary" name="done" size="sm">
                      <q-tooltip>Alert template has agent alert settings</q-tooltip>
                    </q-icon>
                  </template>

                  <!-- check_settings -->
                  <template v-else-if="col.name === 'check_settings'">
                    <q-icon v-if="props.row.check_settings" color="primary" name="done" size="sm">
                      <q-tooltip>Alert template has check alert settings</q-tooltip>
                    </q-icon>
                  </template>

                  <!-- task_settings -->
                  <template v-else-if="col.name === 'task_settings'">
                    <q-icon v-if="props.row.task_settings" color="primary" name="done" size="sm">
                      <q-tooltip>Alert template has task alert settings</q-tooltip>
                    </q-icon>
                  </template>

                  <!-- name -->
                  <template v-else-if="col.name === 'name'">
                    {{ props.row.name }}
                    <q-chip
                      v-if="props.row.default_template"
                      color="primary"
                      text-color="white"
                      size="sm"
                      >Default</q-chip
                    >
                  </template>

                  <!-- applied_to -->
                  <template v-else-if="col.name === 'applied_to'">
                    <span class="text-primary" @click="showTemplateApplied(props.row)"
                      >Show where template is applied ({{ props.row.applied_count }})</span
                    >
                  </template>

                  <!-- alert_exclusions -->
                  <template v-else-if="col.name === 'alert_exclusions'">
                    <span class="text-primary" @click="showAlertExclusions(props.row)"
                      >Alert Exclusions ({{
                        props.row.excluded_agents.length +
                        props.row.excluded_clients.length +
                        props.row.excluded_sites.length
                      }})</span
                    >
                  </template>

                  <!-- action_name -->
                  <template v-else-if="col.name === 'action_name'">
                    {{ props.row.action_name }}
                  </template>

                  <!-- resolved_action_name -->
                  <template v-else-if="col.name === 'resolved_action_name'">
                    {{ props.row.resolved_action_name }}
                  </template>

                  <!-- default fallback -->
                  <template v-else>
                    {{ col.value }}
                  </template>
                </q-td>
              </q-tr>
            </template>
          </tactical-table>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { useAlertTemplateStore, useDashboardStore } from "src/stores/api";

const { alertTemplates: templates, getAlertTemplates, removeAlertTemplate, updateAlertTemplate } = useAlertTemplateStore();
const { refreshDashboard } = useDashboardStore();
import AlertTemplateForm from "src/core/alerts/components/AlertTemplateForm.vue";
import AlertExclusions from "src/core/alerts/components/AlertExclusions.vue";
import AlertTemplateRelated from "src/core/alerts/components/AlertTemplateRelated.vue";
import type { AlertTemplate } from "src/core/alerts/types";

// emits
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();


const columns = [
  { name: "is_active", label: "Active", field: "is_active", align: "left" },
  { name: "agent_settings", label: "Agent Settings", field: "agent_settings" },
  { name: "check_settings", label: "Check Settings", field: "check_settings" },
  { name: "task_settings", label: "Task Settings", field: "task_settings" },
  { name: "name", label: "Name", field: "name", align: "left" },
  { name: "applied_to", label: "Applied To", field: "applied_to", align: "left" },
  { name: "alert_exclusions", label: "Alert Exclusions", field: "alert_exclusions", align: "left" },
  { name: "action_name", label: "Failure Action", field: "action_name", align: "left" },
  {
    name: "resolved_action_name",
    label: "Resolved Action",
    field: "resolved_action_name",
    align: "left",
  },
];

const pagination = ref({ rowsPerPage: 0, sortBy: "name", descending: true });

const search = ref("");

function deleteTemplate(template: AlertTemplate) {
  $q.dialog({
    title: `Delete alert template ${template.name}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    void removeAlertTemplate(template.id);
  });
}

function showEditTemplateModal(template: AlertTemplate) {
  $q.dialog({
    component: AlertTemplateForm,
    componentProps: { alertTemplate: template },
  });
}

function showAddTemplateModal() {
  $q.dialog({ component: AlertTemplateForm });
}

function showAlertExclusions(template: AlertTemplate) {
  $q.dialog({
    component: AlertExclusions,
    componentProps: { template },
  });
}

function showTemplateApplied(template: AlertTemplate) {
  $q.dialog({ component: AlertTemplateRelated, componentProps: { template } });
}

async function toggleEnabled(template: AlertTemplate, newValue: boolean) {
  const updatedTemplate = { ...template, is_active: newValue };

  try {
    await updateAlertTemplate(template.id, updatedTemplate);
    refreshDashboard();
  } catch {
    // Error handling is done in the store
  }
}

onMounted(() => {
  getAlertTemplates();
});
</script>
