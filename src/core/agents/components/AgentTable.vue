<template>
  <div class="q-pa-none q-pl-xs">
    <tactical-table
      v-model:pagination="pagination"
      dense
      :table-style="{ 'max-height': `${tableHeight}px` }"
      :rows="agents"
      :columns="columns"
      row-key="id"
      flat
      binary-state-sort
      virtual-scroll
      :rows-per-page-options="[25, 50, 100, 500, 1000]"
      no-data-label="No Agents"
      :loading="isLoading"
      column-select
      storage-key="agent-table"
      @request="onRequest"
    >
      <template #top>
        <q-tabs
          v-model="dashboardSettings.defaultAgentTblTab"
          dense
          no-caps
          inline-label
          class="text-grey"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
        >
          <q-tab name="server" icon="fas fa-server" label="Servers" />
          <q-tab name="workstation" icon="computer" label="Workstations" />
          <q-tab name="mixed" label="Mixed" />
        </q-tabs>
        <q-space />

        <template v-if="selectedAgentIds.length > 0">
          <div class="text-subtitle2 q-mr-sm">{{ selectedAgentIds.length }} selected</div>
          <q-btn dense flat icon="clear" size="sm" class="q-mr-md" @click="selectedAgentIds = []">
            <q-tooltip>Clear selection</q-tooltip>
          </q-btn>
        </template>

        <q-input
          v-model="search"
          style="width: 450px"
          label="Search"
          dense
          filled
          clearable
          class="q-pr-md q-pb-xs"
          @clear="clearFilter"
          @keyup.enter="searchAndReset"
          @keyup.esc="clearFilter"
        >
          <template #prepend>
            <q-icon name="search" color="primary" />
          </template>
          <template #after>
            <q-btn round dense flat icon="filter_alt" :color="isFilteringTable ? 'green' : ''">
              <q-menu>
                <q-list dense>
                  <q-item-label header>Filter Agent Table</q-item-label>

                  <q-item>
                    <q-item-section side>
                      <q-checkbox v-model="filterChecksFailing" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>Checks Failing</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section side>
                      <q-checkbox v-model="filterPatchesPending" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>Patches Pending</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section side>
                      <q-checkbox v-model="filterActionsPending" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>Actions Pending</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section side>
                      <q-checkbox v-model="filterRebootNeeded" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>Reboot Needed</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item-label header>Availability</q-item-label>

                  <q-item>
                    <q-item-section side>
                      <q-radio v-model="filterAvailability" val="all" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>Show All Agents</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section side>
                      <q-radio v-model="filterAvailability" val="online" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>Show Online Only</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section side>
                      <q-radio v-model="filterAvailability" val="offline" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>Show Offline Only</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section side>
                      <q-radio v-model="filterAvailability" val="overdue" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>Show Overdue Only</q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item>
                    <q-item-section side>
                      <q-radio v-model="filterAvailability" val="offline_30days" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>Show Offline for over 30 days</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>

                <div class="row no-wrap q-pa-md">
                  <div class="column">
                    <q-btn v-close-popup label="Apply" color="primary" @click="applyFilter" />
                  </div>
                  <q-space />
                  <div class="column">
                    <q-btn label="Clear" @click="clearFilter" />
                  </div>
                </div>
              </q-menu>
            </q-btn>
          </template>
        </q-input>

        <tactical-table-export />
      </template>
      <!-- header slots -->
      <template #header-cell-selection="props">
        <q-th auto-width :props="props">
          <q-checkbox
            :model-value="allSelected"
            :indeterminate="someSelected && !allSelected"
            dense
            @update:model-value="toggleSelectAll"
          />
        </q-th>
      </template>
      <template #header-cell-smsalert="props">
        <q-th auto-width :props="props">
          <q-icon name="phone_android" size="1.5em">
            <q-tooltip>Send an text alert when agent is overdue</q-tooltip>
          </q-icon>
        </q-th>
      </template>
      <template #header-cell-emailalert="props">
        <q-th auto-width :props="props">
          <q-icon name="email" size="1.5em">
            <q-tooltip>Send an email alert when agent is overdue</q-tooltip>
          </q-icon>
        </q-th>
      </template>
      <template #header-cell-dashboardalert="props">
        <q-th auto-width :props="props">
          <q-icon name="notifications" size="1.5em">
            <q-tooltip>Show a dashboard alert when agent is overdue</q-tooltip>
          </q-icon>
        </q-th>
      </template>
      <template #header-cell-plat="props">
        <q-th auto-width :props="props"></q-th>
      </template>
      <template #header-cell-mon-type="props">
        <q-th auto-width :props="props"></q-th>
      </template>
      <template #header-cell-checks-status="props">
        <q-th :props="props">
          <q-icon name="fas fa-check-double" size="1.2em">
            <q-tooltip>Checks Status</q-tooltip>
          </q-icon>
        </q-th>
      </template>
      <template #header-cell-patchespending="props">
        <q-th auto-width :props="props">
          <q-icon name="verified_user" size="1.5em">
            <q-tooltip>Patches Pending</q-tooltip>
          </q-icon>
        </q-th>
      </template>
      <template #header-cell-pendingactions="props">
        <q-th auto-width :props="props">
          <q-icon name="far fa-clock" size="1.5em">
            <q-tooltip>Pending Actions</q-tooltip>
          </q-icon>
        </q-th>
      </template>
      <template #header-cell-status="props">
        <q-th auto-width :props="props">
          <q-icon name="fas fa-signal" size="1.2em">
            <q-tooltip>Agent Status</q-tooltip>
          </q-icon>
        </q-th>
      </template>
      <template #header-cell-needsreboot="props">
        <q-th auto-width :props="props">
          <q-icon name="fas fa-power-off" size="1.2em">
            <q-tooltip>Reboot</q-tooltip>
          </q-icon>
        </q-th>
      </template>
      <!-- body slots -->
      <template #body="props">
        <q-tr
          :props="props"
          class="cursor-pointer"
          :class="
            selectedAgentIds.includes(props.row.agent_id)
              ? $q.dark.isActive
                ? 'highlight-dark'
                : 'highlight'
              : ''
          "
          @contextmenu="selectRow(props.row)"
          @click="selectRow(props.row)"
          @dblclick="selectSingleRow(props.row)"
        >
          <q-menu context-menu>
            <AgentActionMenu :agent="props.row" />
          </q-menu>

          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            <!-- selection checkbox -->
            <template v-if="col.name === 'selection'">
              <q-checkbox
                :model-value="selectedAgentIds.includes(props.row.agent_id)"
                dense
                @update:model-value="(val: boolean) => toggleCheckbox(props.row.agent_id, val)"
              />
            </template>
            <!-- status -->
            <template v-if="col.name === 'status'">
              <q-icon
                v-if="props.row.status === 'overdue'"
                name="fas fa-signal"
                size="1.2em"
                :color="dashNegativeColor"
              >
                <q-tooltip>Agent overdue</q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="props.row.status === 'offline'"
                name="fas fa-signal"
                size="1.2em"
                :color="dashWarningColor"
              >
                <q-tooltip>Agent offline</q-tooltip>
              </q-icon>
              <q-icon v-else name="fas fa-signal" size="1.2em" :color="dashPositiveColor">
                <q-tooltip>Agent online</q-tooltip>
              </q-icon>
            </template>

            <!-- smsalert -->
            <template v-else-if="col.name === 'smsalert'">
              <q-checkbox
                v-if="props.row.alert_template && props.row.alert_template.always_text !== null"
                v-model="props.row.alert_template.always_text"
                disable
                dense
              >
                <q-tooltip>
                  Setting is overridden by alert template:
                  {{ props.row.alert_template.name }}
                </q-tooltip>
              </q-checkbox>

              <q-checkbox
                v-else
                v-model="props.row.overdue_text_alert"
                dense
                @update:model-value="overdueAlert('text', props.row, props.row.overdue_text_alert)"
              >
                <q-tooltip>Show a dashboard alert when agent is overdue</q-tooltip>
              </q-checkbox>
            </template>

            <!-- emailalert -->
            <template v-else-if="col.name === 'emailalert'">
              <q-checkbox
                v-if="props.row.alert_template && props.row.alert_template.always_email !== null"
                v-model="props.row.alert_template.always_email"
                disable
                dense
              >
                <q-tooltip>
                  Setting is overridden by alert template:
                  {{ props.row.alert_template.name }}
                </q-tooltip>
              </q-checkbox>

              <q-checkbox
                v-else
                v-model="props.row.overdue_email_alert"
                dense
                @update:model-value="
                  overdueAlert('email', props.row, props.row.overdue_email_alert)
                "
              >
                <q-tooltip>Send an email when an agent is overdue</q-tooltip>
              </q-checkbox>
            </template>

            <!-- dashboardalert -->
            <template v-else-if="col.name === 'dashboardalert'">
              <q-checkbox
                v-if="props.row.alert_template && props.row.alert_template.always_alert !== null"
                v-model="props.row.alert_template.always_alert"
                disable
                dense
              >
                <q-tooltip>
                  Setting is overridden by alert template:
                  {{ props.row.alert_template.name }}
                </q-tooltip>
              </q-checkbox>

              <q-checkbox
                v-else
                v-model="props.row.overdue_dashboard_alert"
                dense
                @update:model-value="
                  overdueAlert('dashboard', props.row, props.row.overdue_dashboard_alert)
                "
              >
                <q-tooltip>Show a dashboard alert when agent is overdue</q-tooltip>
              </q-checkbox>
            </template>

            <!-- platform -->
            <template v-else-if="col.name === 'plat'">
              <q-icon
                v-if="props.row.plat === 'windows'"
                name="mdi-microsoft-windows"
                size="sm"
                color="primary"
              >
                <q-tooltip>Microsoft Windows</q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="props.row.plat === 'linux'"
                name="mdi-linux"
                size="sm"
                color="primary"
              >
                <q-tooltip>Linux</q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="props.row.plat === 'darwin'"
                name="mdi-apple"
                size="sm"
                color="primary"
              >
                <q-tooltip>macOS</q-tooltip>
              </q-icon>
            </template>

            <!-- mon type -->
            <template v-else-if="col.name === 'mon-type'">
              <q-icon
                v-if="props.row.monitoring_type === 'server'"
                name="dns"
                size="sm"
                color="primary"
              >
                <q-tooltip>Server</q-tooltip>
              </q-icon>
              <q-icon v-else name="computer" size="sm" color="primary">
                <q-tooltip>Workstation</q-tooltip>
              </q-icon>
            </template>

            <!-- checks status -->
            <template v-else-if="col.name === 'checks-status'">
              <q-icon
                v-if="props.row.maintenance_mode"
                name="construction"
                size="1.2em"
                :color="dashPositiveColor"
              >
                <q-tooltip>Maintenance Mode Enabled</q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="props.row.checks.failing > 0"
                name="fas fa-check-double"
                size="1.2em"
                :color="dashNegativeColor"
              >
                <q-tooltip>Checks failing</q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="props.row.checks.warning > 0"
                name="fas fa-check-double"
                size="1.2em"
                :color="dashWarningColor"
              >
                <q-tooltip>Checks warning</q-tooltip>
              </q-icon>
              <q-icon
                v-else-if="props.row.checks.info > 0"
                name="fas fa-check-double"
                size="1.2em"
                :color="dashInfoColor"
              >
                <q-tooltip>Checks info</q-tooltip>
              </q-icon>
              <q-icon v-else name="fas fa-check-double" size="1.2em" :color="dashPositiveColor">
                <q-tooltip>Checks passing</q-tooltip>
              </q-icon>
            </template>

            <!-- patchespending -->
            <template v-else-if="col.name === 'patchespending'">
              <q-icon
                v-if="props.row.has_patches_pending"
                name="verified_user"
                size="1.5em"
                color="primary"
              >
                <q-tooltip>Patches Pending</q-tooltip>
              </q-icon>
            </template>

            <!-- pendingactions -->
            <template v-else-if="col.name === 'pendingactions'">
              <q-icon
                v-if="props.row.pending_actions_count > 0"
                name="far fa-clock"
                size="1.4em"
                :color="dashWarningColor"
                class="cursor-pointer"
                @click="showPendingActionsModal(props.row)"
              >
                <q-tooltip>Pending Action Count: {{ props.row.pending_actions_count }}</q-tooltip>
              </q-icon>
            </template>

            <!-- needs reboot -->
            <template v-else-if="col.name === 'needsreboot'">
              <q-icon v-if="props.row.needs_reboot" name="fas fa-power-off" color="primary">
                <q-tooltip>Reboot required</q-tooltip>
              </q-icon>
            </template>

            <template v-else>
              {{ col.value }}
            </template>
          </q-td>
        </q-tr>
      </template>
    </tactical-table>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { useAgentStore, useDashboardStore } from "src/stores/api";
import { watchDebounced } from "@vueuse/shared";

const {
  agents,
  selectedAgentIds,
  isLoading,
  rowsNumber,
  searchAgents,
  updateAgent,
  runTakeControl,
  runRemoteBackground,
  clearSelectedAgent,
} = useAgentStore();
import { runURLAction } from "src/core/settings/api";

// setup dashboard store
const { tableHeight, selectedClientSiteNode, dashboardSettings, formatDate } = useDashboardStore();
import { getTimeLapse } from "src/utils/format";

// ui imports
import EditAgent from "./EditAgent.vue";
import PendingActions from "src/core/logs/components/PendingActions.vue";
import AgentActionMenu from "./AgentActionMenu.vue";

// type imports
import type { Agent, AgentSearchParams, AgentPagination, AgentMonitoringType, AgentStatus } from "../types";
import type { TacticalColumn } from "src/core/dashboard/types";

const $q = useQuasar();

const tab = computed(() => dashboardSettings.defaultAgentTblTab);
const dashInfoColor = computed(() => dashboardSettings.dashInfoColor);
const dashPositiveColor = computed(() => dashboardSettings.dashPositiveColor);
const dashNegativeColor = computed(() => dashboardSettings.dashNegativeColor);
const dashWarningColor = computed(() => dashboardSettings.dashWarningColor);
const agentDblClickAction = computed(() => dashboardSettings.agentDblClickAction);
const agentUrlAction = computed(() => dashboardSettings.agentUrlAction);

const route = useRoute();
const search = ref(route.query.search ? String(route.query.search) : "");
const filterAvailability = ref("all");
const filterPatchesPending = ref(false);
const filterActionsPending = ref(false);
const filterChecksFailing = ref(false);
const filterRebootNeeded = ref(false);

const columns: TacticalColumn[] = [
  { name: "selection", field: "", align: "left", label: "", sortable: false, required: true },
  {
    name: "status",
    field: "status",
    align: "left",
    label: "Agent Status",
    sortable: true,
    sort: (a: AgentStatus, b: AgentStatus) => {
      const statusRank: Record<string, number> = {
        online: 0,
        offline: 1,
        overdue: 2,
      };
      return (statusRank[a ?? ""] ?? 3) - (statusRank[b ?? ""] ?? 3);
    },
  },
  { name: "smsalert", align: "left", label: "SMS Alert", field: "", sortable: false },
  { name: "emailalert", align: "left", label: "Email Alert", field: "", sortable: false },
  { name: "dashboardalert", align: "left", label: "Dashboard Alert", field: "", sortable: false },
  { name: "plat", label: "Platform", field: "plat", sortable: true, align: "left" },
  {
    name: "mon-type",
    label: "Agent Type",
    field: "monitoring_type",
    sortable: true,
    align: "left",
  },
  {
    name: "checks-status",
    align: "left",
    field: "checks",
    label: "Checks Status",
    sortable: true,
    sort: (a, b) =>
      parseInt(b.failing) - parseInt(a.failing) ||
      parseInt(b.warning) - parseInt(a.warning) ||
      parseInt(b.info) - parseInt(a.info),
  },
  { name: "client_name", label: "Client", field: "client_name", sortable: true, align: "left" },
  { name: "site_name", label: "Site", field: "site_name", sortable: true, align: "left" },
  { name: "hostname", label: "Hostname", field: "hostname", sortable: true, align: "left" },
  {
    name: "description",
    label: "Description",
    field: "description",
    sortable: true,
    align: "left",
  },
  {
    name: "user",
    label: "User",
    field: (row) => row.logged_username ?? "",
    sortable: true,
    align: "left",
    classes: (row) => (row.italic ? "text-italic" : ""),
  },
  {
    name: "patchespending",
    field: "has_patches_pending",
    label: "Patches Pending",
    align: "left",
    sortable: true,
  },
  {
    name: "pendingactions",
    field: "pending_actions_count",
    align: "left",
    label: "Pending Actions",
    sortable: true,
  },
  {
    name: "needsreboot",
    field: "needs_reboot",
    align: "left",
    label: "Reboot Needed",
    sortable: true,
  },
  {
    name: "last_seen",
    label: "Last Response",
    field: "last_seen",
    sortable: true,
    align: "left",
    format: (val: string) => formatDate(val),
  },
  {
    name: "boot_time",
    label: "Boot Time",
    field: "boot_time",
    sortable: true,
    align: "left",
    format: (val: number) => getTimeLapse(val),
  },
];

const isFilteringTable = computed(
  () =>
    filterPatchesPending.value ||
    filterActionsPending.value ||
    filterChecksFailing.value ||
    filterRebootNeeded.value ||
    filterAvailability.value !== "all",
);

watch(selectedClientSiteNode, () => {
  clearSelectedAgent();
  searchAndReset();

  if (dashboardSettings.clearSearchWhenSwitching) clearFilter();
});

const clearFilter = () => {
  filterPatchesPending.value = false;
  filterRebootNeeded.value = false;
  filterChecksFailing.value = false;
  filterActionsPending.value = false;
  filterAvailability.value = "all";
  search.value = "";
  searchAndReset();
};

const applyFilter = () => {
  searchAndReset();
};

watch(tab, () => {
  if (dashboardSettings.clearSearchWhenSwitching) clearFilter();
  doSearch();
});

const pagination = ref<AgentPagination>({
  page: 1,
  rowsPerPage: 50,
  sortBy: "hostname",
  descending: false,
  rowsNumber: 0,
});

function getClientSiteFilter(): { clientId?: number; siteId?: number } {
  if (selectedClientSiteNode.value) {
    const treeKey = selectedClientSiteNode.value.split("|");
    const model = treeKey[0];
    const id = parseInt(String(treeKey[1]));
    if (model === "site") return { siteId: id };
    else if (model === "client") return { clientId: id };
  }
  return {};
}

function doSearch() {
  const clientSiteFilter = getClientSiteFilter();

  const params: AgentSearchParams = {
    pagination: {
      page: pagination.value.page || 1,
      rowsPerPage: pagination.value.rowsPerPage || 50,
      sortBy: pagination.value.sortBy || "hostname",
      descending: pagination.value.descending ?? false,
    },
    ...clientSiteFilter,
  };

  // Tab filter - monitoring type
  if (tab.value !== "mixed") {
    params.monitoringType = tab.value as AgentMonitoringType;
  }

  // Search text
  if (search.value.trim()) {
    params.search = search.value.trim();
  }

  // Status filter from availability
  if (filterAvailability.value === "online") {
    params.status = "online";
  } else if (filterAvailability.value === "offline") {
    params.status = "offline";
  } else if (filterAvailability.value === "overdue") {
    params.status = "overdue";
  } else if (filterAvailability.value === "offline_30days") {
    params.status = "offline_30days";
  }

  // Advanced filters - send to server
  if (filterPatchesPending.value) {
    params.patchesPending = true;
  }
  if (filterActionsPending.value) {
    params.actionsPending = true;
  }
  if (filterRebootNeeded.value) {
    params.rebootNeeded = true;
  }
  if (filterChecksFailing.value) {
    params.checksFailing = true;
  }

  searchAgents(params);
}

function searchAndReset() {
  pagination.value.page = 1;
  doSearch();
}

function onRequest(data: { pagination: AgentPagination }) {
  if (data) {
    pagination.value = data.pagination;
    doSearch();
  }
}

watch(rowsNumber, (newValue) => {
  pagination.value.rowsNumber = newValue;
});

watchDebounced(
  search,
  () => {
    searchAndReset();
  },
  { debounce: 400 },
);

import { QInput } from "quasar";

onMounted(doSearch);

// Select all checkbox logic
const allSelected = computed(
  () =>
    agents.value.length > 0 &&
    agents.value.every((a) => selectedAgentIds.value.includes(a.agent_id)),
);

const someSelected = computed(() =>
  agents.value.some((a) => selectedAgentIds.value.includes(a.agent_id)),
);

function toggleSelectAll(selected: boolean) {
  if (selected) {
    selectedAgentIds.value = agents.value.map((a) => a.agent_id);
  } else {
    selectedAgentIds.value = [];
  }
}

function selectRow(row: Agent) {
  // Single click clears selection and selects just this row
  selectedAgentIds.value = [row.agent_id];
}

function toggleCheckbox(agentId: string, selected: boolean) {
  if (selected) {
    if (!selectedAgentIds.value.includes(agentId)) {
      selectedAgentIds.value = [...selectedAgentIds.value, agentId];
    }
  } else {
    selectedAgentIds.value = selectedAgentIds.value.filter((id) => id !== agentId);
  }
}

async function selectSingleRow(row: Agent) {
  // Double-click selects only this row (clears other selections)
  selectedAgentIds.value = [row.agent_id];

  // Then perform the configured double-click action
  switch (agentDblClickAction.value) {
    case "editagent":
      showEditAgent(row.agent_id);
      break;
    case "takecontrol":
      runTakeControl(row.agent_id);
      break;
    case "remotebg":
      runRemoteBackground(row.agent_id, row.plat);
      break;
    case "urlaction":
      if (agentUrlAction.value) await runURLAction(agentUrlAction.value, "agent", row.agent_id);
      break;
  }
}

function showEditAgent(agentId: string) {
  $q.dialog({
    component: EditAgent,
    componentProps: {
      agentId: agentId,
    },
  });
}

function showPendingActionsModal(agent: Agent) {
  $q.dialog({
    component: PendingActions,
    componentProps: {
      agent: agent,
    },
  });
}

function overdueAlert(
  category: "email" | "text" | "dashboard",
  agent: Agent,
  alert_action: boolean,
) {
  const data = {
    [`overdue_${category}_alert`]: alert_action,
  };

  void updateAgent(agent.agent_id, data);
}
</script>
