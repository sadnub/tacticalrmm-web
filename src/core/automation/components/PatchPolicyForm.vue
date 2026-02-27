<template>
  <q-card flat>
    <q-form @submit.prevent="submit">
      <div class="row items-center q-py-xs">
        <div class="col-3">Severity</div>
        <div class="col-4"></div>
        <div class="col-5">Action</div>
      </div>
      <div class="row items-center q-py-xs">
        <div class="col-3">Critical:</div>
        <div class="col-4"></div>
        <q-select
          v-model="winupdatepolicy.critical"
          dense
          class="col-5"
          filled
          :options="severityOptions"
          emit-value
          map-options
        />
      </div>
      <div class="row items-center q-py-xs">
        <div class="col-3">Important:</div>
        <div class="col-4"></div>
        <q-select
          v-model="winupdatepolicy.important"
          dense
          class="col-5"
          filled
          :options="severityOptions"
          emit-value
          map-options
        />
      </div>
      <div class="row items-center q-py-xs">
        <div class="col-3">Moderate:</div>
        <div class="col-4"></div>
        <q-select
          v-model="winupdatepolicy.moderate"
          dense
          class="col-5"
          filled
          :options="severityOptions"
          emit-value
          map-options
        />
      </div>
      <div class="row items-center q-py-xs">
        <div class="col-3">Low:</div>
        <div class="col-4"></div>
        <q-select
          v-model="winupdatepolicy.low"
          dense
          class="col-5"
          filled
          :options="severityOptions"
          emit-value
          map-options
        />
      </div>
      <div class="row items-center q-py-xs">
        <div class="col-3">Other:</div>
        <div class="col-4"></div>
        <q-select
          v-model="winupdatepolicy.other"
          dense
          class="col-5"
          filled
          :options="severityOptions"
          emit-value
          map-options
        />
      </div>
      <div>
        <!-- Installation Schedule -->
        <div class="row items-center q-mt-md q-mb-xs">
          <div class="text-subtitle2">Installation Schedule</div>
        </div>
        <q-separator />
        <div class="row items-center q-py-xs">
          <div class="col-3">Schedule Frequency:</div>
          <div class="col-4"></div>
          <q-select
            v-model="winupdatepolicy.run_time_frequency"
            dense
            class="col-5"
            filled
            :options="frequencyOptions"
            emit-value
            map-options
          />
        </div>
        <div v-if="winupdatepolicy.run_time_frequency === 'monthly'" class="row items-center q-py-xs">
          <div class="col-3">Day of month to run:</div>
          <div class="col-4"></div>
          <q-select
            v-model="winupdatepolicy.run_time_day"
            dense
            class="col-5"
            filled
            :options="monthDays"
            emit-value
            map-options
          />
        </div>
        <div v-show="winupdatepolicy.run_time_frequency !== 'inherit'" class="row items-center q-py-xs">
          <div class="col-3">Scheduled Time:</div>
          <div class="col-4"></div>
          <q-select
            v-model="winupdatepolicy.run_time_hour"
            dense
            class="col-5"
            filled
            :options="timeOptions"
            emit-value
            map-options
          />
        </div>
        <div v-if="winupdatepolicy.run_time_frequency in ['inherit', 'daily']" class="row items-center q-py-xs">
          <div class="q-gutter-sm">
            <q-checkbox v-model="winupdatepolicy.run_time_days" :val="0" label="Monday" />
            <q-checkbox v-model="winupdatepolicy.run_time_days" :val="1" label="Tuesday" />
            <q-checkbox v-model="winupdatepolicy.run_time_days" :val="2" label="Wednesday" />
            <q-checkbox v-model="winupdatepolicy.run_time_days" :val="3" label="Thursday" />
            <q-checkbox v-model="winupdatepolicy.run_time_days" :val="4" label="Friday" />
            <q-checkbox v-model="winupdatepolicy.run_time_days" :val="5" label="Saturday" />
            <q-checkbox v-model="winupdatepolicy.run_time_days" :val="6" label="Sunday" />
          </div>
        </div>
        <div class="row items-center q-mt-md q-mb-xs">
          <div class="text-subtitle2">Reboot After Installation</div>
        </div>
        <q-separator />
        <div class="row items-center q-py-xs">
          <div class="col-3"></div>
          <div class="col-4"></div>
          <q-select
            v-model="winupdatepolicy.reboot_after_install"
            dense
            class="col-5"
            filled
            :options="rebootOptions"
            emit-value
            map-options
          />
        </div>
        <div class="row items-center q-mt-md q-mb-xs">
          <div class="text-subtitle2">Failed Patches</div>
        </div>
        <q-separator />
        <div v-if="!policy" class="row items-center q-py-xs">
          <div class="col-5">
            <q-checkbox
              v-model="winupdatepolicy.reprocess_failed_inherit"
              label="Inherit failed patch settings"
            />
          </div>
        </div>
        <div v-show="!winupdatepolicy.reprocess_failed_inherit" class="row items-center q-py-xs">
          <div class="col-5">
            <q-checkbox
              v-model="winupdatepolicy.reprocess_failed"
              label="Reprocess failed patches"
            />
          </div>

          <div class="col-3">
            <q-input
              v-model.number="winupdatepolicy.reprocess_failed_times"
              dense
              type="number"
              filled
              label="Times"
              :rules="[(val) => val > 0 || 'Must be greater than 0']"
            />
          </div>
          <div class="col-3"></div>
          <q-checkbox
            v-model="winupdatepolicy.email_if_fail"
            label="Send an email when patch installation fails"
          />
        </div>
      </div>
      <q-card-actions v-if="policy" align="left">
        <q-btn label="Submit" color="primary" type="submit" />
        <q-btn label="Cancel" @click="$emit('hide')" />
        <q-space />
        <q-btn
          v-if="editing"
          label="Remove Policy"
          color="negative"
          @click="deletePolicy(winupdatepolicy)"
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useQuasar } from "quasar";
import { usePatchPolicyStore } from "src/stores/api";

const { updatePatchPolicy, addPatchPolicy, deletePatchPolicy } = usePatchPolicyStore();
import type { WinPatchPolicy, Policy } from "../types";
import type { Agent } from "src/core/agents/types";

const props = defineProps<{
  policy?: Policy;
  agent?: Agent;
}>();

const emit = defineEmits(["hide"]);
const $q = useQuasar();

const editing = ref(false);

const winupdatepolicy = ref<WinPatchPolicy>({
  critical: "ignore",
  important: "ignore",
  moderate: "ignore",
  low: "ignore",
  other: "ignore",
  run_time_hour: 3,
  run_time_frequency: "daily",
  run_time_days: [],
  run_time_day: 1,
  reboot_after_install: "never",
  reprocess_failed_inherit: false,
  reprocess_failed: false,
  reprocess_failed_times: 5,
  email_if_fail: false,
});

const severityOptions = ref([
  { label: "Manual", value: "manual" },
  { label: "Approve", value: "approve" },
  { label: "Ignore", value: "ignore" },
]);
const frequencyOptions = ref([
  { label: "Daily/Weekly", value: "daily" },
  { label: "Monthly", value: "monthly" },
]);
const rebootOptions = ref([
  { label: "Never", value: "never" },
  { label: "When Required", value: "required" },
  { label: "Always", value: "always" },
]);

const timeOptions = ref(Array.from({ length: 24 }, (_, i) => i));
const monthDays = ref(Array.from({ length: 31 }, (_, i) => i + 1));

if (props.policy) {
  if (props.policy.winupdatepolicy && props.policy.winupdatepolicy[0]) {
    winupdatepolicy.value = { ...props.policy.winupdatepolicy[0] };
    editing.value = true;
  } else {
    winupdatepolicy.value = {
      ...winupdatepolicy.value,
      policy: props.policy.id,
    };
    editing.value = false;
  }
}

if (props.agent) {
  if (props.agent.winupdatepolicy && props.agent.winupdatepolicy[0]) {
    winupdatepolicy.value = { ...props.agent.winupdatepolicy[0] };
  }

  severityOptions.value.push({ label: "Inherit", value: "inherit" });
  frequencyOptions.value.push({ label: "Inherit", value: "inherit" });
  rebootOptions.value.push({ label: "Inherit", value: "inherit" });
}

async function submit() {
  try {
    if (editing.value) {
      await updatePatchPolicy(winupdatepolicy.value);
    } else {
      await addPatchPolicy(winupdatepolicy.value);
    }
    emit("hide");
  } catch {
    //
  }
}

function deletePolicy(patchPolicy: WinPatchPolicy) {
  $q.dialog({
    title: "Delete patch policy?",
    cancel: true,
    ok: { label: "Delete", color: "negative" },
  }).onOk(() => {
    if (!patchPolicy.id) return;
    void deletePatchPolicy(patchPolicy.id, patchPolicy.policy);
    emit("hide");
  });
}
</script>
