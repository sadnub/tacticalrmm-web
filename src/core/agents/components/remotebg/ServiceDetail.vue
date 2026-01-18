<template>
  <q-dialog ref="dialogRef" no-backdrop-dismiss @hide="onDialogHide">
    <q-card style="width: 600px; max-width: 80vw">
      <q-bar>
        Service Details - {{ localService.display_name }}
        <q-space />
        <q-btn v-close-popup dense flat icon="close" />
      </q-bar>

      <q-card-section>
        <div class="row">
          <div class="col-3">Service name:</div>
          <div class="col-9">{{ localService.name }}</div>
        </div>
        <br />
        <div class="row">
          <div class="col-3">Display name:</div>
          <div class="col-9">{{ localService.display_name }}</div>
        </div>
        <br />
        <div class="row">
          <div class="col-3">Description:</div>
          <div class="col-9">
            <q-field filled :color="$q.dark.isActive ? 'white' : 'black'">{{
              localService.description
            }}</q-field>
          </div>
        </div>
        <br />
        <div class="row">
          <div class="col-3">Path:</div>
          <div class="col-9">
            <code>{{ localService.binpath }}</code>
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
          <div class="col-9">{{ localService.status }}</div>
        </div>
        <br />
        <div class="row q-gutter-sm">
          <q-btn
            color="primary"
            label="Start"
            :disable="
              localService.start_type.toLowerCase() === 'disabled' ||
              localService.status === 'running'
            "
            @click="sendServiceAction('start')"
          />
          <q-btn
            color="primary"
            label="Stop"
            :disable="localService.status !== 'running'"
            @click="sendServiceAction('stop')"
          />
          <q-btn
            color="primary"
            label="Restart"
            :disable="localService.status !== 'running'"
            @click="sendServiceAction('restart')"
          />
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn v-close-popup flat dense label="Cancel" />
        <q-btn :loading="isLoading" dense flat label="Save" color="primary" @click="submit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
// composition imports
import { ref, onMounted } from "vue";
import { useDialogPluginComponent } from "quasar";
import { useAgentStore } from "src/stores/api";

const agentStore = useAgentStore();
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
const { isLoading } = agentStore;

// setup quasar dialog plugin
defineEmits(useDialogPluginComponent.emits);
const { dialogRef, onDialogHide } = useDialogPluginComponent();

// services detail
const localService = ref<AgentService>({ ...props.service });

const startupType = ref<AgentServiceStartType>("disabled");

async function submit() {
  try {
    await agentStore.updateAgentService(
      props.agentId,
      props.service.name,
      startupType.value === "automatic" ? "auto" : startupType.value,
    );
    onDialogHide();
  } catch {
    //
  }
}

async function sendServiceAction(action: "start" | "stop" | "restart") {
  try {
    const service = await agentStore.sendAgentServiceAction(
      props.agentId,
      props.service.name,
      action,
    );
    if (service) {
      localService.value = service;

      if (service.start_type.toLowerCase() === "automatic" && service.autodelay)
        startupType.value = "autodelay";
      else startupType.value = service.start_type;
    }
  } catch {
    //
  }
}
onMounted(() => {
  if (props.service.start_type.toLowerCase() === "automatic" && props.service.autodelay)
    startupType.value = "autodelay";
  else startupType.value = props.service.start_type;
});
</script>
