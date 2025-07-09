<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 65vw; min-width: 65vw">
      <q-bar>
        {{ task ? `Editing Automated Task: ${task.name}` : "Adding Automated Task" }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-card-section v-if="scriptOptions.length === 0">
        <p>You need to upload a script first</p>
        <p>Settings -> Script Manager</p>
      </q-card-section>
      <q-stepper v-else ref="stepper" v-model="step" color="primary" animated>
        <q-step :name="1" title="Select Task" :done="step > 1" :error="!isValidStep1">
          <q-form ref="taskGeneralForm" @submit.prevent>
            <q-card-section>
              <q-input
                v-model="localTask.name"
                :rules="[(val) => !!val || '*Required']"
                filled
                dense
                label="Descriptive name of task"
                hide-bottom-space
              />
            </q-card-section>
            <q-card-section v-show="!isAgentTask">
              Supported Platforms
              <q-option-group
                v-model="localTask.task_supported_platforms"
                :options="plat_options"
                type="checkbox"
                inline
              />
            </q-card-section>
            <q-card-section>
              <q-checkbox
                v-model="collector"
                dense
                label="Collector Task"
                class="q-pb-sm"
                @update:model-value="
                  localTask.custom_field = null;
                  localTask.collector_all_output = false;
                "
              />
              <tactical-dropdown
                v-if="collector"
                v-model="localTask.custom_field"
                :rules="[(val: number) => !!val || '*Required']"
                :options="customFieldOptions"
                label="Custom Field to update"
                filled
                map-options
                :hint="
                  localTask.collector_all_output
                    ? 'All script output will be saved to custom field selected'
                    : 'The last line of script output will be saved to custom field selected'
                "
                filterable
              />
              <q-checkbox
                v-if="collector"
                v-model="localTask.collector_all_output"
                dense
                label="Save all output"
                class="q-py-sm"
              />
            </q-card-section>
            <q-card-section>
              <tactical-dropdown
                v-model="localTask.alert_severity"
                :options="severityOptions"
                label="Alert Severity"
                filled
                map-options
                :rules="[(val: string) => !!val || '*Required']"
              />
            </q-card-section>
          </q-form>
        </q-step>

        <q-step :name="2" title="Configure Actions" :done="step > 2" :error="!isValidStep2">
          <div class="scroll" style="max-height: 60vh">
            <q-form @submit.prevent="addAction">
              <div class="row q-pa-sm q-gutter-x-xs items-center">
                <div class="text-subtitle2 col-12">Action Type:</div>
                <q-option-group
                  v-model="action.type"
                  class="col-12"
                  inline
                  :options="[
                    { label: 'Script', value: 'script' },
                    { label: 'Command', value: 'cmd' },
                  ]"
                />

                <tactical-dropdown
                  v-if="action.type === 'script'"
                  v-model="action.script"
                  class="col-3"
                  label="Select script"
                  :options="scriptOptions"
                  filled
                  map-options
                  filterable
                />

                <q-select
                  v-if="action.type === 'script'"
                  v-model="action.script_args"
                  class="col-3"
                  dense
                  label="Script Arguments (press Enter after typing each argument)"
                  filled
                  use-input
                  use-chips
                  multiple
                  hide-dropdown-icon
                  input-debounce="0"
                  new-value-mode="add"
                />

                <q-select
                  v-if="action.type === 'script'"
                  v-model="action.env_vars"
                  class="col-3"
                  dense
                  :label="envVarsLabel"
                  filled
                  use-input
                  use-chips
                  multiple
                  hide-dropdown-icon
                  input-debounce="0"
                  new-value-mode="add"
                />

                <q-input
                  v-if="action.type === 'script'"
                  v-model.number="action.timeout"
                  class="col-2"
                  filled
                  dense
                  type="number"
                  label="Timeout (seconds)"
                />

                <q-input
                  v-if="action.type === 'cmd'"
                  v-model="action.command"
                  label="Command"
                  dense
                  filled
                  class="col-5"
                />
                <q-input
                  v-if="action.type === 'cmd'"
                  v-model.number="action.timeout"
                  class="col-2"
                  filled
                  dense
                  type="number"
                  label="Timeout (seconds)"
                />
                <q-option-group
                  v-if="action.type === 'cmd'"
                  v-model="action.shell"
                  class="col-4 q-pl-sm"
                  inline
                  :options="[
                    { label: 'CMD', value: 'cmd' },
                    { label: 'Powershell', value: 'powershell' },
                    { label: 'Bash', value: '/bin/bash' },
                    { label: 'Custom', value: 'custom' },
                  ]"
                />
                <q-btn
                  class="col-1"
                  type="submit"
                  style="width: 50px"
                  flat
                  dense
                  icon="add"
                  label="Add"
                  color="primary"
                />
              </div>
            </q-form>
            <div v-if="action.shell === 'custom'" class="col-5">
              <q-input
                v-model="custom_shell"
                filled
                label="Custom shell"
                stack-label
                placeholder="/usr/bin/python3"
              />
            </div>
            <div class="text-subtitle2 q-pa-sm">
              Actions:
              <q-checkbox
                v-model="localTask.continue_on_error"
                class="float-right"
                label="Continue on Errors"
                dense
              >
                <q-tooltip>Continue task if an action fails</q-tooltip>
              </q-checkbox>
            </div>
            <div class="q-pt-sm" style="height: 150px">
              <draggable
                v-model="localTask.actions"
                class="q-list"
                handle=".handle"
                ghost-class="ghost"
                item-key="index"
              >
                <template #item="{ index, element }">
                  <q-item>
                    <q-item-section avatar>
                      <q-icon class="handle" style="cursor: move" name="drag_handle" />
                    </q-item-section>
                    <q-item-section v-if="element.type === 'script'">
                      <q-item-label>
                        <q-icon size="sm" name="description" color="primary" />
                        &nbsp; {{ element.name }}
                      </q-item-label>
                      <q-item-label caption> Arguments: {{ element.script_args }} </q-item-label>
                      <q-item-label caption> Env Vars: {{ element.env_vars }} </q-item-label>
                      <q-item-label caption> Timeout: {{ element.timeout }} </q-item-label>
                    </q-item-section>
                    <q-item-section v-else>
                      <q-item-label>
                        <q-icon size="sm" name="terminal" color="primary" />
                        &nbsp;
                        <q-icon
                          size="sm"
                          :name="
                            element.shell === 'cmd' ? 'mdi-microsoft-windows' : 'mdi-powershell'
                          "
                          color="primary"
                        />
                        {{ element.command }}
                      </q-item-label>
                      <q-item-label caption> Timeout: {{ element.timeout }} </q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon
                        class="cursor-pointer"
                        color="negative"
                        name="close"
                        @click="removeAction(index)"
                      />
                    </q-item-section>
                  </q-item>
                </template>
              </draggable>
            </div>
          </div>
        </q-step>

        <q-step :name="3" title="Choose Schedule" :error="!isValidStep3">
          <div class="scroll" style="height: 60vh; max-height: 60vh">
            <q-form ref="taskDetailForm" @submit.prevent>
              <q-card-section>
                <q-option-group
                  v-model="localTask.task_type"
                  label="Task run type"
                  :options="taskTypeOptions"
                  dense
                  inline
                  @update:model-value="taskDetailForm?.resetValidation()"
                />
              </q-card-section>

              <!-- task start/expire time fields -->
              <q-card-section
                v-if="['runonce', 'daily', 'weekly', 'monthly'].includes(localTask.task_type)"
                class="row"
              >
                <!-- start time input -->
                <q-input
                  v-model="localTask.run_time_date"
                  class="col-6 q-pa-sm"
                  type="datetime-local"
                  dense
                  :label="isPosix && localTask.task_type !== 'runonce' ? 'Run at' : 'Start time'"
                  stack-label
                  filled
                  :hint="
                    isPosix && localTask.task_type !== 'runonce'
                      ? 'Agent timezone will be used. On Linux and macOS, the selected date is ignored—only the hour and minute are used.'
                      : 'Agent timezone will be used'
                  "
                  :rules="[(val) => !!val || '*Required']"
                />

                <!-- expires on input -->
                <q-input
                  v-if="!isPosix"
                  v-model="localTask.expire_date"
                  class="col-6 q-pa-sm"
                  type="datetime-local"
                  dense
                  stack-label
                  label="Expires on"
                  filled
                  hint="Agent timezone will be used"
                />
              </q-card-section>

              <q-card-section
                v-if="localTask.task_type === 'onboarding' || localTask.task_type === 'runonce'"
                class="row"
              >
                <span v-if="localTask.task_type === 'onboarding'"
                  >This task will run as soon as it's created on the agent.</span
                >
                <span v-else-if="localTask.task_type === 'runonce'"
                  >Start Time must be in the future for run once tasks.</span
                >
              </q-card-section>

              <!-- daily options -->
              <q-card-section v-if="!isPosix && localTask.task_type === 'daily'" class="row">
                <!-- daily interval -->
                <q-input
                  v-model.number="localTask.daily_interval"
                  :rules="[
                    (val) => !!val || '*Required',
                    (val) =>
                      (val > 0 && val < 256) ||
                      'Daily interval must be greater than 0 and less than 3',
                  ]"
                  dense
                  type="number"
                  label="Run every"
                  filled
                  class="col-6 q-pa-sm"
                >
                  <template #append>
                    <span class="text-subtitle2">days</span>
                  </template>
                </q-input>
                <div class="col-6 q-pa-sm"></div>
              </q-card-section>

              <!-- weekly options -->
              <q-card-section v-if="localTask.task_type === 'weekly'" class="row">
                <!-- weekly interval -->
                <q-input
                  v-if="!isPosix"
                  v-model="localTask.weekly_interval"
                  :rules="[
                    (val) => !!val || '*Required',
                    (val) =>
                      (val > 0 && val < 53) ||
                      'Weekly interval must be greater than 0 and less than 3',
                  ]"
                  class="col-6 q-pa-sm"
                  dense
                  label="Run every"
                  filled
                >
                  <template #append>
                    <span class="text-subtitle2">weeks</span>
                  </template>
                </q-input>

                <div class="col-6 q-pa-sm"></div>

                <div class="col-12 q-pa-sm">
                  <!-- day of week input -->
                  Run on Days:
                  <q-option-group
                    v-model="localTask.run_time_bit_weekdays"
                    :rules="[(val: number[]) => val.length > 0 || '*Required']"
                    inline
                    dense
                    :options="dayOfWeekOptions"
                    type="checkbox"
                  />
                </div>
              </q-card-section>

              <!-- monthly options -->
              <q-card-section v-if="localTask.task_type === 'monthly'" class="row">
                <!-- type of monthly schedule -->
                <q-option-group
                  v-model="monthlyType"
                  class="col-12 q-pa-sm"
                  inline
                  :options="[
                    { label: 'On Days', value: 'days' },
                    { label: 'On Weeks', value: 'weeks' },
                  ]"
                />

                <!-- month select input -->
                <q-select
                  v-model="localTask.monthly_months_of_year"
                  :rules="[(val) => val.length > 0 || '*Required']"
                  class="col-4 q-pa-sm"
                  filled
                  dense
                  options-dense
                  :options="monthOptions"
                  label="Run on Months"
                  multiple
                  emit-value
                  map-options
                >
                  <template #before-options>
                    <q-item>
                      <q-item-section>
                        <q-item-label>All months</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-checkbox
                          v-model="allMonthsCheckbox"
                          dense
                          @update:model-value="toggleMonths"
                        />
                      </q-item-section>
                    </q-item>
                  </template>

                  <template #option="{ itemProps, opt, selected, toggleOption }">
                    <q-item v-bind="itemProps">
                      <q-item-section>
                        <q-item-label>opt.label</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-checkbox
                          dense
                          :model-value="selected"
                          @update:model-value="
                            toggleOption(opt);
                            allMonthsCheckbox = false;
                          "
                        />
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>

                <!-- days of month select input -->
                <q-select
                  v-if="monthlyType === 'days'"
                  v-model="localTask.monthly_days_of_month"
                  :rules="[(val) => val.length > 0 || '*Required']"
                  class="col-4 q-pa-sm"
                  filled
                  dense
                  options-dense
                  :options="dayOfMonthOptions"
                  label="Run on Days"
                  multiple
                  emit-value
                  map-options
                >
                  <template #before-options>
                    <q-item>
                      <q-item-section>
                        <q-item-label>All days</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-checkbox
                          v-model="allMonthDaysCheckbox"
                          dense
                          @update:model-value="toggleMonthDays"
                        />
                      </q-item-section>
                    </q-item>
                  </template>

                  <template #option="{ itemProps, opt, selected, toggleOption }">
                    <q-item v-bind="itemProps">
                      <q-item-section>
                        <q-item-label>{{ opt.label }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-checkbox
                          dense
                          :model-value="selected"
                          @update:model-value="
                            toggleOption(opt);
                            allMonthDaysCheckbox = false;
                          "
                        />
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>

                <div v-if="monthlyType === 'days'" class="col-4"></div>

                <!-- week of month select input -->
                <q-select
                  v-if="monthlyType === 'weeks'"
                  v-model="localTask.monthly_weeks_of_month"
                  :rules="[(val) => val.length > 0 || '*Required']"
                  class="col-4 q-pa-sm"
                  filled
                  dense
                  options-dense
                  :options="weekOptions"
                  label="Run on weeks"
                  multiple
                  emit-value
                  map-options
                >
                  <template #option="{ itemProps, opt, selected, toggleOption }">
                    <q-item v-bind="itemProps">
                      <q-item-section>
                        <q-item-label>{{ opt.label }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-checkbox
                          dense
                          :model-value="selected"
                          @update:model-value="toggleOption(opt)"
                        />
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>

                <!-- day of week select input -->
                <q-select
                  v-if="monthlyType === 'weeks'"
                  v-model="localTask.run_time_bit_weekdays"
                  :rules="[(val) => val.length > 0 || '*Required']"
                  class="col-4 q-pa-sm"
                  filled
                  dense
                  options-dense
                  :options="dayOfWeekOptions"
                  label="Run on days"
                  multiple
                  emit-value
                  map-options
                >
                  <template #before-options>
                    <q-item>
                      <q-item-section>
                        <q-item-label>All days</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-checkbox
                          v-model="allWeekDaysCheckbox"
                          dense
                          @update:model-value="toggleWeekDays"
                        />
                      </q-item-section>
                    </q-item>
                  </template>

                  <template #option="{ itemProps, opt, selected, toggleOption }">
                    <q-item v-bind="itemProps">
                      <q-item-section>
                        <q-item-label>{{ opt.value }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-checkbox
                          dense
                          :model-value="selected"
                          @update:model-value="
                            toggleOption(opt);
                            allWeekDaysCheckbox = false;
                          "
                        />
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </q-card-section>

              <q-card-section
                v-if="
                  localTask.task_type !== 'checkfailure' &&
                  localTask.task_type !== 'manual' &&
                  localTask.task_type !== 'onboarding'
                "
                class="row"
              >
                <div v-if="!isPosix" class="col-12 text-h6">Advanced Settings (Windows only)</div>
                <q-input
                  v-if="!isPosix"
                  v-model="localTask.task_repetition_interval"
                  class="col-6 q-pa-sm"
                  dense
                  label="Repeat task every"
                  filled
                  placeholder="e.g. 30m (30 minutes) or 1h (1 hour)"
                  lazy-rules
                  :rules="[
                    (val) =>
                      !val ||
                      validateTimePeriod(val) ||
                      'Valid values are 1-3 digits followed by (D|d|H|h|M|m|S|s)',
                  ]"
                />

                <q-input
                  v-if="!isPosix"
                  v-model="localTask.task_repetition_duration"
                  :disable="!localTask.task_repetition_interval"
                  class="col-6 q-pa-sm"
                  dense
                  label="Task repeat duration"
                  filled
                  placeholder="e.g. 6h (6 hours) or 1d (1 day)"
                  lazy-rules
                  :rules="[
                    (val) =>
                      validateTimePeriod(val) ||
                      'Valid values are 1-3 digits followed by (D|d|H|h|M|m|S|s)',
                    (val) => (localTask.task_repetition_interval ? !!val : true), // field is required if repetition interval is set
                    (val) =>
                      convertPeriodToSeconds(val) >=
                        convertPeriodToSeconds(String(localTask.task_repetition_interval)) ||
                      'Repetition duration must be greater than repetition interval',
                  ]"
                />

                <q-checkbox
                  v-if="!isPosix"
                  v-model="localTask.stop_task_at_duration_end"
                  :disable="!localTask.task_repetition_interval"
                  class="col-6 q-pa-sm"
                  dense
                  label="Stop all tasks at the end of duration"
                />
                <div class="col-6"></div>

                <q-input
                  v-if="!isPosix"
                  v-model="localTask.random_task_delay"
                  class="col-6 q-pa-sm"
                  dense
                  label="Random task delay"
                  filled
                  placeholder="e.g. 2m (2 minutes) or 1h (1 hour)"
                  lazy-rules
                  :rules="[
                    (val) =>
                      !val ||
                      validateTimePeriod(val) ||
                      'Valid values are 1-3 digits followed by (D|d|H|h|M|m|S|s)',
                  ]"
                />
                <div class="col-6"></div>
                <q-checkbox
                  v-if="!isPosix"
                  v-model="localTask.remove_if_not_scheduled"
                  :disable="!localTask.expire_date"
                  class="col-6 q-pa-sm"
                  dense
                  label="Delete task if not scheduled for 30 days"
                >
                  <q-tooltip>Must set an expire date</q-tooltip>
                </q-checkbox>
                <div class="col-6"></div>
                <q-checkbox
                  v-if="!isPosix"
                  v-model="localTask.run_asap_after_missed"
                  :disable="localTask.task_type === 'runonce'"
                  class="col-6 q-pa-sm"
                  dense
                  label="Run task ASAP after a scheduled start is missed"
                />

                <div class="col-6"></div>

                <tactical-dropdown
                  v-if="!isPosix"
                  v-model="localTask.task_instance_policy"
                  class="col-6 q-pa-sm"
                  label="Task instance policy"
                  :options="taskInstancePolicyOptions"
                  filled
                  map-options
                />
              </q-card-section>

              <!-- check failure options -->
              <q-card-section v-else-if="localTask.task_type === 'checkfailure'" class="row">
                <tactical-dropdown
                  v-model="localTask.assigned_check"
                  class="col-6 q-pa-sm"
                  :rules="[(val: number) => !!val || '*Required']"
                  filled
                  :options="checkOptions"
                  label="Select Check"
                  map-options
                  filterable
                />
              </q-card-section>
            </q-form>
          </div>
        </q-step>
      </q-stepper>
      <q-card-actions align="right">
        <q-btn v-close-popup flat label="Cancel" />
        <q-btn v-if="step > 1" label="Back" color="primary" flat @click="stepper?.previous()" />
        <q-btn
          v-if="step < 3"
          color="primary"
          label="Next"
          flat
          @click="step === 1 && validateStep(taskGeneralForm as QForm, stepper as QStepper)"
        />
        <q-btn
          v-else
          :label="task ? 'Edit Task' : 'Add Task'"
          color="primary"
          :loading="taskStore.isLoading"
          flat
          dense
          push
          @click="validateStep(taskDetailForm as QForm, stepper as QStepper)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { computed, ref, watch, reactive, useTemplateRef } from "vue";
import { QForm, QStepper, useDialogPluginComponent } from "quasar";
import draggable from "vuedraggable";
import { useTaskStore } from "../api";
import { useScriptDropdown } from "src/core/scripts/composables";
import { useAgentCheckDropdown, usePolicyCheckDropdown } from "src/core/checks/composables";
import { useCustomFieldDropdown } from "src/core/settings/composables";
import { notifyError } from "src/utils/notify";
import { validateTimePeriod } from "src/utils/validation";
import { envVarsLabel } from "src/constants/constants";
import { convertPeriodToSeconds, formatDateInputField } from "src/utils/format";

// type imports
import type { AgentPlat } from "src/core/agents/types";
import type { AutomatedTaskUI, TaskAction } from "../types";
import { until } from "@vueuse/shared";

// static data
const severityOptions = [
  { label: "Informational", value: "info" },
  { label: "Warning", value: "warning" },
  { label: "Error", value: "error" },
];

const taskTypeOptions = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Run Once", value: "runonce" },
  { label: "On check failure", value: "checkfailure" },
  { label: "Onboarding", value: "onboarding" },
  { label: "Manual", value: "manual" },
];

const dayOfWeekOptions = [
  { label: "Monday", value: 0x2 },
  { label: "Tuesday", value: 0x4 },
  { label: "Wednesday", value: 0x8 },
  { label: "Thursday", value: 0x10 },
  { label: "Friday", value: 0x20 },
  { label: "Saturday", value: 0x40 },
  { label: "Sunday", value: 0x1 },
];

const dayOfMonthOptions = (() => {
  const result = [];
  let day = 0x1;
  for (let i = 1; i <= 31; i++) {
    result.push({ label: `${i}`, value: day });
    day = day << 1;
  }
  result.push({ label: "Last Day", value: 0x80000000 });
  return result;
})();

const monthOptions = [
  { label: "January", value: 0x1 },
  { label: "February", value: 0x2 },
  { label: "March", value: 0x4 },
  { label: "April", value: 0x8 },
  { label: "May", value: 0x10 },
  { label: "June", value: 0x20 },
  { label: "July", value: 0x40 },
  { label: "August", value: 0x80 },
  { label: "September", value: 0x100 },
  { label: "October", value: 0x200 },
  { label: "November", value: 0x400 },
  { label: "December", value: 0x800 },
];

const weekOptions = [
  { label: "First Week", value: 0x1 },
  { label: "Second Week", value: 0x2 },
  { label: "Third Week", value: 0x4 },
  { label: "Fourth Week", value: 0x8 },
  { label: "Last Week", value: 0x10 },
];

const taskInstancePolicyOptions = [
  { label: "Run in Parallel", value: 0 },
  { label: "Queue Task", value: 1 },
  { label: "Ignore", value: 2 },
  { label: "Stop Existing", value: 3 },
];

const plat_options = [
  { label: "Windows", value: "windows" },
  { label: "Linux", value: "linux" },
  { label: "macOS", value: "darwin" },
];

const props = defineProps<{
  parent: { policy: number } | { agent: string };
  task?: AutomatedTaskUI;
  plat: string;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup quasar dialog
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup dropdowns
const { scriptOptions, getScriptById } = useScriptDropdown();

const checkOptions = computed(() => {
  if ("policy" in props.parent) {
    const { policyCheckOptions } = usePolicyCheckDropdown(props.parent.policy);
    return policyCheckOptions.value;
  } else if ("agent" in props.parent) {
    const { agentCheckOptions } = useAgentCheckDropdown(props.parent.agent);
    return agentCheckOptions.value;
  }

  return [];
});

// setup stores
const taskStore = useTaskStore();

const { customFieldOptions } = useCustomFieldDropdown();

const isAgentTask = computed(() => {
  return !!props.plat;
});

// add task logic
const localTask = props.task
  ? reactive<AutomatedTaskUI>(Object.assign({}, props.task))
  : reactive<AutomatedTaskUI>({
      ...props.parent,
      id: 0,
      enabled: true,
      email_alert: false,
      text_alert: false,
      dashboard_alert: false,
      actions: [],
      assigned_check: null,
      custom_field: null,
      name: "",
      expire_date: null,
      run_time_date: formatDateInputField(Date.now()),
      run_time_bit_weekdays: [],
      weekly_interval: 1,
      daily_interval: 1,
      monthly_months_of_year: [],
      monthly_days_of_month: [],
      monthly_weeks_of_month: [],
      task_instance_policy: 0,
      task_repetition_interval: null,
      task_repetition_duration: null,
      stop_task_at_duration_end: false,
      random_task_delay: null,
      remove_if_not_scheduled: false,
      run_asap_after_missed: true,
      task_type: "daily",
      alert_severity: "info",
      collector_all_output: false,
      continue_on_error: true,
      task_supported_platforms: [] as AgentPlat[],
    });

const isPosix = computed(() => {
  return (
    (!!props.plat && props.plat !== "windows") ||
    localTask.task_supported_platforms?.includes("linux") ||
    localTask.task_supported_platforms?.includes("darwin")
  );
});

const task_supported_platforms = computed<AgentPlat[]>(() => {
  // if editing, keep value from api
  if (props.task) {
    return props.task.task_supported_platforms;
  }
  // default for new tasks (policy tasks only)
  if (!props.plat || !isPosix.value) {
    return ["windows"];
  } else if (props.plat === "linux") {
    return ["linux"];
  } else if (props.plat === "darwin") {
    return ["darwin"];
  }
  return [];
});

// set the default, have to do it this way to avoid circular dependency issue
localTask.task_supported_platforms = task_supported_platforms.value;

const custom_shell = ref("");
const monthlyType = ref("days");
const collector = ref(false);

// before-options check boxes that will select all options

// if all months is selected or cleared it will either clear the monthly_months_of_year array or add all options to it.
const allMonthsCheckbox = ref(false);
function toggleMonths() {
  localTask.monthly_months_of_year = allMonthsCheckbox.value
    ? monthOptions.map((month) => month.value)
    : [];
}

const allMonthDaysCheckbox = ref(false);
function toggleMonthDays() {
  localTask.monthly_days_of_month = allMonthDaysCheckbox.value
    ? dayOfMonthOptions.map((day) => day.value)
    : [];
}

const allWeekDaysCheckbox = ref(false);
function toggleWeekDays() {
  localTask.run_time_bit_weekdays = allWeekDaysCheckbox.value
    ? dayOfWeekOptions.map((day) => day.value)
    : [];
}

const action = reactive<TaskAction>({
  name: "",
  type: "script",
  script_args: [],
  env_vars: [],
  script: null,
  command: "",
  shell: "cmd",
  timeout: 90,
});

watch(
  () => action.script,
  (newValue) => {
    // populate script default into action
    if (newValue) {
      const script = getScriptById(newValue);

      if (script) {
        action.name = script.name;
        action.script_args = script.args;
        action.env_vars = script.env_vars;
        action.timeout = script.default_timeout;
      }
    }
  },
);

// function for adding script and commands to be run from task
function addAction() {
  if (action.type === "script" && (!action.script || !action.timeout)) {
    notifyError("Script and timeout must be set");
    return;
  } else if (action.type === "cmd" && (!action.command || !action.timeout)) {
    notifyError("A command and timeout must be set");
    return;
  }

  if (action.type === "script") {
    localTask.actions.push(action);
  } else if (action.type === "cmd") {
    if (action.shell === "custom" && custom_shell.value) {
      action.shell = custom_shell.value;
    }

    localTask.actions.push(action);

    // reset action
    action.name = "";
    action.type = "script";
    action.script_args = [];
    action.env_vars = [];
    action.script = null;
    action.command = "";
    action.shell = "cmd";
    action.timeout = 90;
  }
}

function removeAction(index: number) {
  localTask.actions.splice(index, 1);
}

async function submit() {
  taskStore.updateTask(localTask.id, localTask);
  taskStore.addTask(localTask);

  await until(() => taskStore.isLoading).toBe(false);

  if (taskStore.isError) return;
  onDialogOK();
}

watch(
  () => localTask.task_type,
  () => {
    localTask.assigned_check = null;
    localTask.run_time_bit_weekdays = [];
    localTask.remove_if_not_scheduled = false;
    localTask.task_repetition_interval = null;
    localTask.task_repetition_duration = null;
    localTask.stop_task_at_duration_end = false;
    localTask.random_task_delay = null;
    localTask.weekly_interval = 1;
    localTask.daily_interval = 1;
    localTask.monthly_months_of_year = [];
    localTask.monthly_days_of_month = [];
    localTask.monthly_weeks_of_month = [];
    localTask.task_instance_policy = 0;
    localTask.expire_date = null;
  },
);

// check the collector box when editing task and custom field is set
if (props.task && props.task.custom_field) collector.value = true;

// stepper logic
const stepper = useTemplateRef<QStepper>("stepper");
const taskGeneralForm = useTemplateRef<QForm>("taskGeneralForm");
const taskDetailForm = useTemplateRef<QForm>("taskDetailForm");

const step = ref(1);
const isValidStep1 = ref(true);
const isValidStep2 = ref(true);
const isValidStep3 = ref(true);

function validateStep(form: QForm, stepper: QStepper) {
  if (step.value === 1 && localTask.task_supported_platforms.length === 0) {
    notifyError("There must be at least one supported platform");
    return;
  }

  if (step.value === 2) {
    if (localTask.actions.length > 0) {
      isValidStep2.value = true;
      stepper.next();
      return;
    } else {
      notifyError("There must be at least one action");
    }

    // steps 1 or 3
  } else {
    void form.validate().then((result: boolean) => {
      if (step.value === 1) {
        isValidStep1.value = result;
        if (result) stepper.next();
      } else if (step.value === 3) {
        isValidStep3.value = result;
        if (result) void submit();
      }
    });
  }
}
</script>

<style scoped>
.ghost {
  opacity: 0.5;
}
</style>
