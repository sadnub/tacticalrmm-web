<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="width: 60vw">
      <q-bar>
        {{ check ? "Edit Event Log Check" : "Add Event Log Check" }}
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-form @submit.prevent="submit">
        <div style="max-height: 70vh" class="scroll">
          <q-card-section>
            <q-input
              dense
              filled
              v-model="localCheck.name"
              label="Descriptive Name"
              :rules="[(val) => !!val || '*Required']"
            />
          </q-card-section>
          <q-card-section>
            <q-select
              dense
              options-dense
              filled
              v-model="localCheck.log_name"
              :options="logNameOptions"
              label="Event log to query"
            />
          </q-card-section>
          <q-card-section>
            <q-select
              dense
              options-dense
              filled
              v-model="localCheck.fail_when"
              :options="failWhenOptions"
              label="Fail When"
              emit-value
              map-options
            />
          </q-card-section>
          <q-card-section>
            <q-input
              dense
              filled
              v-model="localCheck.event_id"
              label="Event ID (Use * to match every event ID)"
              :rules="[(val) => validateEventID(val) || 'Invalid Event ID']"
            />
          </q-card-section>
          <q-card-section>
            <q-checkbox v-model="eventSource" label="Event source" />
            <q-input dense filled v-model="localCheck.event_source" :disable="!eventSource" />
          </q-card-section>
          <q-card-section>
            <q-checkbox v-model="eventMessage" label="Message contains string" />
            <q-input dense filled v-model="localCheck.event_message" :disable="!eventMessage" />
          </q-card-section>
          <q-card-section>
            <q-input
              dense
              filled
              v-model.number="localCheck.search_last_day"
              label="How many previous days to search (Enter 0 for the entire log)"
              :rules="[
                (val) => !!val.toString() || '*Required',
                (val) => val >= 0 || 'Min 0',
                (val) => val <= 9999 || 'Max 9999',
              ]"
            />
          </q-card-section>
          <q-card-section>
            <span>Event Type:</span>
            <div class="q-gutter-sm">
              <q-radio dense v-model="localCheck.event_type" val="INFO" label="Information" />
              <q-radio dense v-model="localCheck.event_type" val="WARNING" label="Warning" />
              <q-radio dense v-model="localCheck.event_type" val="ERROR" label="Error" />
              <q-radio
                dense
                v-model="localCheck.event_type"
                val="AUDIT_SUCCESS"
                label="Success Audit"
              />
              <q-radio
                dense
                v-model="localCheck.event_type"
                val="AUDIT_FAILURE"
                label="Failure Audit"
              />
            </div>
          </q-card-section>
          <q-card-section>
            <q-select
              filled
              dense
              options-dense
              map-options
              emit-value
              v-model="localCheck.alert_severity"
              :options="severityOptions"
              label="Alert Severity"
            />
          </q-card-section>
          <q-card-section>
            <q-input
              label="Number of events found before alert"
              dense
              filled
              type="number"
              v-model.number="localCheck.number_of_events_b4_alert"
            />
          </q-card-section>
          <q-card-section>
            <q-select
              filled
              dense
              options-dense
              v-model="localCheck.fails_b4_alert"
              :options="failOptions"
              label="Number of consecutive failures before alert"
            />
          </q-card-section>
          <q-card-section>
            <q-input
              filled
              dense
              type="number"
              v-model.number="localCheck.run_interval"
              label="Run this check every (seconds)"
              hint="Setting this value to anything other than 0 will override the 'Run checks every' setting on the agent"
            />
          </q-card-section>
        </div>
        <q-card-actions align="right">
          <q-btn dense flat label="Cancel" v-close-popup />
          <q-btn
            :loading="checkStore.isLoading"
            dense
            flat
            label="Save"
            color="primary"
            type="submit"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { ref, watch, reactive } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useCheckStore } from "../api";
import { failOptions, severityOptions } from "../composables";
import { validateEventID } from "src/utils/validation";

// import types
import type { Check } from "../types";
import type { Agent } from "src/core/agents/types";
import type { Policy } from "src/core/automation/types";
import { until } from "@vueuse/core";

const logNameOptions = ["Application", "System", "Security"];

const failWhenOptions = [
  { label: "Log contains", value: "contains" },
  { label: "Log does not contain", value: "not_contains" },
];

const props = defineProps<{
  check?: Check;
  parent: Agent | Policy;
}>();

defineEmits(useDialogPluginComponent.emits);

// setup stores
const checkStore = useCheckStore();

// setup quasar dialog
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// check logic
const localCheck = props.check
  ? reactive<Check>(Object.assign({}, props.check))
  : reactive<Check>({
      ...props.parent,
      check_type: "eventlog",
      log_name: "Application",
      event_id: 0,
      event_source: null,
      event_message: null,
      event_type: "INFO",
      fail_when: "contains",
      search_last_day: 1,
      fails_b4_alert: 1,
      number_of_events_b4_alert: 1,
      event_id_is_wildcard: false,
      alert_severity: "warning",
      run_interval: 0,
    });

const eventMessage = ref(false);
const eventSource = ref(false);

// set check boxes on load
if (props.check) {
  if (localCheck.event_id_is_wildcard) {
    localCheck.event_id = "*";
  }
  if (localCheck.event_source) {
    eventSource.value = true;
  }
  if (localCheck.event_message) {
    eventMessage.value = true;
  }
}

watch(eventMessage, () => {
  localCheck.event_message = null;
});

watch(eventSource, () => {
  localCheck.event_source = null;
});

async function submit() {
  // format check data for saving
  localCheck.event_id_is_wildcard = localCheck.event_id === "*" ? true : false;
  if (localCheck.event_source === "") localCheck.event_source = null;
  if (localCheck.event_message === "") localCheck.event_message = null;

  if (props.check) checkStore.updateCheck(localCheck.id, localCheck);
  else checkStore.addCheck(localCheck);

  // stops the dialog from closing when there is an error
  await until(() => checkStore.isLoading).toBe(false);
  if (checkStore.isError) return;

  onDialogOK();
}
</script>
