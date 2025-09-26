<template>
  <q-dialog ref="dialog" @hide="onHide">
    <div class="q-dialog-plugin" style="width: 90vw; max-width: 90vw">
      <q-card>
        <q-bar>
          <q-btn
            ref="refresh"
            class="q-mr-sm"
            dense
            flat
            push
            icon="refresh"
            @click="refresh"
          />Alerts Manager
          <q-space />
          <q-btn v-close-popup dense flat icon="close" />
        </q-bar>
        <div class="q-pa-sm" style="min-height: 65vh; max-height: 65vh">
          <div class="q-gutter-sm">
            <q-btn
              ref="new"
              label="New"
              dense
              flat
              push
              unelevated
              no-caps
              icon="add"
              @click="showAddTemplateModal"
            />
          </div>
          <q-table
            v-model:pagination="pagination"
            dense
            :rows="templates"
            :columns="columns"
            row-key="id"
            binary-state-sort
            hide-pagination
            virtual-scroll
            :rows-per-page-options="[0]"
            no-data-label="No Alert Templates"
          >
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
                :class="rowSelectedClass(props.row.id, selectedTemplate)"
                @click="selectedTemplate = props.row"
                @contextmenu="selectedTemplate = props.row"
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
                <!-- enabled checkbox -->
                <q-td>
                  <q-checkbox
                    v-model="props.row.is_active"
                    dense
                    @update:model-value="toggleEnabled(props.row)"
                  />
                </q-td>
                <!-- agent settings -->
                <q-td>
                  <q-icon v-if="props.row.agent_settings" color="primary" name="done" size="sm">
                    <q-tooltip>Alert template has agent alert settings</q-tooltip>
                  </q-icon>
                </q-td>
                <!-- text settings -->
                <q-td>
                  <q-icon v-if="props.row.check_settings" color="primary" name="done" size="sm">
                    <q-tooltip>Alert template has check alert settings</q-tooltip>
                  </q-icon>
                </q-td>
                <!-- dashboard settings -->
                <q-td>
                  <q-icon v-if="props.row.task_settings" color="primary" name="done" size="sm">
                    <q-tooltip>Alert template has task alert settings</q-tooltip>
                  </q-icon>
                </q-td>
                <!-- name -->
                <q-td
                  >{{ props.row.name }}
                  <q-chip
                    v-if="props.row.default_template"
                    color="primary"
                    text-color="white"
                    size="sm"
                    >Default</q-chip
                  >
                </q-td>
                <!-- applied to -->
                <q-td>
                  <span
                    style="cursor: pointer; text-decoration: underline"
                    class="text-primary"
                    @click="showTemplateApplied(props.row)"
                    >Show where template is applied ({{ props.row.applied_count }})</span
                  ></q-td
                >
                <!-- alert exclusions -->
                <q-td>
                  <span
                    style="cursor: pointer; text-decoration: underline"
                    class="text-primary"
                    @click="showAlertExclusions(props.row)"
                    >Alert Exclusions ({{
                      props.row.excluded_agents.length +
                      props.row.excluded_clients.length +
                      props.row.excluded_sites.length
                    }})</span
                  ></q-td
                >
                <!-- failure action -->
                <q-td>{{ props.row.action_name }}</q-td>
                <!-- resolve action -->
                <q-td>{{ props.row.resolved_action_name }}</q-td>
              </q-tr>
            </template>
          </q-table>
        </div>
      </q-card>
    </div>
  </q-dialog>
</template>

<script lang="ts" setup>
import { reactive, ref, computed } from "vue";
import { useQuasar, useDialogPluginComponent } from "quasar";
import { alertTemplateStore } from "src/stores/api";
import { useDashboardStore } from "src/stores/dashboard";
import AlertTemplateForm from "src/core/alerts/components/AlertTemplateForm.vue";
import AlertExclusions from "src/core/alerts/components/AlertExclusions.vue";
import AlertTemplateRelated from "src/core/alerts/components/AlertTemplateRelated.vue";

// emits
defineEmits(["hide", "ok", "cancel", ...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide } = useDialogPluginComponent();
const $q = useQuasar();

// stores
const dashboardStore = useDashboardStore();

// state
const selectedTemplate = ref<any | null>(null);
const templates = computed(() => alertTemplateStore.alertTemplates);

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

const pagination = reactive({ rowsPerPage: 0, sortBy: "name", descending: true });

function getTemplates() {
  alertTemplateStore.getAlertTemplates();
}

function clearRow() {
  selectedTemplate.value = null;
}

function refresh() {
  dashboardStore.refreshDashboard();
  getTemplates();
  clearRow();
}

function deleteTemplate(template: any) {
  $q.dialog({
    title: `Delete alert template ${template.name}?`,
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(async () => {
    try {
      await alertTemplateStore.removeAlertTemplate(template.id);
      refresh();
    } catch {
      // Error handling is done in the store
    }
  });
}

function showEditTemplateModal(template: any) {
  $q.dialog({
    component: AlertTemplateForm,
    componentProps: { alertTemplate: template },
  }).onOk(() => {
    refresh();
  });
}

function showAddTemplateModal() {
  clearRow();
  $q.dialog({ component: AlertTemplateForm }).onOk(() => {
    refresh();
  });
}

function showAlertExclusions(template: any) {
  $q.dialog({
    component: AlertExclusions,
    componentProps: { template },
  }).onOk(() => {
    refresh();
  });
}

function showTemplateApplied(template: any) {
  $q.dialog({ component: AlertTemplateRelated, componentProps: { template } });
}

function toggleEnabled(template: any) {
  const text = !template.is_active
    ? "Template enabled successfully"
    : "Template disabled successfully";

  const updatedTemplate = { ...template, is_active: !template.is_active };

  alertTemplateStore.updateAlertTemplate(template.id, updatedTemplate).then(() => {
    $q.notify({ type: "positive", message: text });
    dashboardStore.refreshDashboard();
  });
}

function rowSelectedClass(id: number, currentSelected: any) {
  if (currentSelected && currentSelected.id === id)
    return $q.dark.isActive ? "highlight-dark" : "highlight";
}

function show() {
  (dialogRef as any).value.show();
}
function hide() {
  (dialogRef as any).value.hide();
}

// init
getTemplates();
</script>
