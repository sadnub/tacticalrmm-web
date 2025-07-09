<template>
  <div v-if="!agentStore.selectedAgentId" class="q-pa-sm">No agent selected</div>
  <div v-else-if="agentStore.isLoading" class="q-pa-md flex flex-center">
    <q-circular-progress indeterminate size="50px" color="primary" class="q-ma-md" />
  </div>
  <div v-else-if="agentStore.selectedAgent" class="q-pa-sm">
    <q-bar dense style="background-color: transparent">
      <q-btn dense flat size="md" class="q-mr-sm" icon="refresh" @click="refreshSummary" />
      <q-icon
        v-if="agentStore.selectedAgent.status === 'overdue'"
        name="fas fa-signal"
        size="1.2em"
        :color="dashNegativeColor"
        class="q-mr-sm"
      >
        <q-tooltip>Agent overdue</q-tooltip>
      </q-icon>
      <q-icon
        v-else-if="agentStore.selectedAgent.status === 'offline'"
        name="fas fa-signal"
        size="1.2em"
        :color="dashWarningColor"
        class="q-mr-sm"
      >
        <q-tooltip>{{ dashboardStore.formatDate(agentStore.selectedAgent.last_seen) }}</q-tooltip>
      </q-icon>
      <q-icon v-else name="fas fa-signal" size="1.2em" :color="dashPositiveColor" class="q-mr-sm">
        <q-tooltip>{{ dashboardStore.formatDate(agentStore.selectedAgent.last_seen) }}</q-tooltip>
      </q-icon>
      <b>{{ agentStore.selectedAgent.hostname }}</b>
      <span v-if="agentStore.selectedAgent.maintenance_mode">
        &bull; <q-badge color="green"> Maintenance Mode </q-badge>
      </span>
      &bull; {{ agentStore.selectedAgent.operating_system }} &bull; Agent v{{
        agentStore.selectedAgent.version
      }}
      <q-space />
      <q-btn
        dense
        flat
        label="Popout"
        icon="open_in_new"
        size="md"
        no-caps
        class="q-mr-sm"
        @click="
          agentStore.selectedAgentId && agentStore.openAgentWindow(agentStore.selectedAgentId)
        "
      />
      <q-btn
        dense
        flat
        label="Take Control"
        icon="computer"
        size="md"
        no-caps
        class="q-mr-sm"
        @click="agentStore.selectedAgentId && agentStore.runTakeControl(agentStore.selectedAgentId)"
      />
      <q-btn-dropdown dense flat size="md" no-caps label="Actions">
        <AgentActionMenu :agent="agentStore.selectedAgent" />
      </q-btn-dropdown>
    </q-bar>
    <q-separator class="q-mt-sm" />
    <div class="row">
      <div class="col-4">
        <!-- left -->
        <span class="text-subtitle2 text-bold">Hardware Details</span>
        <q-list dense>
          <q-item>
            <q-item-section avatar>
              <q-icon name="fas fa-desktop" />
            </q-item-section>
            <q-item-section>{{ agentStore.selectedAgent.make_model }}</q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="fas fa-microchip" />
            </q-item-section>
            <q-item-section>{{ cpu }}</q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="fas fa-memory" />
            </q-item-section>
            <q-item-section>{{ agentStore.selectedAgent.total_ram }} GB RAM</q-item-section>
          </q-item>

          <!-- physical disks -->
          <q-item v-for="disk in agentStore.selectedAgent.physical_disks" :key="disk">
            <q-item-section avatar>
              <q-icon name="far fa-hdd" />
            </q-item-section>
            <q-item-section>{{ disk }}</q-item-section>
          </q-item>
          <!-- graphics -->
          <q-item>
            <q-item-section avatar>
              <q-icon name="fas fa-tv" />
            </q-item-section>
            <q-item-section>{{ agentStore.selectedAgent.graphics }}</q-item-section>
          </q-item>
          <!-- serial -->
          <q-item v-if="serial_number">
            <q-item-section avatar>
              <q-icon name="fa-solid fa-barcode" />
            </q-item-section>
            <q-item-section>{{ serial_number }}</q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="fas fa-globe-americas" />
            </q-item-section>
            <q-item-section>Public IP: {{ agentStore.selectedAgent.public_ip }}</q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="fas fa-network-wired" />
            </q-item-section>
            <q-item-section>LAN IP: {{ agentStore.selectedAgent.local_ips }}</q-item-section>
          </q-item>
        </q-list>
      </div>
      <div class="col-2">
        <span class="text-subtitle2 text-bold">Checks Status</span>
        <br />
        <div v-if="agentStore.selectedAgent.checks.total !== 0">
          <q-chip v-if="agentStore.selectedAgent.checks.passing" square size="lg">
            <q-avatar size="lg" square icon="done" :color="dashPositiveColor" text-color="white" />
            <small>{{ agentStore.selectedAgent.checks.passing }} checks passing</small>
          </q-chip>
          <q-chip v-if="agentStore.selectedAgent.checks.failing" square size="lg">
            <q-avatar
              size="lg"
              square
              icon="cancel"
              :color="dashNegativeColor"
              text-color="white"
            />
            <small>{{ agentStore.selectedAgent.checks.failing }} checks failing</small>
          </q-chip>
          <q-chip v-if="agentStore.selectedAgent.checks.warning" square size="lg">
            <q-avatar
              size="lg"
              square
              icon="warning"
              :color="dashWarningColor"
              text-color="white"
            />
            <small>{{ agentStore.selectedAgent.checks.warning }} checks warning</small>
          </q-chip>
          <q-chip v-if="agentStore.selectedAgent.checks.info" square size="lg">
            <q-avatar size="lg" square icon="info" :color="dashInfoColor" text-color="white" />
            <small>{{ agentStore.selectedAgent.checks.info }} checks info</small>
          </q-chip>
          <span
            v-if="
              agentStore.selectedAgent.checks.total !== 0 &&
              agentStore.selectedAgent.checks.passing === 0 &&
              agentStore.selectedAgent.checks.failing === 0 &&
              agentStore.selectedAgent.checks.warning === 0 &&
              agentStore.selectedAgent.checks.info === 0
            "
            >{{ agentStore.selectedAgent.checks.total }} checks awaiting first synchronization</span
          >
        </div>
        <div v-else>No checks</div>

        <span v-if="customFields.length > 0" class="text-subtitle2 text-bold block q-mt-xl"
          >Custom Fields</span
        >
        <q-list dense>
          <q-item v-for="field in customFields" :key="field.name">
            <q-item-section thumbnail>
              <q-icon name="fas fa-user" size="xs" />
            </q-item-section>
            <q-item-section>{{ field.name }}: {{ field.value.value }}</q-item-section>
          </q-item>
        </q-list>
      </div>
      <div class="col-1"></div>
      <!-- right -->
      <div class="col-3">
        <span class="text-subtitle2 text-bold">Disks</span>
        <div v-for="(disk, i) in disks" :key="i">
          <span>{{ disk.device }} ({{ disk.fstype }})</span>
          <q-linear-progress
            rounded
            size="15px"
            :value="disk.percent / 100"
            :color="diskBarColor(disk.percent)"
            class="q-mt-sm"
          />
          <span>{{ disk.free }} free of {{ disk.total }}</span>
          <q-separator />
        </div>
      </div>
      <div class="col-2"></div>
    </div>
    <q-inner-loading :showing="agentStore.isLoading" color="primary" />
  </div>
</template>

<script lang="ts" setup>
// composition imports
import { computed, watch, onMounted } from "vue";
import { useAgentStore } from "../../api";
import { useCustomFieldStore } from "src/core/settings/api";
import { useDashboardStore } from "src/stores/dashboard";

// ui imports
import AgentActionMenu from "../AgentActionMenu.vue";

// setup stores
const agentStore = useAgentStore();
const customFieldStore = useCustomFieldStore();
const dashboardStore = useDashboardStore();

const dashInfoColor = computed(() => dashboardStore.dashboardSettings.dashInfoColor);
const dashPositiveColor = computed(() => dashboardStore.dashboardSettings.dashPositiveColor);
const dashNegativeColor = computed(() => dashboardStore.dashboardSettings.dashNegativeColor);
const dashWarningColor = computed(() => dashboardStore.dashboardSettings.dashWarningColor);

const serial_number = computed(() => {
  if (agentStore.selectedAgent?.plat === "windows") {
    return agentStore.selectedAgent?.wmi_detail?.bios?.[0]?.[0].SerialNumber || "";
  } else {
    return agentStore.selectedAgent?.wmi_detail?.serialnumber || "";
  }
});

const cpu = computed(() => {
  if (agentStore.selectedAgent?.cpu_model && agentStore.selectedAgent?.cpu_model?.length > 1) {
    return `${agentStore.selectedAgent?.cpu_model.length}x ${agentStore.selectedAgent?.cpu_model[0]}`;
  }
  return agentStore.selectedAgent?.cpu_model[0];
});

function diskBarColor(percent: number) {
  if (percent < 80) {
    return dashPositiveColor.value;
  } else if (percent >= 80 && percent < 95) {
    return dashWarningColor.value;
  } else {
    return dashNegativeColor.value;
  }
}

const disks = computed(() => {
  if (!agentStore.selectedAgent?.disks) {
    return [];
  }

  const entries = Object.entries(agentStore.selectedAgent.disks);
  const ret = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_, v] of entries) {
    ret.push(v);
  }
  return ret;
});

const customFields = computed(() => {
  if (!agentStore.selectedAgent?.custom_fields) {
    return [];
  }
  if (!customFieldStore.customFields) {
    return [];
  }
  const ret = [];
  for (const customField of agentStore.selectedAgent.custom_fields) {
    const definition = customFieldStore.customFields.find((def) => def.id === customField.field);
    if (definition && !definition.hide_in_summary) {
      ret.push({
        name: definition.name,
        value: customField,
      });
    }
  }

  return ret;
});

function refreshSummary() {
  if (agentStore.selectedAgentId) {
    agentStore.getAgent(agentStore.selectedAgentId);
    agentStore.refreshAgentWMI(agentStore.selectedAgentId);
  }
}

watch(
  () => agentStore.selectedAgentId,
  (newValue) => {
    if (newValue) {
      agentStore.getAgent(newValue);
    }
  },
);

onMounted(() => {
  if (agentStore.selectedAgentId) agentStore.getAgent(agentStore.selectedAgentId);
});
</script>
