<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="width: 90vw; max-width: 90vw">
      <q-bar>
        {{ alertTemplate ? "Edit Alert Template" : "Add Alert Template" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-stepper
          ref="stepper"
          v-model="step"
          alternative-labels
          header-nav
          color="primary"
          animated
        >
          <q-step
            :name="1"
            :error="!template.name && step > 1"
            title="General Settings"
            icon="settings"
          >
            <q-card flat>
              <q-card-section>
                <q-input
                  v-model="template.name"
                  label="Name"
                  class="q-mb-none"
                  filled
                  dense
                  :rules="[(val) => !!val || '*Required']"
                />
              </q-card-section>

              <q-card-section>
                <q-toggle v-model="template.is_active" color="green" label="Enabled" left-label />
              </q-card-section>

              <div class="q-pl-md text-subtitle1">
                Email Settings (Overrides global email settings)
              </div>

              <q-card-section>
                <q-input
                  v-model="template.email_from"
                  label="Email From address"
                  class="q-mb-sm"
                  filled
                  dense
                />
              </q-card-section>

              <q-card-section class="row">
                <div class="col-2 q-mb-sm">Email recipients</div>
                <div class="col-4 q-mb-sm">
                  <q-list v-if="template.email_recipients.length !== 0" dense>
                    <q-item v-for="email in template.email_recipients" :key="email" dense>
                      <q-item-section>
                        <q-item-label>{{ email }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-icon
                          class="cursor-pointer"
                          name="delete"
                          color="red"
                          @click="removeEmail(email)"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <q-list v-else>
                    <q-item-section>
                      <q-item-label>No recipients</q-item-label>
                    </q-item-section>
                  </q-list>
                </div>
                <div class="col-3 q-mb-sm"></div>
                <div class="col-3 q-mb-sm">
                  <q-btn
                    size="sm"
                    icon="fas fa-plus"
                    color="secondary"
                    label="Add email"
                    @click="toggleAddEmail"
                  />
                </div>
              </q-card-section>

              <div class="q-pl-md text-subtitle1">SMS Settings (Overrides global SMS settings)</div>

              <q-card-section class="row">
                <div class="col-2 q-mb-sm">SMS recipients</div>
                <div class="col-4 q-mb-md">
                  <q-list v-if="template.text_recipients.length !== 0" dense>
                    <q-item v-for="num in template.text_recipients" :key="num" dense>
                      <q-item-section>
                        <q-item-label>{{ num }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-icon
                          class="cursor-pointer"
                          name="delete"
                          color="red"
                          @click="removeSMSNumber(num)"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <q-list v-else>
                    <q-item-section>
                      <q-item-label>No recipients</q-item-label>
                    </q-item-section>
                  </q-list>
                </div>
                <div class="col-3 q-mb-sm"></div>
                <div class="col-3 q-mb-sm">
                  <q-btn
                    class="cursor-pointer"
                    size="sm"
                    icon="fas fa-plus"
                    color="secondary"
                    label="Add sms number"
                    @click="toggleAddSMSNumber"
                  />
                </div>
              </q-card-section>
            </q-card>
          </q-step>

          <q-step :name="2" title="Alert Actions" icon="warning">
            <q-card flat>
              <div class="q-pl-md text-subtitle1">
                <span style="text-decoration: underline; cursor: help"
                  >Alert Failure Settings
                  <q-tooltip> The selected action will run when an alert is triggered. </q-tooltip>
                </span>
              </div>

              <q-card-section>
                <q-option-group
                  v-model="template.action_type"
                  class="q-pb-sm"
                  :options="actionTypeOptions"
                  dense
                  inline
                />

                <tactical-dropdown
                  v-if="template.action_type == 'script'"
                  v-model="template.action"
                  class="q-mb-sm"
                  label="Failure script"
                  filled
                  clearable
                  :options="scriptOptions"
                  map-options
                  filterable
                  :rules="[(val: number) => !!val || '*Required']"
                />

                <tactical-dropdown
                  v-else-if="template.action_type == 'server'"
                  v-model="template.action"
                  class="q-mb-sm"
                  label="Failure script"
                  filled
                  clearable
                  :options="serverScriptOptions"
                  map-options
                  filterable
                />

                <tactical-dropdown
                  v-else
                  v-model="template.action_rest"
                  class="q-mb-sm"
                  label="Failure Web Hook"
                  filled
                  clearable
                  :options="restActionOptions"
                  map-options
                  filterable
                />

                <q-select
                  v-if="template.action_type !== 'rest'"
                  v-model="template.action_args"
                  class="q-mb-sm"
                  dense
                  label="Failure script arguments (press Enter after typing each argument)"
                  filled
                  use-input
                  use-chips
                  multiple
                  hide-dropdown-icon
                  input-debounce="0"
                  new-value-mode="add"
                />

                <q-select
                  v-if="template.action_type !== 'rest'"
                  v-model="template.action_env_vars"
                  class="q-mb-sm"
                  dense
                  label="Failure script environment vars (press Enter after typing each key=value pair)"
                  filled
                  use-input
                  use-chips
                  multiple
                  hide-dropdown-icon
                  input-debounce="0"
                  new-value-mode="add"
                />

                <q-input
                  v-if="template.action_type !== 'rest'"
                  v-model.number="template.action_timeout"
                  class="q-mb-sm"
                  label="Failure script timeout (seconds)"
                  filled
                  type="number"
                  dense
                  :rules="[(val) => !!val || 'Failure script timeout is required']"
                />
              </q-card-section>

              <div class="q-pl-md text-subtitle1">
                <span style="text-decoration: underline; cursor: help"
                  >Alert Resolved Settings
                  <q-tooltip> The selected action will run when an alert is resolved. </q-tooltip>
                </span>
              </div>

              <q-card-section>
                <q-option-group
                  v-model="template.resolved_action_type"
                  class="q-pb-sm"
                  :options="actionTypeOptions"
                  dense
                  inline
                />

                <tactical-dropdown
                  v-if="template.resolved_action_type === 'script'"
                  v-model="template.resolved_action"
                  class="q-mb-sm"
                  label="Resolved Script"
                  filled
                  clearable
                  :options="scriptOptions"
                  map-options
                  filterable
                />

                <tactical-dropdown
                  v-else-if="template.resolved_action_type === 'server'"
                  v-model="template.resolved_action"
                  class="q-mb-sm"
                  label="Resolved Script"
                  filled
                  clearable
                  :options="serverScriptOptions"
                  map-options
                  filterable
                />

                <tactical-dropdown
                  v-else
                  v-model="template.resolved_action_rest"
                  class="q-mb-sm"
                  label="Resolved Web Hook"
                  filled
                  clearable
                  :options="restActionOptions"
                  map-options
                  filterable
                />

                <q-select
                  v-if="template.resolved_action_type !== 'rest'"
                  v-model="template.resolved_action_args"
                  class="q-mb-sm"
                  dense
                  label="Resolved script arguments (press Enter after typing each argument)"
                  filled
                  use-input
                  use-chips
                  multiple
                  hide-dropdown-icon
                  input-debounce="0"
                  new-value-mode="add"
                />

                <q-select
                  v-if="template.resolved_action_type !== 'rest'"
                  v-model="template.resolved_action_env_vars"
                  class="q-mb-sm"
                  dense
                  label="Resolved action environment vars (press Enter after typing each key=value pair)"
                  filled
                  use-input
                  use-chips
                  multiple
                  hide-dropdown-icon
                  input-debounce="0"
                  new-value-mode="add"
                />

                <q-input
                  v-if="template.resolved_action_type !== 'rest'"
                  v-model.number="template.resolved_action_timeout"
                  class="q-mb-sm"
                  label="Resolved script timeout (seconds)"
                  filled
                  type="number"
                  dense
                  :rules="[(val) => !!val || 'Resolved script timeout is required']"
                />
              </q-card-section>

              <div class="q-pl-md text-subtitle1">
                <span style="text-decoration: underline; cursor: help"
                  >Run actions only on
                  <q-tooltip>
                    The selected action will only run on the following types of alerts
                  </q-tooltip>
                </span>
              </div>

              <q-card-section>
                <q-toggle
                  v-model="template.agent_script_actions"
                  label="Agents"
                  color="green"
                  left-label
                />

                <q-toggle
                  v-model="template.check_script_actions"
                  label="Checks"
                  color="green"
                  left-label
                />

                <q-toggle
                  v-model="template.task_script_actions"
                  label="Tasks"
                  color="green"
                  left-label
                />
              </q-card-section>
            </q-card>
          </q-step>

          <q-step :name="3" title="Agent Overdue Settings" icon="devices">
            <q-card flat>
              <div class="q-pl-md text-subtitle1">
                <span style="text-decoration: underline; cursor: help"
                  >Alert Failure Settings
                  <q-tooltip>
                    Select what notifications should be sent when an agent is overdue. Enabled will
                    override the agent notification settings and always notify. Not configured will
                    use what notification settings are configured on the agent. Disabled will
                    override the agent notification settings and never notify.
                  </q-tooltip>
                </span>
              </div>
              <q-card-section>
                <q-toggle
                  v-model="template.agent_always_email"
                  label="Email"
                  color="green"
                  left-label
                  toggle-indeterminate
                />
                <q-toggle
                  v-model="template.agent_always_text"
                  label="Text"
                  color="green"
                  left-label
                  toggle-indeterminate
                />
                <q-toggle
                  v-model="template.agent_always_alert"
                  label="Dashboard"
                  color="green"
                  left-label
                  toggle-indeterminate
                />
              </q-card-section>
              <q-card-section>
                <q-input
                  v-model.number="template.agent_periodic_alert_days"
                  label="Alert again if not resolved after (days)"
                  filled
                  type="number"
                  dense
                  :rules="[(val) => val >= 0 || 'Periodic days must be 0 or greater']"
                />
              </q-card-section>

              <div class="q-pl-md text-subtitle1">
                <span style="text-decoration: underline; cursor: help"
                  >Alert Resolved Settings
                  <q-tooltip>
                    Select what notifications should be sent when an overdue agent is back online.
                  </q-tooltip>
                </span>
              </div>
              <q-card-section>
                <q-toggle
                  v-model="template.agent_email_on_resolved"
                  label="Email"
                  color="green"
                  left-label
                />
                <q-toggle
                  v-model="template.agent_text_on_resolved"
                  label="Text"
                  color="green"
                  left-label
                />
              </q-card-section>
            </q-card>
          </q-step>

          <q-step :name="4" title="Check Settings" icon="fas fa-check-double">
            <q-card flat>
              <div class="q-pl-md text-subtitle1">
                <span style="text-decoration: underline; cursor: help"
                  >Alert Failure Settings
                  <q-tooltip>
                    Select what notifications are sent when a check fails. Enabled will override the
                    check notification settings and always notify. Not configured will use the
                    notification settings configured on the check. Disabled will override the check
                    notification settings and never notify.
                  </q-tooltip>
                </span>
              </div>

              <q-card-section>
                <q-toggle
                  v-model="template.check_always_email"
                  label="Email"
                  color="green"
                  left-label
                  toggle-indeterminate
                />
                <q-toggle
                  v-model="template.check_always_text"
                  label="Text"
                  color="green"
                  left-label
                  toggle-indeterminate
                />
                <q-toggle
                  v-model="template.check_always_alert"
                  label="Dashboard"
                  color="green"
                  left-label
                  toggle-indeterminate
                />
              </q-card-section>

              <q-card-section>
                <q-select
                  v-model="template.check_email_alert_severity"
                  label="Only email on alert severity"
                  hint="Defaults to 'error' and 'warning'"
                  filled
                  dense
                  options-dense
                  multiple
                  use-chips
                  emit-value
                  map-options
                  :options="severityOptions"
                />
              </q-card-section>

              <q-card-section>
                <q-select
                  v-model="template.check_text_alert_severity"
                  label="Only text on alert severity"
                  hint="Defaults to 'error' and 'warning'"
                  filled
                  dense
                  options-dense
                  multiple
                  use-chips
                  emit-value
                  map-options
                  :options="severityOptions"
                />
              </q-card-section>

              <q-card-section>
                <q-select
                  v-model="template.check_dashboard_alert_severity"
                  label="Only show dashboard alert on severity"
                  hint="Defaults to 'error', 'warning', and 'info'"
                  filled
                  dense
                  options-dense
                  multiple
                  use-chips
                  emit-value
                  map-options
                  :options="severityOptions"
                />
              </q-card-section>

              <q-card-section>
                <q-input
                  v-model.number="template.check_periodic_alert_days"
                  label="Alert again if not resolved after (days)"
                  filled
                  type="number"
                  dense
                  :rules="[(val) => val >= 0 || 'Periodic days must be 0 or greater']"
                />
              </q-card-section>

              <div class="q-pl-md text-subtitle1">
                <span style="text-decoration: underline; cursor: help"
                  >Alert Resolved Settings
                  <q-tooltip>
                    Select what notifications are sent when a failed check is resolved.
                  </q-tooltip>
                </span>
              </div>
              <q-card-section>
                <q-toggle
                  v-model="template.check_email_on_resolved"
                  label="Email"
                  color="green"
                  left-label
                />
                <q-toggle
                  v-model="template.check_text_on_resolved"
                  label="Text"
                  color="green"
                  left-label
                />
              </q-card-section>
            </q-card>
          </q-step>

          <q-step :name="5" title="Automated Task Settings" icon="fas fa-tasks">
            <q-card flat>
              <div class="q-pl-md text-subtitle1">
                <span style="text-decoration: underline; cursor: help"
                  >Alert Failure Settings
                  <q-tooltip>
                    Select what notifications are sent when an automated task fails. Enabled will
                    override the task notification settings and always notify. Not configured will
                    use the notification settings configured on the task. Disabled will override the
                    task notification settings and never notify.
                  </q-tooltip>
                </span>
              </div>

              <q-card-section>
                <q-toggle
                  v-model="template.task_always_email"
                  label="Email"
                  color="green"
                  left-label
                  toggle-indeterminate
                />
                <q-toggle
                  v-model="template.task_always_text"
                  label="Text"
                  color="green"
                  left-label
                  toggle-indeterminate
                />
                <q-toggle
                  v-model="template.task_always_alert"
                  label="Dashboard"
                  color="green"
                  left-label
                  toggle-indeterminate
                />
              </q-card-section>

              <q-card-section>
                <q-select
                  v-model="template.task_email_alert_severity"
                  label="Only email on alert severity"
                  hint="Defaults to 'error' and 'warning'"
                  filled
                  dense
                  options-dense
                  multiple
                  use-chips
                  emit-value
                  map-options
                  :options="severityOptions"
                />
              </q-card-section>

              <q-card-section>
                <q-select
                  v-model="template.task_text_alert_severity"
                  label="Only text on alert severity"
                  hint="Defaults to 'error' and 'warning'"
                  filled
                  dense
                  options-dense
                  multiple
                  use-chips
                  emit-value
                  map-options
                  :options="severityOptions"
                />
              </q-card-section>

              <q-card-section>
                <q-select
                  v-model="template.task_dashboard_alert_severity"
                  label="Only show dashboard alert on severity"
                  hint="Defaults to 'error', 'warning', and 'info'"
                  filled
                  dense
                  options-dense
                  multiple
                  use-chips
                  emit-value
                  map-options
                  :options="severityOptions"
                />
              </q-card-section>

              <q-card-section>
                <q-input
                  v-model.number="template.task_periodic_alert_days"
                  label="Alert again if not resolved (days)"
                  filled
                  type="number"
                  dense
                  :rules="[(val) => val >= 0 || 'Periodic days must be 0 or greater']"
                />
              </q-card-section>

              <div class="q-pl-md text-subtitle1">
                <span style="text-decoration: underline; cursor: help"
                  >Alert Resolved Settings
                  <q-tooltip>
                    Select what notifications are sent when a failed task is resolved.
                  </q-tooltip>
                </span>
              </div>
              <q-card-section>
                <q-toggle
                  v-model="template.task_email_on_resolved"
                  label="Email"
                  color="green"
                  left-label
                />
                <q-toggle
                  v-model="template.task_text_on_resolved"
                  label="Text"
                  color="green"
                  left-label
                />
              </q-card-section>
            </q-card>
          </q-step>
          <template #navigation>
            <q-stepper-navigation class="row">
              <q-btn
                v-if="step > 1"
                flat
                color="primary"
                label="Back"
                class="q-mr-xs"
                @click="stepper?.previous()"
              />
              <q-btn v-if="step < 5" color="primary" label="Next" @click="stepper?.next()" />
              <q-space />
              <q-btn
                color="primary"
                label="Submit"
                :loading="templateStore.isLoading"
                type="submit"
              />
            </q-stepper-navigation>
          </template>
        </q-stepper>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from "vue";
import { useQuasar, useDialogPluginComponent, type QStepper } from "quasar";
import { until } from "@vueuse/shared";
import { useDashboardStore } from "src/stores/dashboard";
import { useAlertTemplateStore } from "../api";
import { useScriptDropdown } from "src/core/scripts/composables";
import { useURLActionDropdown } from "src/core/settings/composables";
import { isValidEmail } from "src/utils/validation";

// types
import type { AlertTemplate, AlertSeverity } from "src/core/alerts/types";

// setup stores
const dashboardStore = useDashboardStore();
const templateStore = useAlertTemplateStore();

const hosted = computed(() => dashboardStore.dashboardSettings.hosted);
const server_scripts_enabled = computed(
  () => dashboardStore.dashboardSettings.serverScriptsEnabled,
);

// props
const props = defineProps<{
  alertTemplate?: AlertTemplate;
}>();

// emits
defineEmits([...useDialogPluginComponent.emits]);

// setup quasar plugins
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();

const step = ref(1);

// setup script dropdowns
const { serverScriptOptions, scriptOptions, getScriptById } = useScriptDropdown();

// setup custom field dropdown
const { restActionOptions } = useURLActionDropdown();

// alert template form logic
const template = props.alertTemplate
  ? reactive<AlertTemplate>(Object.assign({}, props.alertTemplate))
  : reactive<AlertTemplate>({
      id: 0,
      name: "",
      is_active: true,
      action_type: "script",
      action: null,
      action_rest: null,
      action_args: [],
      action_env_vars: [],
      action_timeout: 30,
      resolved_action_type: "script",
      resolved_action: null,
      resolved_action_rest: null,
      resolved_action_args: [],
      resolved_action_env_vars: [],
      resolved_action_timeout: 30,
      email_recipients: [] as string[],
      email_from: "",
      text_recipients: [] as string[],
      agent_email_on_resolved: false,
      agent_text_on_resolved: false,
      agent_always_email: null,
      agent_always_text: null,
      agent_always_alert: null,
      agent_periodic_alert_days: 0,
      agent_script_actions: true,
      check_email_alert_severity: [] as AlertSeverity[],
      check_text_alert_severity: [] as AlertSeverity[],
      check_dashboard_alert_severity: [] as AlertSeverity[],
      check_email_on_resolved: false,
      check_text_on_resolved: false,
      check_always_email: null,
      check_always_text: null,
      check_always_alert: null,
      check_periodic_alert_days: 0,
      check_script_actions: true,
      task_email_alert_severity: [] as AlertSeverity[],
      task_text_alert_severity: [] as AlertSeverity[],
      task_dashboard_alert_severity: [] as AlertSeverity[],
      task_email_on_resolved: false,
      task_text_on_resolved: false,
      task_always_email: null,
      task_always_text: null,
      task_always_alert: null,
      task_periodic_alert_days: 0,
      task_script_actions: true,
      exclude_workstations: null,
      exclude_servers: null,
    });

// reset selected script if action type is changed
watch(
  () => template.action_type,
  () => {
    template.action_rest = null;
    template.action = null;
    template.action_args = [];
    template.action_env_vars = [];
    template.action_timeout = 30;
  },
);

watch(
  () => template.resolved_action_type,
  () => {
    template.resolved_action_rest = null;
    template.resolved_action = null;
    template.resolved_action_args = [];
    template.resolved_action_env_vars = [];
    template.resolved_action_timeout = 30;
  },
);

watch(
  () => template.action,
  (newValue) => {
    if (newValue) {
      const script = getScriptById(newValue);

      if (script) {
        template.action_timeout = script.default_timeout;
        template.action_args = script.args;
        template.action_env_vars = script.env_vars;
      }
    } else {
      template.action_timeout = 30;
      template.action_args = [];
      template.action_env_vars = [];
    }
  },
  { immediate: true },
);

watch(
  () => template.resolved_action,
  (newValue) => {
    if (newValue) {
      const script = getScriptById(newValue);

      if (script) {
        template.resolved_action_timeout = script.default_timeout;
        template.resolved_action_args = script.args;
        template.resolved_action_env_vars = script.env_vars;
      }
    } else {
      template.resolved_action_timeout = 30;
      template.resolved_action_args = [];
      template.resolved_action_env_vars = [];
    }
  },
  { immediate: true },
);

const severityOptions = [
  { label: "Error", value: "error" },
  { label: "Warning", value: "warning" },
  { label: "Informational", value: "info" },
];

const staticActionTypeOptions = [
  { label: "Send a Web Hook", value: "rest" },
  { label: "Run script on Agent", value: "script" },
  { label: "Run script on TRMM Server", value: "server" },
];

const actionTypeOptions = computed(() => {
  // don't show for hosted at all
  if (hosted.value) {
    return staticActionTypeOptions.filter((option) => option.value !== "server");
  }
  // disable the server script radio button if feature is disabled globally
  const modifiedOptions = staticActionTypeOptions.map((option) => {
    if (!server_scripts_enabled.value && option.value === "server") {
      return { ...option, disable: true };
    }
    return option;
  });

  return modifiedOptions;
});

const stepper = ref<QStepper | null>(null);
function toggleAddEmail() {
  $q.dialog({
    title: "Add email",
    prompt: {
      model: "",
      isValid: (val) => isValidEmail(val),
      type: "email",
    },
    cancel: true,
    ok: { label: "Add", color: "primary" },
    persistent: false,
  }).onOk((data) => {
    template.email_recipients.push(data);
  });
}

function toggleAddSMSNumber() {
  $q.dialog({
    title: "Add number",
    message:
      "Use E.164 format: must have the <b>+</b> symbol and <span class='text-red'>country code</span>, followed by the <span class='text-green'>phone number</span> e.g. <b>+<span class='text-red'>1</span><span class='text-green'>2131231234</span></b>",
    prompt: {
      model: "",
    },
    html: true,
    cancel: true,
    ok: { label: "Add", color: "primary" },
    persistent: false,
  }).onOk((data: string) => {
    template.text_recipients.push(data);
  });
}

function removeEmail(email: string) {
  const removed = template.email_recipients.filter((k) => k !== email);
  template.email_recipients = removed;
}

function removeSMSNumber(num: string) {
  const removed = template.text_recipients.filter((k) => k !== num);
  template.text_recipients = removed;
}

async function submit() {
  if (props.alertTemplate) templateStore.updateAlertTemplate(template.id, template);
  else templateStore.addAlertTemplate(template);

  await until(() => templateStore.isLoading).toBe(false);
  if (templateStore.isError) return;

  onDialogOK();
}
</script>
