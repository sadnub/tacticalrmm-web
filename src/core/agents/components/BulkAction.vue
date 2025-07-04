<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="q-dialog-plugin" style="min-width: 50vw">
      <q-bar>
        {{ modalTitle }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>
      <q-form @submit.prevent="submit">
        <q-card-section>
          <p>Choose Target</p>
          <q-option-group
            v-model="state.target"
            :options="targetOptions"
            color="primary"
            dense
            inline
            class="q-pl-sm"
          />
        </q-card-section>

        <q-card-section>
          <tactical-dropdown
            v-if="state.target === 'client'"
            v-model="state.client"
            :rules="[(val: number) => !!val || '*Required']"
            :options="clientOptions"
            label="Select Client"
            filled
            map-options
            filterable
          />
          <tactical-dropdown
            v-else-if="state.target === 'site'"
            v-model="state.site"
            :rules="[(val: number) => !!val || '*Required']"
            :options="siteOptions"
            label="Select Site"
            filled
            map-options
            filterable
          />
          <tactical-dropdown
            v-else-if="state.target === 'agents'"
            v-model="state.agents"
            :rules="[(val: string[]) => !!val || '*Required']"
            :options="agentOptions"
            label="Select Agents"
            filled
            multiple
            map-options
            filterable
          />
        </q-card-section>

        <q-card-section>
          <p>Agent OS</p>
          <q-option-group
            v-model="state.osType"
            :options="filteredOsTypeOptions"
            color="primary"
            dense
            inline
            class="q-pl-sm"
          />
        </q-card-section>

        <q-card-section v-show="state.target !== 'agents'">
          <p>Agent Type</p>
          <q-option-group
            v-model="state.monType"
            :options="monTypeOptions"
            color="primary"
            dense
            inline
            class="q-pl-sm"
          />
        </q-card-section>

        <q-card-section v-if="mode === 'script'" class="q-pt-none">
          <tactical-dropdown
            v-model="state.script"
            :rules="[(val: string) => !!val || '*Required']"
            :options="scriptOptions"
            label="Select Script"
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
        <q-card-section v-if="mode === 'script'" class="q-pt-none">
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
        <q-card-section v-if="mode === 'script'" class="q-pt-none">
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

        <q-card-section v-if="mode === 'command'">
          <p>Shell</p>
          <q-option-group
            v-model="state.shell"
            :options="shellOptions"
            color="primary"
            dense
            inline
            class="q-pl-sm"
            @update:model-value="state.custom_shell = null"
          />
        </q-card-section>
        <q-card-section v-if="state.shell === 'custom'">
          <q-input
            v-model="state.custom_shell"
            filled
            label="Custom shell"
            stack-label
            placeholder="/usr/bin/python3"
            :rules="[(val) => !!val || '*Required']"
          />
        </q-card-section>
        <q-card-section v-if="mode === 'command'">
          <q-input
            v-model="state.cmd"
            filled
            label="Command"
            stack-label
            :placeholder="cmdPlaceholder(state.shell)"
            :rules="[(val) => !!val || '*Required']"
          />
        </q-card-section>
        <q-card-section v-if="supportsRunAsUser()" class="q-pt-none">
          <q-checkbox v-model="state.run_as_user" label="Run As User">
            <q-tooltip>{{ runAsUserToolTip }}</q-tooltip>
          </q-checkbox>
        </q-card-section>

        <q-card-section v-if="mode === 'script'" class="q-pt-none">
          <div class="q-gutter-sm">
            <q-checkbox
              v-model="collector"
              label="Save results to Custom Field"
              @update:model-value="
                state.custom_field = null;
                state.collector_all_output = false;
              "
            />
            <q-checkbox v-model="state.save_to_agent_note" label="Save results to Agent Note" />
          </div>
        </q-card-section>

        <q-card-section v-if="mode === 'script' && collector">
          <tactical-dropdown
            v-model="state.custom_field"
            :rules="[(val: number) => !!val || '*Required']"
            filled
            :options="customFieldOptions"
            label="Select custom field"
            map-options
            filterable
          />
          <q-checkbox v-model="state.collector_all_output" label="Save all output" />
        </q-card-section>

        <q-card-section v-if="mode === 'script' || mode === 'command'">
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

        <q-card-section v-if="mode === 'patch'">
          <p>Action</p>
          <q-option-group
            v-model="state.patchMode"
            :options="patchModeOptions"
            color="primary"
            dense
            inline
            class="q-pl-sm"
          />
        </q-card-section>

        <q-card-section v-show="false">
          <q-checkbox v-model="state.offlineAgents" label="Offline Agents (Run on next checkin)">
            <q-tooltip
              >If the agent is offline, a pending action will be created to run on agent
              checkin</q-tooltip
            >
          </q-checkbox>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup label="Cancel" />
          <q-btn label="Run" color="primary" type="submit" :loading="agentStore.isLoading" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { ref, reactive, computed, watch } from "vue";
import { useDialogPluginComponent, openURL } from "quasar";
import { useScriptDropdown } from "src/core/scripts/composables";
import { useAgentDropdown } from "src/core/agents/composables";
import { useClientDropdown, useSiteDropdown } from "src/core/clients/composables";
import { useCustomFieldDropdown } from "src/core/settings/composables";
import { useAgentStore } from "../api";
import { cmdPlaceholder } from "src/core/agents/composables";
import { envVarsLabel, runAsUserToolTip } from "src/constants/constants";
import { until } from "@vueuse/shared";

// type imports
import type { BulkActionMode, RunBulkActionRequest } from "../types";

// static data
const monTypeOptions = [
  { label: "All", value: "all" },
  { label: "Servers", value: "servers" },
  { label: "Workstations", value: "workstations" },
];

const osTypeOptions = [
  { label: "Windows", value: "windows" },
  { label: "Linux", value: "linux" },
  { label: "macOS", value: "darwin" },
  { label: "All", value: "all" },
];

const targetOptions = [
  { label: "Client", value: "client" },
  { label: "Site", value: "site" },
  { label: "Selected Agents", value: "agents" },
  { label: "All", value: "all" },
];

const patchModeOptions = [
  { label: "Scan", value: "scan" },
  { label: "Install", value: "install" },
];

const props = defineProps<{
  mode: BulkActionMode;
}>();

defineEmits(useDialogPluginComponent.emits);

const shellOptions = computed(() => {
  if (state.osType === "windows") {
    return [
      { label: "CMD", value: "cmd" },
      { label: "Powershell", value: "powershell" },
    ];
  } else {
    return [
      { label: "Bash", value: "/bin/bash" },
      { label: "Custom", value: "custom" },
    ];
  }
});

const filteredOsTypeOptions = computed(() => {
  if (props.mode === "command") return osTypeOptions.filter((i) => i.value !== "all");
  else if (props.mode === "patch") return osTypeOptions.filter((i) => i.value === "windows");
  return osTypeOptions;
});

// quasar dialog setup
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

// setup stores
const agentStore = useAgentStore();

function openScriptURL(link?: string) {
  if (link) openURL(link);
}

// bulk action logic
const state = reactive<RunBulkActionRequest>({
  mode: props.mode,
  target: "client",
  monType: "all",
  osType: "windows",
  cmd: "",
  shell: "cmd",
  custom_shell: null,
  custom_field: null,
  collector_all_output: false,
  save_to_agent_note: false,
  patchMode: "scan",
  offlineAgents: false,
  client: null,
  site: null,
  agents: [],
  script: null,
  timeout: 30,
  args: [],
  env_vars: [],
  run_as_user: false,
});

// dropdown setup
const { getScriptById } = useScriptDropdown();

const scriptOptions = computed(() => {
  const { filterByPlatformOptions } = useScriptDropdown(state.osType);
  return filterByPlatformOptions.value;
});

const { agentOptions } = useAgentDropdown();
const { siteOptions } = useSiteDropdown();
const { clientOptions } = useClientDropdown();
const { customFieldOptions } = useCustomFieldDropdown();

const selectedScript = computed(() => {
  if (state.script) return getScriptById(state.script);
  else return undefined;
});

watch(selectedScript, (newValue) => {
  if (newValue) {
    state.timeout = newValue?.default_timeout;
    state.args = newValue.args;
    state.env_vars = newValue.env_vars;
  }
});

const collector = ref(false);

watch(
  () => state.target,
  () => {
    state.client = null;
    state.site = null;
    state.agents = [];
  },
);

watch(
  () => state.osType,
  (newValue) => {
    state.custom_shell = null;
    state.run_as_user = false;

    if (newValue === "windows") {
      state.shell = "cmd";
    } else {
      state.shell = "/bin/bash";
    }
  },
);

async function submit() {
  agentStore.runBulkAction(state);

  await until(() => agentStore.isLoading).toBe(false);

  if (agentStore.isError) return;

  onDialogOK();
}

const supportsRunAsUser = () => {
  const modes = ["script", "command"];
  return state.osType === "windows" && modes.includes(state.mode);
};

// set modal title and caption
const modalTitle = computed(() => {
  return props.mode === "command"
    ? "Run Bulk Command"
    : props.mode === "script"
      ? "Run Bulk Script"
      : props.mode === "patch"
        ? "Bulk Patch Management"
        : "";
});
</script>
