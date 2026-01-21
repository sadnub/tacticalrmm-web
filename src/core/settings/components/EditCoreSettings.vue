<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card style="min-width: 60vw">
      <q-inner-loading
        :showing="!coreSettings"
        label="Loading Settings..."
        label-class="text-teal"
        label-style="font-size: 1.1em"
      />
      <q-splitter v-if="coreSettings" v-model="splitterModel">
        <template #before>
          <q-tabs v-model="tab" dense vertical class="text-primary">
            <q-tab name="general" label="General" />
            <q-tab name="emailalerts" label="Email Alerts" />
            <q-tab name="smsalerts" label="SMS Alerts" />
            <q-tab name="meshcentral" label="MeshCentral" />
            <q-tab name="customfields" label="Custom Fields" />
            <q-tab name="keystore" label="Key Store" />
            <q-tab name="urlactions" label="URL Actions" />
            <q-tab name="webhooks" label="Web Hooks" />
            <q-tab name="retention" label="Retention" />
            <q-tab name="apikeys" label="API Keys" />
            <q-tab name="sso" label="Single Sign-On (SSO)" />
          </q-tabs>
        </template>
        <template #after>
          <q-form @submit.prevent="submit">
            <q-card-section class="row items-center">
              <div class="text-h6">Global Settings</div>
              <q-space />
              <q-btn v-close-popup icon="close" flat round dense />
            </q-card-section>
            <q-scroll-area :thumb-style="thumbStyle" style="height: 60vh">
              <q-tab-panels
                v-model="tab"
                animated
                transition-prev="jump-up"
                transition-next="jump-up"
              >
                <!-- general -->
                <q-tab-panel name="general">
                  <div class="text-subtitle2">General</div>
                  <q-separator />
                  <q-card-section class="row">
                    <q-checkbox
                      v-model="coreSettings.agent_auto_update"
                      label="Enable agent automatic self update"
                    >
                      <q-tooltip> Runs at 35mins past every hour </q-tooltip>
                    </q-checkbox>
                  </q-card-section>
                  <q-card-section v-if="!hosted" class="row">
                    <q-checkbox
                      v-model="coreSettings.enable_server_scripts"
                      label="Enable server side scripts"
                    >
                      <q-tooltip
                        >Allow running scripts on TRMM server for alert failure/resolve
                        actions</q-tooltip
                      >
                    </q-checkbox>
                    <q-btn
                      size="sm"
                      round
                      dense
                      flat
                      icon="warning"
                      @click="
                        openURL(
                          'https://docs.tacticalrmm.com/functions/permissions/#permissions-with-extra-security-implications',
                        )
                      "
                    >
                    </q-btn>
                  </q-card-section>
                  <q-card-section v-if="!hosted" class="row">
                    <q-checkbox
                      v-model="coreSettings.enable_server_webterminal"
                      label="Enable web terminal"
                    >
                      <q-tooltip>Enable the web terminal</q-tooltip>
                    </q-checkbox>
                    <q-btn
                      size="sm"
                      roundenable_server_webterminal
                      dense
                      flat
                      icon="warning"
                      @click="
                        openURL(
                          'https://docs.tacticalrmm.com/functions/permissions/#permissions-with-extra-security-implications',
                        )
                      "
                    >
                    </q-btn>
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">Default agent timezone:</div>
                    <div class="col-2"></div>
                    <tactical-dropdown
                      v-model="coreSettings.default_time_zone"
                      filterable
                      filled
                      dense
                      options-dense
                      :options="dashboardSettings.timezoneOptions"
                      class="col-6"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">Default date format:</div>
                    <div class="col-2"></div>
                    <q-input v-model="coreSettings.date_format" filled dense class="col-6">
                      <template #after>
                        <q-btn
                          round
                          dense
                          flat
                          size="sm"
                          icon="info"
                          @click="
                            openURL('https://quasar.dev/quasar-utils/date-utils#format-for-display')
                          "
                        >
                          <q-tooltip>Click to see formatting options</q-tooltip>
                        </q-btn>
                      </template>
                    </q-input>
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">Default server policy:</div>
                    <div class="col-2"></div>
                    <tactical-dropdown
                      v-model="coreSettings.server_policy"
                      clearable
                      map-options
                      filled
                      dense
                      options-dense
                      :options="policyOptions"
                      class="col-6"
                      filterable
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">Default workstation policy:</div>
                    <div class="col-2"></div>
                    <tactical-dropdown
                      v-model="coreSettings.workstation_policy"
                      clearable
                      map-options
                      filled
                      dense
                      options-dense
                      :options="policyOptions"
                      class="col-6"
                      filterable
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">Default alert template:</div>
                    <div class="col-2"></div>
                    <q-select
                      v-model="coreSettings.alert_template"
                      clearable
                      map-options
                      emit-value
                      filled
                      dense
                      options-dense
                      :options="alertTemplateOptions"
                      class="col-6"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4 flex items-center">Receive notifications on:</div>
                    <div class="col-2"></div>
                    <q-checkbox
                      v-model="coreSettings.notify_on_info_alerts"
                      dense
                      class="col-3"
                      label="Informational Alerts"
                    />
                    <q-checkbox
                      v-model="coreSettings.notify_on_warning_alerts"
                      dense
                      class="col-3"
                      label="Warning Alerts"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">Agent Debug Level:</div>
                    <div class="col-2"></div>
                    <q-select
                      v-model="coreSettings.agent_debug_level"
                      emit-value
                      map-options
                      filled
                      dense
                      options-dense
                      :options="logLevelOptions"
                      class="col-6"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">
                      Clear faults on agents that haven't checked in after (days):
                    </div>
                    <div class="col-2"></div>
                    <q-input
                      v-model.number="coreSettings.clear_faults_days"
                      hint="Setting this value to 0 disables this feature"
                      filled
                      dense
                      class="col-6"
                      :rules="[(val: number) => val >= 0 || 'Minimum is 0']"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">Reset Patch Policy on Agents:</div>
                    <div class="col-2"></div>
                    <q-btn color="negative" label="Reset" @click="showResetPatchPolicy" />
                  </q-card-section>
                </q-tab-panel>
                <!-- email alerts -->
                <q-tab-panel name="emailalerts">
                  <div class="text-subtitle2 row">
                    <div>Email Alert Routing</div>
                    <q-space />
                    <div>
                      <q-btn
                        size="sm"
                        color="grey-5"
                        icon="fas fa-plus"
                        text-color="black"
                        label="Add emails"
                        @click="toggleAddEmail"
                      />
                    </div>
                  </div>
                  <q-separator />
                  <q-card-section class="row">
                    <div class="col-3">Recipients</div>
                    <div class="col-4"></div>
                    <div class="col-5">
                      <q-list v-if="coreSettings.email_alert_recipients.length !== 0" dense>
                        <q-item
                          v-for="emailAddress in coreSettings.email_alert_recipients"
                          :key="emailAddress"
                          v-ripple
                          clickable
                          @click="removeEmail(emailAddress)"
                        >
                          <q-item-section>
                            <q-item-label>{{ emailAddress }}</q-item-label>
                          </q-item-section>
                          <q-item-section side>
                            <q-icon name="delete" color="red" />
                          </q-item-section>
                        </q-item>
                      </q-list>
                      <q-list v-else>
                        <q-item-section>
                          <q-item-label>No recipients</q-item-label>
                        </q-item-section>
                      </q-list>
                    </div>
                  </q-card-section>
                  <!-- smtp -->
                  <div class="text-subtitle2">SMTP Settings</div>
                  <q-separator />
                  <q-card-section class="row">
                    <div class="col-2">From email:</div>
                    <div class="col-4"></div>
                    <q-input
                      v-model="coreSettings.smtp_from_email"
                      filled
                      dense
                      class="col-6 q-pa-none"
                      :rules="[(val: string) => isValidEmail(val) || 'Invalid email']"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-2">From name:</div>
                    <div class="col-4"></div>
                    <q-input
                      v-model="coreSettings.smtp_from_name"
                      filled
                      dense
                      class="col-6 q-pa-none"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-2">Host:</div>
                    <div class="col-4"></div>
                    <q-input
                      v-model="coreSettings.smtp_host"
                      filled
                      dense
                      class="col-6 q-pa-none"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-2">Port:</div>
                    <div class="col-4"></div>
                    <q-input
                      v-model.number="coreSettings.smtp_port"
                      dense
                      type="number"
                      filled
                      class="q-pa-none"
                      :rules="[(val: number) => (val > 0 && val <= 65535) || 'Invalid Port']"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <q-checkbox
                      v-model="coreSettings.smtp_requires_auth"
                      label="My Server Requires Authentication"
                      class="q-pa-none"
                    />
                  </q-card-section>
                  <q-card-section v-show="coreSettings.smtp_requires_auth" class="row">
                    <div class="col-2">Username:</div>
                    <div class="col-4"></div>
                    <q-input
                      v-model="coreSettings.smtp_host_user"
                      filled
                      dense
                      class="col-6 q-pa-none"
                    />
                  </q-card-section>
                  <q-card-section v-show="coreSettings.smtp_requires_auth" class="row">
                    <div class="col-2">Password:</div>
                    <div class="col-4"></div>
                    <q-input
                      v-model="coreSettings.smtp_host_password"
                      filled
                      dense
                      class="col-6 q-pa-none"
                      :type="isPwd ? 'password' : 'text'"
                    >
                      <template #append>
                        <q-icon
                          :name="isPwd ? 'visibility_off' : 'visibility'"
                          class="cursor-pointer"
                          @click="isPwd = !isPwd"
                        />
                      </template>
                    </q-input>
                  </q-card-section>
                </q-tab-panel>
                <!-- twilio sms alerts -->
                <q-tab-panel name="smsalerts">
                  <div class="text-subtitle2 row">
                    <div>SMS Alert Routing</div>
                    <q-space />
                    <div>
                      <q-btn
                        size="sm"
                        color="grey-5"
                        icon="fas fa-plus"
                        text-color="black"
                        label="Add numbers"
                        @click="toggleAddSMSNumber"
                      />
                    </div>
                  </div>
                  <q-separator />
                  <q-card-section class="row">
                    <div class="col-3">Recipients</div>
                    <div class="col-4"></div>
                    <div class="col-5">
                      <q-list v-if="coreSettings.sms_alert_recipients.length !== 0" dense>
                        <q-item
                          v-for="num in coreSettings.sms_alert_recipients"
                          :key="num"
                          v-ripple
                          clickable
                          @click="removeSMSNumber(num)"
                        >
                          <q-item-section>
                            <q-item-label>{{ num }}</q-item-label>
                          </q-item-section>
                          <q-item-section side>
                            <q-icon name="delete" color="red" />
                          </q-item-section>
                        </q-item>
                      </q-list>
                      <q-list v-else>
                        <q-item-section>
                          <q-item-label>No recipients</q-item-label>
                        </q-item-section>
                      </q-list>
                    </div>
                  </q-card-section>
                  <!-- smtp -->
                  <div class="text-subtitle2">Twilio Settings</div>
                  <q-separator />
                  <q-card-section class="row">
                    <div class="col-3">Twilio Number:</div>
                    <div class="col-3"></div>
                    <q-input
                      v-model="coreSettings.twilio_number"
                      filled
                      dense
                      class="col-6 q-pa-none"
                      placeholder="+12131231234"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-3">Twilio Account SID:</div>
                    <div class="col-3"></div>
                    <q-input
                      v-model="coreSettings.twilio_account_sid"
                      filled
                      dense
                      class="col-6 q-pa-none"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-3">Twilio Auth Token:</div>
                    <div class="col-3"></div>
                    <q-input
                      v-model="coreSettings.twilio_auth_token"
                      filled
                      dense
                      class="col-6 q-pa-none"
                    />
                  </q-card-section>
                </q-tab-panel>
                <!-- meshcentral -->
                <q-tab-panel name="meshcentral">
                  <div class="text-subtitle2">MeshCentral Settings</div>
                  <q-separator />
                  <q-card-section v-if="!hosted" class="row">
                    <div class="col-4">Username:</div>
                    <div class="col-2"></div>
                    <q-input
                      v-model="coreSettings.mesh_username"
                      dense
                      filled
                      class="col-6"
                      :rules="[
                        (val: string) =>
                          (val == val.toLowerCase() && val != val.toUpperCase()) ||
                          'Username must be all lowercase',
                      ]"
                    />
                  </q-card-section>
                  <q-card-section v-if="!hosted" class="row">
                    <div class="col-4">Mesh Site:</div>
                    <div class="col-2"></div>
                    <q-input v-model="coreSettings.mesh_site" dense filled class="col-6" />
                  </q-card-section>
                  <q-card-section v-if="!hosted" class="row">
                    <div class="col-4">Mesh Token:</div>
                    <div class="col-2"></div>
                    <q-input v-model="coreSettings.mesh_token" dense filled class="col-6" />
                  </q-card-section>
                  <q-card-section v-if="!hosted" class="row">
                    <div class="col-4">Mesh Device Group Name:</div>
                    <div class="col-2"></div>
                    <q-input v-model="coreSettings.mesh_device_group" dense filled class="col-6" />
                  </q-card-section>
                  <q-card-section v-if="!hosted" class="row">
                    <div class="col-4 flex items-center">
                      Sync Mesh Perms with TRMM:
                      <q-icon
                        right
                        name="ion-information-circle-outline"
                        size="sm"
                        class="cursor-pointer"
                      >
                        <q-tooltip class="text-caption">
                          It is recommended to keep this option enabled; otherwise, all TRMM users
                          will have full permissions in MeshCentral regardless of their permissions
                          in TRMM.
                        </q-tooltip>
                      </q-icon>
                    </div>
                    <div class="col-2"></div>
                    <q-checkbox
                      dense
                      :model-value="coreSettings.sync_mesh_with_trmm"
                      class="col-6"
                      @update:model-value="confirmSyncChange"
                    />
                  </q-card-section>

                  <q-card-section class="row items-center">
                    <div class="col-4 flex items-center">
                      Company Name:
                      <q-icon
                        name="ion-information-circle-outline"
                        size="sm"
                        class="q-ml-sm cursor-pointer"
                      >
                        <q-tooltip class="text-caption">
                          Adding your company name here will append it to the user's full name that
                          appears when doing a remote control session, for example: 'John Doe -
                          Amidaware Inc.'
                        </q-tooltip>
                      </q-icon>
                    </div>

                    <div class="col-2"></div>

                    <q-input v-model="coreSettings.mesh_company_name" dense filled class="col-6">
                    </q-input>
                  </q-card-section>
                </q-tab-panel>

                <!-- custom fields -->
                <q-tab-panel name="customfields">
                  <CustomFields />
                </q-tab-panel>

                <!-- key store -->
                <q-tab-panel name="keystore">
                  <KeyStoreTable />
                </q-tab-panel>

                <!-- url actions -->
                <q-tab-panel name="urlactions">
                  <URLActionsTable type="web" />
                </q-tab-panel>

                <!-- web hooks -->
                <q-tab-panel name="webhooks">
                  <URLActionsTable type="rest" />
                </q-tab-panel>

                <!-- retention -->
                <q-tab-panel name="retention">
                  <q-card-section class="row">
                    <div class="col-4">Check History (days):</div>
                    <div class="col-2"></div>
                    <q-input
                      v-model="coreSettings.check_history_prune_days"
                      dense
                      filled
                      class="col-6"
                      hint="Setting this value to 0 disables this feature"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">Resolved Alerts (days):</div>
                    <div class="col-2"></div>
                    <q-input
                      v-model="coreSettings.resolved_alerts_prune_days"
                      dense
                      filled
                      class="col-6"
                      hint="Setting this value to 0 disables this feature"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">Agent History (days):</div>
                    <div class="col-2"></div>
                    <q-input
                      v-model="coreSettings.agent_history_prune_days"
                      dense
                      filled
                      class="col-6"
                      hint="Setting this value to 0 disables this feature"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">Debug Logs (days):</div>
                    <div class="col-2"></div>
                    <q-input
                      v-model="coreSettings.debug_log_prune_days"
                      dense
                      filled
                      class="col-6"
                      hint="Setting this value to 0 disables this feature"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-4">Audit Logs (days):</div>
                    <div class="col-2"></div>
                    <q-input
                      v-model="coreSettings.audit_log_prune_days"
                      dense
                      filled
                      class="col-6"
                      hint="Setting this value to 0 disables this feature"
                    />
                  </q-card-section>
                </q-tab-panel>

                <q-tab-panel name="apikeys">
                  <APIKeysTable />
                </q-tab-panel>

                <!-- sso integration -->
                <q-tab-panel name="sso">
                  <SSOProvidersTable />
                </q-tab-panel>
              </q-tab-panels>
            </q-scroll-area>
            <q-card-section class="row items-center">
              <q-btn
                v-show="
                  tab !== 'customfields' &&
                  tab !== 'keystore' &&
                  tab !== 'urlactions' &&
                  tab !== 'sso'
                "
                label="Save"
                color="primary"
                type="submit"
              />
              <q-btn
                v-show="tab === 'emailalerts'"
                label="Save and Test Email"
                color="primary"
                type="submit"
                class="q-ml-md"
                @click="emailTest = true"
              />
              <q-btn
                v-show="tab === 'smsalerts'"
                label="Save and Test SMS"
                color="primary"
                type="submit"
                class="q-ml-md"
                @click="smsTest = true"
              />
            </q-card-section>
          </q-form>
        </template>
      </q-splitter>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted } from "vue";
import { openURL, useDialogPluginComponent, useQuasar } from "quasar";
import { useCoreStore, useDashboardStore } from "src/stores/api";

const { coreSettings, getCoreSettings, updateCoreSettings } = useCoreStore();
const { dashboardSettings } = useDashboardStore();
import { usePolicyDropdown } from "src/core/automation/composables";
import { useAlertTemplateDropdown } from "src/core/alerts/composables";
import { isValidEmail } from "src/utils/validation";

// ui imports
import ResetPatchPolicy from "./ResetPatchPolicy.vue";
import CustomFields from "./CustomFields.vue";
import KeyStoreTable from "./KeyStoreTable.vue";
import URLActionsTable from "./URLActionsTable.vue";
import APIKeysTable from "./APIKeysTable.vue";
import SSOProvidersTable from "src/ee/sso/components/SSOProvidersTable.vue";

// setup quasar plugins
defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const $q = useQuasar();

// setup dropdowns
const { policyOptions } = usePolicyDropdown();
const { alertTemplateOptions } = useAlertTemplateDropdown();

const hosted = computed(() => dashboardSettings.hosted);

const logLevelOptions = [
  { label: "Info", value: "info" },
  { label: "Warning", value: "warning" },
  { label: "Error", value: "error" },
  { label: "Critical", value: "critical" },
];

const tab = ref("general");
const isPwd = ref(false);
const splitterModel = ref(20);
const thumbStyle = {
  right: "2px",
  borderRadius: "5px",
  backgroundColor: "#027be3",
  width: "5px",
  opacity: "0.75",
};
const emailTest = ref(false);
const smsTest = ref(false);

// TODO: Make sure sso edits/add are modifying the store
// watch: {
//   tab(newTab, oldTab) {
//     if (oldTab === "sso") {
//       this.getCoreSettings();
//     }
//   }
// }

function confirmSyncChange(newValue: boolean) {
  $q.dialog({
    title: "Are you sure?",
    message:
      "This operation may take several minutes to complete in the background and can be very CPU/disk intensive, depending on your hardware and number of agents. Please allow time for the sync to fully complete.",
    ok: { label: "Yes", color: "primary" },
    cancel: { label: "No", color: "negative" },
  }).onOk(() => {
    if (coreSettings.value) coreSettings.value.sync_mesh_with_trmm = newValue;
  });
}
function showResetPatchPolicy() {
  $q.dialog({
    component: ResetPatchPolicy,
  });
}

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
    noBackdropDismiss: true,
  }).onOk((data) => {
    coreSettings.value?.email_alert_recipients.push(data);
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
    noBackdropDismiss: true,
  }).onOk((data) => {
    coreSettings.value?.sms_alert_recipients.push(data);
  });
}

function removeEmail(email: string) {
  const removed = coreSettings.value?.email_alert_recipients.filter((k) => k !== email);
  if (coreSettings.value && removed) coreSettings.value.email_alert_recipients = removed;
}

function removeSMSNumber(num: string) {
  const removed = coreSettings.value?.sms_alert_recipients.filter((k) => k !== num);
  if (coreSettings.value && removed) coreSettings.value.sms_alert_recipients = removed;
}

async function submit() {
  if (coreSettings.value) {
    try {
      await updateCoreSettings(coreSettings.value, emailTest.value, smsTest.value);
      onDialogOK();
    } catch {
      //
    }
  }
}

onMounted(getCoreSettings);
</script>
