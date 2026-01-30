<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card style="min-width: 800px">
      <q-bar>
        Edit {{ agent?.hostname ?? "Agent" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-inner-loading :showing="!agent" />
      <q-splitter v-if="agent" v-model="splitterModel">
        <template #before>
          <q-tabs v-model="tab" dense vertical class="text-primary">
            <q-tab name="general" label="General" />
            <q-tab name="customfields" label="Custom Fields" />
            <q-tab name="patch" label="Patches" />
            <q-tab name="policies" label="Automation Policies" />
          </q-tabs>
        </template>
        <template #after>
          <q-form @submit.prevent="submit">
            <div class="scroll" style="height: 65vh; max-height: 65vh">
              <q-tab-panels
                v-model="tab"
                animated
                transition-prev="jump-up"
                transition-next="jump-up"
              >
                <!-- general -->
                <q-tab-panel name="general">
                  <q-card-section class="row">
                    <div class="col-2">Site:</div>
                    <div class="col-2"></div>
                    <tactical-dropdown
                      v-model="localAgent.site"
                      class="col-8"
                      :options="siteOptions"
                      filled
                      map-options
                      filterable
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-2">Type:</div>
                    <div class="col-2"></div>
                    <q-select
                      v-model="localAgent.monitoring_type"
                      dense
                      options-dense
                      filled
                      :options="['server', 'workstation']"
                      class="col-8"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-2">Description:</div>
                    <div class="col-2"></div>
                    <q-input v-model="localAgent.description" filled dense class="col-8" />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-2">Timezone:</div>
                    <div class="col-2"></div>
                    <tactical-dropdown
                      v-model="localAgent.time_zone"
                      filterable
                      filled
                      dense
                      options-dense
                      :options="dashboardSettings.timezoneOptions"
                      class="col-8"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-10">Run checks every:</div>
                    <q-input
                      v-model.number="localAgent.check_interval"
                      dense
                      type="number"
                      filled
                      label="Seconds"
                      class="col-2"
                      :rules="[
                        (val: number) => !!val || '*Required',
                        (val: number) => val >= 15 || 'Minimum is 15 seconds',
                        (val: number) => val <= 86400 || 'Maximum is 86400 seconds',
                      ]"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-10">
                      <q-icon
                        class="q-pr-sm"
                        name="fas fa-signal"
                        size="1.2em"
                        :color="dashboardSettings.dashWarningColor"
                      />
                      Mark an agent as
                      <span class="text-weight-bold">offline</span> if it has not checked in after:
                    </div>
                    <q-input
                      v-model.number="localAgent.offline_time"
                      dense
                      type="number"
                      filled
                      label="Minutes"
                      class="col-2"
                      :rules="[
                        (val: number) => !!val || '*Required',
                        (val: number) => val >= 2 || 'Minimum is 2 minutes',
                        (val: number) => val < 9999999 || 'Maximum is 9999999 minutes',
                      ]"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <div class="col-10">
                      <q-icon
                        class="q-pr-sm"
                        name="fas fa-signal"
                        size="1.2em"
                        :color="dashboardSettings.dashNegativeColor"
                      />
                      Mark an agent as
                      <span class="text-weight-bold">overdue</span> if it has not checked in after:
                    </div>
                    <q-input
                      v-model.number="localAgent.overdue_time"
                      dense
                      type="number"
                      filled
                      label="Minutes"
                      class="col-2"
                      :rules="[
                        (val: number) => !!val || '*Required',
                        (val: number) => val >= 3 || 'Minimum is 3 minutes',
                        (val: number) => val < 9999999 || 'Maximum is 9999999 minutes',
                      ]"
                    />
                  </q-card-section>
                  <q-card-section class="row">
                    <q-checkbox
                      v-model="localAgent.overdue_email_alert"
                      label="Get overdue email alerts"
                    />
                    <q-checkbox
                      v-model="localAgent.overdue_text_alert"
                      label="Get overdue sms alerts"
                    />
                    <q-checkbox
                      v-model="localAgent.overdue_dashboard_alert"
                      label="Get overdue dashboard alerts"
                    />
                  </q-card-section>
                </q-tab-panel>

                <!-- custom fields -->
                <q-tab-panel name="customfields">
                  <div v-if="agentCustomFields.length === 0" class="text-subtitle">
                    No agent custom fields found. Go to **Settings > Global Settings > Custom
                    Settings**
                  </div>

                  <q-card-section v-for="field in agentCustomFields" :key="field.id">
                    <CustomField v-model="agentCustomFieldValues[field.name]" :field="field" />
                  </q-card-section>
                </q-tab-panel>

                <!-- patch -->
                <q-tab-panel name="patch">
                  <PatchPolicyForm :agent="agent" />
                </q-tab-panel>

                <!-- automation policies -->
                <q-tab-panel name="policies">
                  <div class="text-subtitle2">Policies</div>
                  <q-list separator padding dense>
                    <q-item v-for="(policy, key) in agent.applied_policies" :key="key">
                      <q-item-section>
                        <q-item-label overline>
                          {{ capitalize(key).split("_").join(" ") }}
                        </q-item-label>
                        <q-item-label>{{ policy ? policy.name : "None" }}</q-item-label>
                      </q-item-section>
                      <q-item-section v-if="policy" side>
                        <q-item-label>
                          <i>{{ policy.active ? "" : "disabled" }}</i>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>

                  <div class="text-subtitle2">Alert Template</div>
                  <q-list dense padding>
                    <q-item>
                      <q-item-section>
                        <q-item-label>{{
                          agent.alert_template ? agent.alert_template.name : "None"
                        }}</q-item-label>
                      </q-item-section>
                      <q-item-section v-if="agent.alert_template" side>
                        <q-item-label>
                          <i>{{ agent.alert_template.is_active ? "" : "disabled" }}</i>
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                  <div class="text-subtitle2">Effective Patch Policy</div>
                  <q-list separator padding dense>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>Critical</q-item-label>
                        <q-item-label>{{
                          agent.effective_patch_policy.critical !== "inherit"
                            ? capitalize(agent.effective_patch_policy.critical)
                            : "Do Nothing"
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>Important</q-item-label>
                        <q-item-label>{{
                          agent.effective_patch_policy.important !== "inherit"
                            ? capitalize(agent.effective_patch_policy.important)
                            : "Do Nothing"
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>Moderate</q-item-label>
                        <q-item-label>{{
                          agent.effective_patch_policy.moderate !== "inherit"
                            ? capitalize(agent.effective_patch_policy.moderate)
                            : "Do Nothing"
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>Low</q-item-label>
                        <q-item-label>{{
                          agent.effective_patch_policy.low !== "inherit"
                            ? capitalize(agent.effective_patch_policy.low)
                            : "Do Nothing"
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>Other</q-item-label>
                        <q-item-label>{{
                          agent.effective_patch_policy.other !== "inherit"
                            ? capitalize(agent.effective_patch_policy.other)
                            : "Do Nothing"
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>Run Time Frequency</q-item-label>
                        <q-item-label>{{
                          capitalize(agent.effective_patch_policy.run_time_frequency)
                        }}</q-item-label>
                      </q-item-section>
                      <q-item-section
                        v-if="agent.effective_patch_policy.run_time_frequency === 'daily'"
                      >
                        <q-item-label>
                          <b>week days:</b>
                          {{ weekDaystoString(agent.effective_patch_policy.run_time_days) }}
                          <b>at hour:</b>
                          {{ agent.effective_patch_policy.run_time_hour }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section
                        v-else-if="agent.effective_patch_policy.run_time_frequency === 'monthly'"
                      >
                        <q-item-label>
                          <b>Every month on day:</b>
                          {{ agent.effective_patch_policy.run_time_day }}
                          <b>at hour:</b>
                          {{ agent.effective_patch_policy.run_time_hour }}
                        </q-item-label>
                      </q-item-section>
                      <q-item-section v-else>
                        <q-item-label>None</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>Reboot after installation</q-item-label>
                        <q-item-label>{{
                          agent.effective_patch_policy.reboot_after_install !== "inherit"
                            ? capitalize(agent.effective_patch_policy.reboot_after_install)
                            : "Do Nothing"
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section>
                        <q-item-label overline>Failed patch options</q-item-label>
                        <q-item-label v-if="agent.effective_patch_policy.reprocess_failed_inherit"
                          >Do Nothing</q-item-label
                        >
                        <q-item-label v-else>
                          <b>Reprocess failed patches:</b>
                          {{
                            agent.effective_patch_policy.reprocess_failed
                              ? agent.effective_patch_policy.reprocess_failed_times
                              : "Never"
                          }}
                          <b>Email on fail:</b>
                          {{ agent.effective_patch_policy.email_if_fail ? "Yes" : "Never" }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-tab-panel>
              </q-tab-panels>
            </div>
            <q-card-section class="row items-center">
              <q-btn label="Save" color="primary" type="submit" />
            </q-card-section>
          </q-form>
        </template>
      </q-splitter>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useAgentStore, useCustomFieldStore, useDashboardStore } from "src/stores/api";

const { selectedAgent: agent, updateAgent, getAgent } = useAgentStore();
const { agentCustomFields, getCustomFields } = useCustomFieldStore();
const { dashboardSettings } = useDashboardStore();
import { useSiteDropdown } from "src/core/clients/composables";
import { capitalize } from "src/utils/format";
import { formatCustomFields } from "src/utils/format";

// ui imports
import PatchPolicyForm from "src/core/automation/components/PatchPolicyForm.vue";
import CustomField from "src/core/dashboard/ui/CustomField.vue";

// type imports
import type { UpdateAgentRequest, AgentMonitoringType } from "../types";
import type { CustomFieldValueField } from "src/core/settings/types";

const props = defineProps<{
  agentId: string;
}>();

defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
const splitterModel = ref(25);
const tab = ref("general");

const { siteOptions } = useSiteDropdown();

const localAgent = reactive<UpdateAgentRequest>({
  id: 0,
  hostname: "",
  site: 0,
  monitoring_type: "workstation",
  description: "",
  time_zone: "",
  check_interval: 120,
  offline_time: 4,
  overdue_time: 30,
  overdue_email_alert: false,
  overdue_text_alert: false,
  overdue_dashboard_alert: false,
});

// Initialize localAgent when agent data is loaded
watch(
  agent,
  (newAgent) => {
    if (newAgent) {
      localAgent.id = newAgent.id;
      localAgent.hostname = newAgent.hostname;
      localAgent.site = newAgent.site;
      localAgent.monitoring_type = newAgent.monitoring_type;
      localAgent.description = newAgent.description;
      localAgent.time_zone = newAgent.time_zone;
      localAgent.check_interval = newAgent.check_interval;
      localAgent.offline_time = newAgent.offline_time;
      localAgent.overdue_time = newAgent.overdue_time;
      localAgent.overdue_email_alert = newAgent.overdue_email_alert;
      localAgent.overdue_text_alert = newAgent.overdue_text_alert;
      localAgent.overdue_dashboard_alert = newAgent.overdue_dashboard_alert;
    }
  },
  { immediate: true },
);

const agentCustomFieldValues = computed(() => {
  const mapped_custom_fields = {} as Record<string, unknown>;
  if (agent.value && agent.value.custom_fields) {
    for (const field of agentCustomFields.value) {
      const value = agent.value.custom_fields.find((value) => value.field === field.id);

      if (field.type === "multiple") {
        if (value) mapped_custom_fields[field.name] = value.value;
        else mapped_custom_fields[field.name] = [];
      } else if (field.type === "checkbox") {
        if (value) mapped_custom_fields[field.name] = value.value;
        else mapped_custom_fields[field.name] = false;
      } else {
        if (value) mapped_custom_fields[field.name] = value.value;
        else mapped_custom_fields[field.name] = "";
      }
    }
  }
  return mapped_custom_fields as Record<string, CustomFieldValueField>;
});

async function submit() {
  if (!agent.value) return;

  localAgent.custom_fields = formatCustomFields(
    agentCustomFields.value,
    agentCustomFieldValues.value,
  );

  try {
    await updateAgent(agent.value.agent_id, {
      ...localAgent,
      monitoring_type: localAgent.monitoring_type as AgentMonitoringType,
      description: localAgent.description || "",
      time_zone: localAgent.time_zone || "",
      custom_fields: localAgent.custom_fields || [],
    });
    onDialogOK();
  } catch {
    //
  }
}

function weekDaystoString(array: number[]) {
  if (array.length === 0) return "not set";

  const result = [] as string[];
  for (const day of array) {
    if (day === 1) result.push("Mon");
    else if (day === 2) result.push("Tue");
    else if (day === 3) result.push("Wed");
    else if (day === 4) result.push("Thu");
    else if (day === 5) result.push("Fri");
    else if (day === 6) result.push("Sat");
    else if (day === 0) result.push("Sun");
  }

  return result.join(", ");
}

onMounted(() => {
  getCustomFields();
  getAgent(props.agentId, { force: true });
});
</script>
