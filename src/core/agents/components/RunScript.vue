<template>
  <q-dialog
    ref="dialogRef"
    no-backdrop-dismiss
    :maximized="maximized"
    @hide="onDialogHide"
    @keydown.esc="onDialogHide"
  >
    <q-card class="dialog-plugin" style="min-width: 60vw">
      <q-bar>
        Run a script on {{ agent.hostname }}
        <q-space />
        <q-btn dense flat icon="minimize" :disable="!maximized" @click="maximized = false">
          <q-tooltip v-if="maximized" class="bg-white text-primary">Minimize</q-tooltip>
        </q-btn>
        <q-btn dense flat icon="crop_square" :disable="maximized" @click="maximized = true">
          <q-tooltip v-if="!maximized" class="bg-white text-primary">Maximize</q-tooltip>
        </q-btn>
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-form @submit.prevent="sendScript">
        <q-card-section>
          <tactical-dropdown
            v-model="state.script"
            :rules="[(val: number) => !!val || '*Required']"
            :options="filterByPlatformOptions"
            label="Select script"
            filled
            map-options
            filterable
          >
            <template #after>
              <q-btn
                size="sm"
                round
                dense
                flat
                icon="info"
                @click="openScriptURL(selectedScript?.link)"
              >
                <q-tooltip
                  v-if="selectedScript && selectedScript.syntax"
                  class="bg-white text-primary text-body1"
                  >{{ selectedScript.syntax }}</q-tooltip
                >
              </q-btn>
            </template>
          </tactical-dropdown>
        </q-card-section>
        <q-card-section>
          <tactical-dropdown
            v-model="state.args"
            label="Script Arguments (press Enter after typing each argument)"
            filled
            use-input
            multiple
            hide-dropdown-icon
            input-debounce="0"
            new-value-mode="add"
          />
        </q-card-section>
        <q-card-section>
          <tactical-dropdown
            v-model="state.env_vars"
            :label="envVarsLabel"
            filled
            use-input
            multiple
            hide-dropdown-icon
            input-debounce="0"
            new-value-mode="add"
          />
        </q-card-section>
        <q-card-section v-if="!state.run_on_server">
          <q-option-group
            v-model="state.output"
            :options="outputOptions"
            color="primary"
            inline
            dense
          />
        </q-card-section>
        <q-card-section v-if="state.output === 'email'">
          <div class="q-gutter-sm">
            <q-radio
              v-model="state.emailMode"
              dense
              val="default"
              label="Use email addresses from global settings"
            />
            <q-radio v-model="state.emailMode" dense val="custom" label="Custom emails" />
          </div>
        </q-card-section>
        <q-card-section v-if="state.emailMode === 'custom' && state.output === 'email'">
          <tactical-dropdown
            v-model="state.emails"
            label="Email recipients (press Enter after typing each email)"
            filled
            use-input
            multiple
            hide-dropdown-icon
            input-debounce="0"
            new-value-mode="add"
          />
        </q-card-section>
        <q-card-section v-if="state.output === 'collector'">
          <tactical-dropdown
            v-model="state.custom_field"
            :rules="[(val: number) => !!val || '*Required']"
            filled
            :options="customFieldOptions"
            label="Select custom field"
            map-options
            filterable
          />
          <q-checkbox v-model="state.save_all_output" label="Save all output" />
        </q-card-section>
        <q-card-section>
          <q-checkbox
            v-if="agent.plat === 'windows' && !state.run_on_server"
            v-model="state.run_as_user"
            label="Run As User"
          >
            <q-tooltip>{{ runAsUserToolTip }}</q-tooltip>
          </q-checkbox>
          <q-checkbox
            v-if="!hosted"
            v-model="state.run_on_server"
            :disable="!serverScriptsEnabled"
            label="Run On Server"
            @update:model-value="ret = ''"
          >
            <q-tooltip v-if="!serverScriptsEnabled"
              >Enable server side scripts globally to activate this feature.</q-tooltip
            >
            <q-tooltip v-else
              >Run the script on the Tactical RMM server in the context of this agent.</q-tooltip
            >
          </q-checkbox>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="state.timeout"
            dense
            filled
            type="number"
            style="max-width: 150px"
            label="Timeout (seconds)"
            stack-label
            :rules="[(val) => !!val || '*Required', (val) => val >= 5 || 'Minimum is 5 seconds']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup label="Cancel" />
          <q-btn :loading="isLoading" label="Run" color="primary" type="submit" />
        </q-card-actions>
        <q-card-section
          v-if="ret"
          class="q-pl-md q-pr-md q-pt-none q-ma-none scroll"
          style="max-height: 50vh"
        >
          <script-output-copy-clip v-if="!state.run_on_server" label="Output" :data="String(ret)" />
          <q-separator />
          <pre v-if="!state.run_on_server">{{ ret }}</pre>
          <q-card-section v-if="typeof ret === 'object'" class="scroll">
            <div>
              Run Time:
              <code>{{ ret.execution_time }} seconds</code>
              <br />Return Code:
              <code>{{ ret.retcode }}</code>
              <br />
            </div>
            <br />
            <div v-if="ret.stdout">
              <script-output-copy-clip label="Standard Output" :data="ret.stdout" />
              <q-separator />
              <pre>{{ ret.stdout }}</pre>
            </div>
            <div v-if="ret.stderr">
              <script-output-copy-clip label="Standard Error" :data="ret.stderr" />
              <q-separator />
              <pre>{{ ret.stderr }}</pre>
            </div>
          </q-card-section>
        </q-card-section>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// composition imports
import { computed, reactive, ref, watch } from "vue";
import { useDialogPluginComponent, openURL } from "quasar";
import { useScriptDropdown } from "src/core/scripts/composables";
import { useCustomFieldDropdown } from "src/core/settings/composables";
import { useAgentStore, useDashboardStore } from "src/stores/api";

const { isLoading, runScript } = useAgentStore();
const { dashboardSettings } = useDashboardStore();
import { envVarsLabel, runAsUserToolTip } from "src/constants/constants";

//ui imports
import ScriptOutputCopyClip from "src/core/scripts/components/ScriptOutputCopyClip.vue";

// types
import type { Agent } from "src/core/agents/types";
import type { RunScriptRequest } from "../types";
import type { Script, ScriptResult } from "src/core/scripts/types";

const hosted = computed(() => dashboardSettings.hosted);
const serverScriptsEnabled = computed(() => dashboardSettings.serverScriptsEnabled);

// static data
const outputOptions = [
  { label: "Wait for Output", value: "wait" },
  { label: "Fire and Forget", value: "forget" },
  { label: "Email results", value: "email" },
  { label: "Save results to Custom Field", value: "collector" },
  { label: "Save results to Agent Notes", value: "note" },
];

// emits
defineEmits([...useDialogPluginComponent.emits]);

// props
const props = defineProps<{
  agent: Agent;
  script?: number;
}>();

// setup quasar dialog plugin
const { dialogRef, onDialogHide } = useDialogPluginComponent();

// setup dropdowns
const { filterByPlatformOptions, getScriptById } = useScriptDropdown(props.agent.plat);
const { customFieldOptions } = useCustomFieldDropdown();

// main run script functionaity
const state = reactive<RunScriptRequest>({
  output: "wait",
  emails: [],
  emailMode: "default",
  custom_field: null,
  save_all_output: false,
  script: props.script || null,
  args: [],
  env_vars: [],
  timeout: 30,
  run_as_user: false,
  run_on_server: false,
});

const ret = ref<ScriptResult | string>("");
const maximized = ref(false);

const selectedScript = ref<Script | null>(null);

watch(
  () => state.script,
  (newValue) => {
    if (newValue) {
      const script = getScriptById(newValue);

      selectedScript.value = script;

      if (script) {
        state.timeout = script.default_timeout;
        state.args = script.args;
        state.env_vars = script.env_vars;
      }
    } else {
      selectedScript.value = null;
      state.timeout = 30;
      state.args = [];
      state.env_vars = [];
    }
  },
  { immediate: true },
);

async function sendScript() {
  try {
    const response = await runScript(props.agent.agent_id, state);
    if (response === undefined) return;
    ret.value = response;
  } catch {
    //
  }

  if (state.output === "forget") {
    onDialogHide();
  }
}
function openScriptURL(link?: string) {
  if (link) openURL(link);
}

// watchers
watch([() => state.output, () => state.emailMode], () => (state.emails = []));
</script>
