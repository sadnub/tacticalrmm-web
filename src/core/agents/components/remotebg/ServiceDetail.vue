<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card style="width: 600px; max-width: 80vw">
      <q-bar>
        Service Details - {{ service.display_name }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close">
          <q-tooltip class="bg-white text-primary">Close</q-tooltip>
        </q-btn>
      </q-bar>

      <q-card-section>
        <div class="row">
          <div class="col-3">Service name:</div>
          <div class="col-9">{{ service.name }}</div>
        </div>
        <br />
        <div class="row">
          <div class="col-3">Display name:</div>
          <div class="col-9">{{ service.display_name }}</div>
        </div>
        <br />
        <div class="row">
          <div class="col-3">Description:</div>
          <div class="col-9">
            <q-field filled :color="$q.dark.isActive ? 'white' : 'black'">{{
              service.description
            }}</q-field>
          </div>
        </div>
        <br />
        <div class="row">
          <div class="col-3">Path:</div>
          <div class="col-9">
            <code>{{ service.binpath }}</code>
          </div>
        </div>
        <br />
        <br />
        <div class="row">
          <div class="col-3">Startup type:</div>
          <div class="col-5">
            <q-select
              v-model="startupType"
              dense
              options-dense
              filled
              :options="startupOptions"
              map-options
              emit-value
            />
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row">
          <div class="col-3">Service status:</div>
          <div class="col-9">{{ service.status }}</div>
        </div>
        <br />
        <div class="row">
          <q-btn-group color="primary" push>
            <q-btn
              label="Start"
              @click="agentStore.sendAgentServiceAction(agentId, service.name, 'start')"
            />
            <q-btn
              label="Stop"
              @click="agentStore.sendAgentServiceAction(agentId, service.name, 'stop')"
            />
            <q-btn
              label="Restart"
              @click="agentStore.sendAgentServiceAction(agentId, service.name, 'restart')"
            />
          </q-btn-group>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn v-close-popup flat dense label="Cancel" />
        <q-btn
          :loading="agentStore.isLoading"
          dense
          flat
          label="Save"
          color="primary"
          @click="agentStore.updateAgentService(agentId, service.name, startupType)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { ref, onMounted } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useAgentStore } from "../../api";
import type { AgentService, AgentServiceStartType } from "../../types";

// static data
const startupOptions = [
  {
    label: "Automatic (Delayed Start)",
    value: "autodelay",
  },
  {
    label: "Automatic",
    value: "automatic",
  },
  {
    label: "Manual",
    value: "manual",
  },
  {
    label: "Disabled",
    value: "disabled",
  },
];

const props = defineProps<{
  service: AgentService;
  agentId: string;
}>();

// setup stores
const agentStore = useAgentStore();

// setup quasar dialog plugin
const { dialogRef, onDialogHide } = useDialogPluginComponent();

// services detail
const startupType = ref<AgentServiceStartType>("disabled");

onMounted(() => {
  if (props.service.start_type.toLowerCase() === "automatic" && props.service.autodelay)
    startupType.value = "autodelay";
  else startupType.value = props.service.start_type;
});
</script>
