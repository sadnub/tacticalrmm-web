<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-bar>
        Update Agents
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>
      <q-separator />
      <q-banner class="bg-primary">
        <template #avatar>
          <q-icon name="info" />
        </template>
        If agent auto update is enabled in Global Settings, agents will automatically self update at
        35 min past the hour, every hour. Use this tool to manually trigger an agent update cycle.
      </q-banner>
      <q-card-section>
        Select Version
        <q-select
          v-model="state.version"
          square
          disable
          dense
          options-dense
          filled
          :options="state.versions"
        />
      </q-card-section>
      <q-card-section v-show="state.version !== null">
        Select Agent
        <br />
        <q-separator />
        <q-input
          v-model="state.search"
          dense
          outlined
          clearable
          debounce="100"
          placeholder="Search"
          class="q-my-sm"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>
        <q-checkbox
          v-model="state.selectAll"
          label="Select All"
          @update:model-value="selectAllAction"
        />
        <q-btn
          v-show="state.group.length !== 0"
          label="Update"
          color="primary"
          class="q-ml-xl"
          @click="sendAgentUpdate"
        />
        <q-separator />
        <q-option-group
          v-model="state.group"
          :options="agentOptions"
          color="green"
          type="checkbox"
          style="max-height: 60vh; max-width: 40vw"
          class="scroll"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, onMounted } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useAgentStore } from "src/stores/api";

const { updateAgentVersions, getAgentVersions } = useAgentStore();

// type imports
import type { Agent } from "../types";

// setup quasar plugins
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
defineEmits(useDialogPluginComponent.emits);

const state = reactive({
  versions: [] as string[],
  version: null as string | null,
  agents: [] as Agent[],
  group: [] as string[],
  selectAll: false,
  search: "",
});

const filteredAgents = computed(() => {
  const term = state.search?.toLowerCase().trim();

  if (!term) return state.agents;

  return state.agents.filter((agent) =>
    [agent.hostname, agent.client, agent.site, agent.agent_id].join(" ").toLowerCase().includes(term),
  );
});

const filteredAgentIds = computed(() => {
  return filteredAgents.value.map((agent) => agent.agent_id);
});

const agentOptions = computed(() => {
  const options = filteredAgents.value.map((i) => ({
    label: `${i.hostname} (${i.client} > ${i.site})`,
    value: i.agent_id,
  }));
  return options.sort((a, b) => a.label.localeCompare(b.label));
});

function selectAllAction() {
  if (state.selectAll) state.group = filteredAgentIds.value;
  else state.group = [];
}

async function sendAgentUpdate() {
  try {
    await updateAgentVersions(state.group);
    onDialogOK();
  } catch {
    //
  }
}

onMounted(async () => {
  const result = await getAgentVersions();

  if (result) {
    state.version = result.version;
    state.versions = result.versions;
    state.agents = result.agents;
  }
});
</script>
