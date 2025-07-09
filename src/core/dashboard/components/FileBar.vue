<template>
  <div class="q-pb-sm">
    <q-bar>
      <q-btn-group flat>
        <q-btn size="md" dense no-caps flat label="File">
          <q-menu>
            <q-list dense style="min-width: 100px">
              <q-item clickable>
                <q-item-section>Add</q-item-section>
                <q-item-section side>
                  <q-icon name="keyboard_arrow_right" />
                </q-item-section>
                <q-menu anchor="top right" self="top left">
                  <q-list dense style="min-width: 100px">
                    <q-item v-close-popup clickable @click="showAddClientModal">
                      <q-item-section>Client</q-item-section>
                    </q-item>
                    <q-item v-close-popup clickable @click="showAddSiteModal">
                      <q-item-section>Site</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-item>

              <q-item v-close-popup clickable @click="showAuditManager">
                <q-item-section>Audit Log</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="showDebugLog">
                <q-item-section>Debug Log</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <!-- view -->
        <q-btn size="md" dense no-caps flat label="View">
          <q-menu auto-close>
            <q-list dense style="min-width: 100px">
              <q-item v-close-popup clickable @click="showPendingActions">
                <q-item-section>Pending Actions</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <!-- agents -->
        <q-btn size="md" dense no-caps flat label="Agents">
          <q-menu auto-close>
            <q-list dense style="min-width: 100px">
              <q-item v-close-popup clickable @click="showInstallAgent">
                <q-item-section>Install Agent</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="showDeployments">
                <q-item-section>Manage Deployments</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="showUpdateAgents">
                <q-item-section>Update Agents</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <!-- settings -->
        <q-btn size="md" dense no-caps flat label="Settings">
          <q-menu auto-close>
            <q-list dense style="min-width: 100px">
              <!-- clients manager -->
              <q-item v-close-popup clickable @click="showClientsManager">
                <q-item-section>Clients Manager</q-item-section>
              </q-item>
              <!-- script manager -->
              <q-item v-close-popup clickable @click="showScriptManager">
                <q-item-section>Script Manager</q-item-section>
              </q-item>
              <!-- automation manager -->
              <q-item v-close-popup clickable @click="showAutomationManager">
                <q-item-section>Automation Manager</q-item-section>
              </q-item>
              <!-- alerts manager -->
              <q-item v-close-popup clickable @click="showAlertsManager">
                <q-item-section>Alerts Manager</q-item-section>
              </q-item>
              <!-- permissions manager -->
              <q-item v-close-popup clickable @click="showPermissionsManager">
                <q-item-section>Permissions Manager</q-item-section>
              </q-item>
              <!-- admin manager -->
              <q-item v-close-popup clickable @click="showAdminManager">
                <q-item-section>User Administration</q-item-section>
              </q-item>
              <!-- core settings -->
              <q-item v-close-popup clickable @click="showEditCoreSettings">
                <q-item-section>Global Settings</q-item-section>
              </q-item>
              <!-- code sign -->
              <q-item v-if="!hosted" v-close-popup clickable @click="showCodeSign">
                <q-item-section>Code Signing</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <!-- tools -->
        <q-btn size="md" dense no-caps flat label="Tools">
          <q-menu auto-close>
            <q-list dense style="min-width: 100px">
              <!-- bulk command -->
              <q-item v-close-popup clickable @click="showBulkAction('command')">
                <q-item-section>Bulk Command</q-item-section>
              </q-item>
              <!-- bulk script -->
              <q-item v-close-popup clickable @click="showBulkAction('script')">
                <q-item-section>Bulk Script</q-item-section>
              </q-item>
              <!-- bulk patch management -->
              <q-item v-close-popup clickable @click="showBulkAction('patch')">
                <q-item-section>Bulk Patch Management</q-item-section>
              </q-item>
              <!-- server maintenance -->
              <q-item v-close-popup clickable @click="showServerMaintenance">
                <q-item-section>Server Maintenance</q-item-section>
              </q-item>
              <!-- clear cache -->
              <q-item v-close-popup clickable @click="clearCache">
                <q-item-section>Clear Cache</q-item-section>
              </q-item>
              <!-- bulk recover agents -->
              <q-item v-close-popup clickable @click="bulkRecoverAgents">
                <q-item-section>Recover All Agents</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <!-- integrations -->
        <q-btn size="md" dense no-caps flat label="Reporting">
          <q-menu auto-close>
            <q-list
              v-if="
                $integrations &&
                $integrations.fileBarIntegrations &&
                $integrations.fileBarIntegrations.length > 0
              "
              dense
              style="min-width: 100px"
            >
              <q-item
                v-for="integration in $integrations.fileBarIntegrations"
                :key="integration.name"
                v-close-popup
                :to="integration.type === 'route' ? integration.uri : undefined"
                clickable
                @click="
                  integration.type === 'dialog'
                    ? $q.dialog({ component: integration.component })
                    : undefined
                "
              >
                <q-item-section>{{ integration.name }}</q-item-section>
              </q-item>
            </q-list>
            <q-list v-else dense style="min-width: 100px">
              <q-item
                v-close-popup
                clickable
                @click="
                  notifyWarning(
                    'Reporting feature requires a Tier 2 or higher sponsorship. Please check the docs for more info.',
                    10000,
                  )
                "
              >
                <q-item-section>Reporting Manager</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <!-- help -->
        <q-btn v-if="!hosted" size="md" dense no-caps flat label="Help">
          <q-menu auto-close>
            <q-list dense style="min-width: 100px">
              <q-item v-close-popup clickable @click="openHelp('docs')">
                <q-item-section>Documentation</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="openHelp('github')">
                <q-item-section>GitHub Repo</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="openHelp('bug')">
                <q-item-section>Bug Report</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="openHelp('feature')">
                <q-item-section>Feature Request</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="openHelp('discord')">
                <q-item-section>Join Discord</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-btn-group>
      <q-space />
    </q-bar>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useQuasar } from "quasar";
import { useDashboardStore } from "src/stores/dashboard";
import { useAgentStore } from "src/core/agents/api";
import { useCoreStore } from "src/core/settings/api";
import DialogWrapper from "src/components/ui/DialogWrapper.vue";
import DebugLog from "../core/logs/components/DebugLog.vue";
import PendingActions from "../core/logs/components/PendingActions.vue";
import ClientsManager from "src/core/clients/components/ClientsManager.vue";
import ClientsForm from "src/core/clients/components//ClientsForm.vue";
import SitesForm from "src/core/clients/components//SitesForm.vue";
import UpdateAgents from "src/core/agents/components/UpdateAgents.vue";
import ScriptManager from "src/core/scripts/components/ScriptManager.vue";
import EditCoreSettings from "src/core/settings/components/EditCoreSettings.vue";
import AlertsManager from "src/components/AlertsManager.vue";
import AutomationManager from "src/components/automation/AutomationManager.vue";
import AdminManager from "src/core/accounts/components/AdminManager.vue";
import InstallAgent from "src/core/agents/components/InstallAgent.vue";
import AuditManager from "src/core/logs/components/AuditManager.vue";
import BulkAction from "src/core/agents/components/BulkAction.vue";
import DeploymentTable from "src/core/clients/components/DeploymentTable.vue";
import ServerMaintenance from "src/components/modals/core/ServerMaintenance.vue";
import CodeSign from "src/components/modals/coresettings/CodeSign.vue";
import PermissionsManager from "src/core/accounts/components/PermissionsManager.vue";

import { notifyWarning } from "src/utils/notify";
import type { BulkActionMode } from "src/core/agents/types";

const $q = useQuasar();

// setup stores
const agentStore = useAgentStore();
const dashboardStore = useDashboardStore();
const coreStore = useCoreStore();
const hosted = computed(() => dashboardStore.dashboardSettings.hosted);

function clearCache() {
  coreStore.clearCache();
}

function bulkRecoverAgents() {
  $q.dialog({
    title: "Bulk Recover All Agents?",
    message: "This will restart the Tactical and Mesh Agent services on all agents",
    cancel: true,
  }).onOk(agentStore.bulkAgentRecovery);
}

function openHelp(mode: string) {
  let url;
  switch (mode) {
    case "github":
      url = "https://github.com/amidaware/tacticalrmm/";
      break;
    case "docs":
      url = "https://docs.tacticalrmm.com";
      break;
    case "bug":
      url = "https://github.com/amidaware/tacticalrmm/issues/new?template=bug_report.md";
      break;
    case "feature":
      url = "https://github.com/amidaware/tacticalrmm/issues/new?template=feature_request.md";
      break;
    case "discord":
      url = "https://discord.gg/upGTkWp";
      break;
  }
  window.open(url, "_blank");
}

function showAutomationManager() {
  $q.dialog({
    component: AutomationManager,
  });
}

function showAlertsManager() {
  $q.dialog({
    component: AlertsManager,
  });
}

function showClientsManager() {
  $q.dialog({
    component: ClientsManager,
  });
}

function showAddClientModal() {
  $q.dialog({
    component: ClientsForm,
  });
}
function showServerMaintenance() {
  $q.dialog({
    component: ServerMaintenance,
  });
}

function showAddSiteModal() {
  $q.dialog({
    component: SitesForm,
  });
}
function showCodeSign() {
  $q.dialog({
    component: CodeSign,
  });
}
function showPermissionsManager() {
  $q.dialog({
    component: PermissionsManager,
  });
}

function showAdminManager() {
  $q.dialog({
    component: AdminManager,
  });
}
function showAuditManager() {
  $q.dialog({
    component: DialogWrapper,
    componentProps: {
      component: AuditManager,
      noCard: true,
      componentProps: {
        modal: true,
      },
      maximized: true,
      ["transition-show"]: "slide-up",
      ["transition-hide"]: "slide-down",
    },
  });
}
function showScriptManager() {
  $q.dialog({
    component: ScriptManager,
  });
}
function showBulkAction(mode: BulkActionMode) {
  $q.dialog({
    component: BulkAction,
    componentProps: {
      mode: mode,
    },
  });
}
function showDebugLog() {
  $q.dialog({
    component: DialogWrapper,
    componentProps: {
      component: DebugLog,
      noCard: true,
      componentProps: {
        modal: true,
      },
      maximized: true,
      ["transition-show"]: "slide-up",
      ["transition-hide"]: "slide-down",
    },
  });
}
function showPendingActions() {
  $q.dialog({
    component: PendingActions,
  });
}
function showDeployments() {
  $q.dialog({
    component: DeploymentTable,
  });
}
function showUpdateAgents() {
  $q.dialog({
    component: UpdateAgents,
  });
}
function showInstallAgent() {
  $q.dialog({
    component: InstallAgent,
  });
}
function showEditCoreSettings() {
  $q.dialog({
    component: EditCoreSettings,
  });
}
</script>
