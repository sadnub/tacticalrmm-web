<template>
  <q-page>
    <FileBar />
    <q-splitter
      :model-value="dashboardStore.dashboardSettings.clientTreeSplitter"
      :style="{ height: `${$q.screen.height - 50 - 40}px` }"
      @update:model-value="(val: number) => dashboardStore.setClientTreeSplitter(Math.floor(val))"
    >
      <template #before>
        <div v-if="!clientTree" class="q-pa-sm q-gutter-sm text-center" style="height: 30vh">
          <q-spinner size="40px" color="primary" />
        </div>
        <div v-else class="q-pa-sm q-gutter-sm scroll" style="height: 85vh; overflow: initial">
          <q-list dense class="rounded-borders">
            <q-item
              v-ripple
              clickable
              :active="dashboardStore.selectedClientSiteNode === null"
              @click="dashboardStore.selectedClientSiteNode = null"
            >
              <q-item-section avatar>
                <q-icon name="fas fa-home" />
              </q-item-section>
              <q-item-section>All Clients</q-item-section>
            </q-item>
            <q-tree
              ref="tree"
              v-model:selected="dashboardStore.selectedClientSiteNode"
              :nodes="clientTree"
              node-key="raw"
              no-nodes-label="No Clients"
              selected-color="primary"
              no-selection-unset
            >
              <template #default-header="props">
                <div class="row items-center">
                  <q-icon :name="props.node.icon" :color="props.node.color" class="q-mr-sm" />
                  <div>
                    {{ props.node.label }}
                    <q-tooltip :delay="600">
                      ID: {{ props.node.id }}<br />
                      Agent Count:
                      {{
                        props.node.children
                          ? props.node.client.agent_count
                          : props.node.site.agent_count
                      }}
                    </q-tooltip>
                  </div>

                  <q-menu context-menu>
                    <q-list dense style="min-width: 200px">
                      <q-item v-close-popup clickable @click="showEditModal(props.node)">
                        <q-item-section side>
                          <q-icon name="edit" />
                        </q-item-section>
                        <q-item-section>Edit</q-item-section>
                      </q-item>
                      <q-item v-close-popup clickable @click="showDeleteModal(props.node)">
                        <q-item-section side>
                          <q-icon name="delete" />
                        </q-item-section>
                        <q-item-section>Delete</q-item-section>
                      </q-item>

                      <q-separator></q-separator>

                      <q-item
                        v-if="props.node.children"
                        v-close-popup
                        clickable
                        @click="showAddSiteModal(props.node)"
                      >
                        <q-item-section side>
                          <q-icon name="add" />
                        </q-item-section>
                        <q-item-section>Add Site</q-item-section>
                      </q-item>

                      <q-item v-close-popup clickable @click="showToggleMaintenance(props.node)">
                        <q-item-section side>
                          <q-icon name="construction" />
                        </q-item-section>
                        <q-item-section>{{
                          props.node.color === "green"
                            ? "Disable Maintenance Mode"
                            : "Enable Maintenance Mode"
                        }}</q-item-section>
                      </q-item>

                      <q-item
                        v-if="props.node.children === undefined"
                        v-close-popup
                        clickable
                        @click="showInstallAgent(props.node)"
                      >
                        <q-item-section side>
                          <q-icon name="cloud_download" />
                        </q-item-section>
                        <q-item-section>Install Agent</q-item-section>
                      </q-item>

                      <q-item v-close-popup clickable @click="showPolicyAdd(props.node)">
                        <q-item-section side>
                          <q-icon name="policy" />
                        </q-item-section>
                        <q-item-section>Assign Automation Policy</q-item-section>
                      </q-item>

                      <q-item v-close-popup clickable @click="showAlertTemplateAdd(props.node)">
                        <q-item-section side>
                          <q-icon name="error" />
                        </q-item-section>
                        <q-item-section>Assign Alert Template</q-item-section>
                      </q-item>

                      <q-item v-ripple clickable>
                        <q-item-section side>
                          <q-icon name="open_in_new" />
                        </q-item-section>
                        <q-item-section>Run URL Action</q-item-section>
                        <q-item-section side>
                          <q-icon name="keyboard_arrow_right" />
                        </q-item-section>
                        <q-menu auto-close anchor="top end" self="top start">
                          <q-list>
                            <q-item
                              v-for="action in urlActions"
                              :key="action.id"
                              v-close-popup
                              dense
                              clickable
                              @click="
                                runURLAction(
                                  action.id,
                                  props.node.children ? 'client' : 'site',
                                  props.node.id,
                                )
                              "
                            >
                              {{ action.name }}
                            </q-item>
                          </q-list>
                        </q-menu>
                      </q-item>

                      <!-- Bulk Run Checks -->
                      <q-item v-close-popup clickable @click="runChecks(props.node)">
                        <q-item-section side>
                          <q-icon name="fas fa-check-double" />
                        </q-item-section>
                        <q-item-section>Run Checks</q-item-section>
                      </q-item>

                      <q-item
                        v-if="
                          (props.node.children &&
                            $integrations?.clientMenuIntegrations?.length > 0) ||
                          (!props.node.children && $integrations?.siteMenuIntegrations.length > 0)
                        "
                        clickable
                      >
                        <q-item-section side>
                          <q-icon name="analytics" />
                        </q-item-section>
                        <q-item-section>Reporting</q-item-section>
                        <q-item-section side>
                          <q-icon name="keyboard_arrow_right" />
                        </q-item-section>
                        <integrations-context-menu
                          :id="props.node.id"
                          :type="props.node.children ? 'client' : 'site'"
                        />
                      </q-item>

                      <q-separator></q-separator>

                      <q-item v-close-popup clickable>
                        <q-item-section>Close</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </div>
              </template>
            </q-tree>
          </q-list>
        </div>
      </template>

      <template #after>
        <q-splitter
          v-model="innerModel"
          reverse
          unit="px"
          horizontal
          after-class="hide-scrollbar"
          before-class="hide-scrollbar"
          emit-immediately
          @update:model-value="dashboardStore.setTableHeight(innerModel)"
        >
          <template #before>
            <AgentTable />
          </template>
          <template #separator>
            <q-avatar color="primary" text-color="white" size="20px" icon="drag_indicator" />
          </template>
          <template #after>
            <SubTableTabs />
          </template>
        </q-splitter>
      </template>
    </q-splitter>
  </q-page>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useQuasar, QTree } from "quasar";
import { useDashboardStore } from "src/stores/dashboard";
import { clientStore, siteStore, urlActionStore, runURLAction } from "src/stores/api";
import axios from "axios";

// import ui
import FileBar from "src/core/dashboard/components/FileBar.vue";
import AgentTable from "src/core/agents/components/AgentTable.vue";
import SubTableTabs from "src/core/dashboard/components/SubTableTabs.vue";
import PolicyAdd from "src/core/automation/components/PolicyAdd.vue";
import ClientsForm from "src/core/clients/components/ClientsForm.vue";
import SitesForm from "src/core/clients/components/SitesForm.vue";
import DeleteClient from "src/core/clients/components/DeleteClient.vue";
import InstallAgent from "src/core/agents/components/InstallAgent.vue";
import AlertTemplateAdd from "src/core/alerts/components/AlertTemplateAdd.vue";
import IntegrationsContextMenu from "src/core/dashboard/ui/IntegrationsContextMenu.vue";

//types
import { notifySuccess, notifyWarning } from "src/utils/notify";
import type { ClientTreeNode } from "src/core/dashboard/types";

// setup stores
const { clients } = clientStore;
const { webActions } = urlActionStore;

const dashboardStore = useDashboardStore();

const $q = useQuasar();

const innerModel = ref(($q.screen.height - 82) / 2);

const clientTree = computed((): ClientTreeNode[] => {
  const output: ClientTreeNode[] = [];

  for (const client of clients.value) {
    const childSites: ClientTreeNode[] = [];

    for (const site of client.sites) {
      const siteNode: ClientTreeNode = {
        label: site.name,
        id: site.id,
        raw: `site|${site.id}|${site.name}`,
        header: "generic",
        icon: "apartment",
        selectable: true,
        site: site,
      };

      if (site.maintenance_mode) {
        siteNode.color = "green";
      } else if (site.failing_checks.error) {
        siteNode.color = "negative";
      } else if (site.failing_checks.warning) {
        siteNode.color = "warning";
      }

      childSites.push(siteNode);
    }

    const clientNode: ClientTreeNode = {
      label: client.name,
      id: client.id,
      raw: `client|${client.id}|${client.name}`,
      header: "root",
      icon: "business",
      children: childSites,
      client: client,
    };

    if (client.maintenance_mode) {
      clientNode.color = "green";
    } else if (client.failing_checks.error) {
      clientNode.color = "negative";
    } else if (client.failing_checks.warning) {
      clientNode.color = "warning";
    }

    output.push(clientNode);
  }

  const sorted = output.sort((a, b) => a.label.localeCompare(b.label));

  if (dashboardStore.dashboardSettings.clientTreeSort === "alphafail") {
    const failing = sorted.filter((i) => i.color === "negative" || i.color === "warning");
    const ok = sorted.filter((i) => i.color !== "negative" && i.color !== "warning");
    return [...failing, ...ok];
  } else {
    return sorted;
  }
});

function showPolicyAdd(node: ClientTreeNode) {
  $q.dialog({
    component: PolicyAdd,
    componentProps: {
      type: node.children ? "client" : "site",
      object: node.children ? node.client : node.site,
    },
  });
}

function showAddSiteModal(node: ClientTreeNode) {
  $q.dialog({
    component: SitesForm,
    componentProps: { client: node.id },
  });
}

function showEditModal(node: ClientTreeNode) {
  $q.dialog({
    component: node.children ? ClientsForm : SitesForm,
    componentProps: node.children
      ? { client: node.client }
      : { site: node.site, client: node.site?.client },
  });
}

function showDeleteModal(node: ClientTreeNode) {
  if (
    (node.children && node.client?.agent_count && node.client?.agent_count > 0) ||
    (!node.children && node.site?.agent_count && node.site?.agent_count > 0)
  ) {
    $q.dialog({
      component: DeleteClient,
      componentProps: {
        object: node.children ? node.client : node.site,
        type: node.children ? "client" : "site",
      },
    }).onOk(() => (dashboardStore.selectedClientSiteNode = null));
  } else {
    $q.dialog({
      title: "Are you sure?",
      message: `Delete ${node.children ? "client" : "site"}: ${node.label}.`,
      cancel: true,
      ok: { label: "Delete", color: "negative" },
    }).onOk(() => {
      if (node.children) void clientStore.removeClient(node.id);
      else void siteStore.removeSite(node.id);
      dashboardStore.selectedClientSiteNode = null;
    });
  }
}

function showInstallAgent(node: ClientTreeNode) {
  $q.dialog({
    component: InstallAgent,
    componentProps: {
      sitePk: node.id,
    },
  });
}

function showAlertTemplateAdd(node: ClientTreeNode) {
  $q.dialog({
    component: AlertTemplateAdd,
    componentProps: {
      type: node.children ? "client" : "site",
      object: node.children ? node.client : node.site,
    },
  });
}

function runChecks(node: ClientTreeNode) {
  const target = node.children ? "client" : "site";
  axios
    .post(`/checks/${target}/${node.id}/csbulkrun/`)
    .then((r) => {
      notifySuccess(r.data);
    })
    .catch((e) => console.error(e));
}

function showToggleMaintenance(node: ClientTreeNode) {
  const data = {
    id: node.id,
    type: node.raw.split("|")[0],
    action: node.color !== "green",
  };

  axios
    .post("/agents/maintenance/bulk/", data)
    .then((r) => {
      notifySuccess(r.data);
      dashboardStore.refreshDashboard();
    })
    .catch((e) => console.error(e));
}

const urlActions = computed(() => {
  const actions = webActions.value
    .filter((action) => action.action_type === "web")
    .sort((a, b) => a.name.localeCompare(b.name));

  if (actions.length === 0) {
    notifyWarning("No URL Actions configured. Go to Settings > Global Settings > URL Actions");
    return [];
  } else {
    return actions;
  }
});

onMounted(() => {
  clientStore.getClients();
  urlActionStore.getURLActions();
  dashboardStore.setTableHeight(innerModel.value);
});
</script>

<style>
.my-menu-link {
  color: white;
  background: lightgray;
}
</style>
