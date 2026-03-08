<template>
  <q-list dense style="min-width: 200px">
    <!-- edit agent -->
    <q-item v-close-popup clickable @click="showEditAgent(agent.agent_id)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-edit" />
      </q-item-section>
      <q-item-section>Edit {{ agent.hostname }}</q-item-section>
    </q-item>
    <!-- agent pending actions -->
    <q-item v-close-popup clickable @click="showPendingActionsModal(agent)">
      <q-item-section side>
        <q-icon size="xs" name="far fa-clock" />
      </q-item-section>
      <q-item-section>Pending Agent Actions</q-item-section>
    </q-item>
    <!-- take control -->
    <q-item v-ripple v-close-popup clickable @click="runTakeControl(agent.agent_id)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-desktop" />
      </q-item-section>

      <q-item-section>Take Control</q-item-section>
    </q-item>

    <!-- vnc -->
    <q-item v-ripple v-close-popup clickable @click="launchWebVNC(agent.agent_id)">
      <q-item-section side>
        <q-icon size="xs" name="screen_share" />
      </q-item-section>

      <q-item-section>VNC</q-item-section>
    </q-item>

    <q-item v-ripple clickable :disable="webActions.length === 0">
      <q-item-section side>
        <q-icon size="xs" name="open_in_new" />
      </q-item-section>
      <q-item-section>Run URL Action</q-item-section>
      <q-item-section side>
        <q-icon name="keyboard_arrow_right" />
      </q-item-section>
      <q-menu auto-close anchor="top end" self="top start">
        <q-list>
          <q-item
            v-for="action in webActions"
            :key="action.id"
            v-close-popup
            dense
            clickable
            @click="runURLAction(action.id, 'agent', agent.agent_id)"
          >
            <q-item-section>{{ action.name }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-item>

    <q-item v-ripple v-close-popup clickable @click="showSendCommand(agent)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-terminal" />
      </q-item-section>
      <q-item-section>Send Command</q-item-section>
    </q-item>

    <q-item v-ripple v-close-popup clickable @click="showRunScript(agent)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-terminal" />
      </q-item-section>
      <q-item-section>Run Script</q-item-section>
    </q-item>

    <q-item v-ripple clickable :disable="favoriteScriptOptions.length === 0">
      <q-item-section side>
        <q-icon size="xs" name="star" />
      </q-item-section>
      <q-item-section>Run Favorited Script</q-item-section>
      <q-item-section side>
        <q-icon name="keyboard_arrow_right" />
      </q-item-section>
      <q-menu auto-close anchor="top end" self="top start">
        <q-list>
          <q-item
            v-for="script in favoriteScriptOptions"
            :key="script.value"
            v-close-popup
            dense
            clickable
            @click="showRunScript(agent, script.value as number)"
          >
            <q-item-section>{{ script.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-item>

    <q-item
      v-close-popup
      clickable
      @click="runRemoteBackground(agent.agent_id, agent.plat)"
    >
      <q-item-section side>
        <q-icon size="xs" name="terminal" />
      </q-item-section>
      <q-item-section>Remote Background</q-item-section>
    </q-item>

    <!-- maintenance mode -->
    <q-item v-close-popup clickable @click="toggleMaintenance(agent)">
      <q-item-section side>
        <q-icon size="xs" name="construction" />
      </q-item-section>
      <q-item-section>
        {{ agent.maintenance_mode ? "Disable Maintenance Mode" : "Enable Maintenance Mode" }}
      </q-item-section>
    </q-item>

    <!-- patch management -->
    <q-item clickable>
      <q-item-section side>
        <q-icon size="xs" name="system_update" />
      </q-item-section>
      <q-item-section>Patch Management</q-item-section>
      <q-item-section side>
        <q-icon name="keyboard_arrow_right" />
      </q-item-section>

      <q-menu auto-close anchor="top right" self="top left">
        <q-list dense style="min-width: 100px">
          <q-item v-ripple clickable @click="runPatchStatusScan(agent)">
            <q-item-section>Run Patch Status Scan</q-item-section>
          </q-item>
          <q-item v-ripple clickable @click="installPatches(agent)">
            <q-item-section>Install Patches Now</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-item>

    <q-item v-close-popup clickable @click="runChecks(agent)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-check-double" />
      </q-item-section>
      <q-item-section>Run Checks</q-item-section>
    </q-item>

    <q-item v-close-popup clickable @click="wakeUp(agent)">
      <q-item-section side>
        <q-icon size="xs" name="offline_bolt" />
      </q-item-section>
      <q-item-section>Wake-Up (WoL)</q-item-section>
    </q-item>

    <q-item clickable>
      <q-item-section side>
        <q-icon size="xs" name="power_settings_new" />
      </q-item-section>
      <q-item-section>Reboot</q-item-section>
      <q-item-section side>
        <q-icon name="keyboard_arrow_right" />
      </q-item-section>

      <q-menu auto-close anchor="top right" self="top left">
        <q-list dense style="min-width: 100px">
          <!-- reboot now -->
          <q-item v-ripple clickable @click="rebootNow(agent)">
            <q-item-section>Now</q-item-section>
          </q-item>
          <!-- reboot later -->
          <q-item v-ripple clickable @click="showRebootLaterModal(agent)">
            <q-item-section>Later</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-item>

    <q-item v-close-popup clickable @click="shutdown(agent)">
      <q-item-section side>
        <q-icon size="xs" name="power" />
      </q-item-section>
      <q-item-section>Shutdown</q-item-section>
    </q-item>

    <q-item v-close-popup clickable @click="showPolicyAdd(agent)">
      <q-item-section side>
        <q-icon size="xs" name="policy" />
      </q-item-section>
      <q-item-section>Assign Automation Policy</q-item-section>
    </q-item>

    <q-item
      v-if="
        $integrations &&
        $integrations.agentMenuIntegrations &&
        $integrations.agentMenuIntegrations.length > 0
      "
      clickable
    >
      <q-item-section side>
        <q-icon size="xs" name="analytics" />
      </q-item-section>
      <q-item-section>Reporting</q-item-section>
      <q-item-section side>
        <q-icon name="keyboard_arrow_right" />
      </q-item-section>
      <integrations-context-menu :id="agent.agent_id" type="agent" />
    </q-item>

    <q-item v-close-popup clickable @click="showAgentRecovery(agent)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-first-aid" />
      </q-item-section>
      <q-item-section>Agent Recovery</q-item-section>
    </q-item>

    <q-item v-close-popup clickable @click="pingAgent(agent)">
      <q-item-section side>
        <q-icon size="xs" name="delete" />
      </q-item-section>
      <q-item-section>Remove Agent</q-item-section>
    </q-item>

    <q-separator />
    <q-item v-close-popup clickable>
      <q-item-section>Close</q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" setup>
// composition imports
import { onMounted } from "vue";
import { useQuasar } from "quasar";
import { useURLActionStore, runURLAction, useAgentStore, useCheckStore, useWindowsUpdateStore } from "src/stores/api";
import { useScriptDropdown } from "src/core/scripts/composables";

const { webActions, getURLActions } = useURLActionStore();
const { updateAgent, wakeUpWOL, runTakeControl, runRemoteBackground, runWebVNC, agentRebootNow, agentShutdown, sendAgentPing, removeAgent } = useAgentStore();
const { runAgentChecks } = useCheckStore();
const { runAgentUpdateScan, runAgentUpdateInstall } = useWindowsUpdateStore();

// ui imports
import PendingActions from "src/core/logs/components/PendingActions.vue";
import AgentRecovery from "./AgentRecovery.vue";
import PolicyAdd from "src/core/automation/components/PolicyAdd.vue";
import RebootLater from "./RebootLater.vue";
import EditAgent from "./EditAgent.vue";
import SendCommand from "./SendCommand.vue";
import RunScript from "./RunScript.vue";
import IntegrationsContextMenu from "src/core/dashboard/ui/IntegrationsContextMenu.vue";
import ConfirmYesDialog from "./ConfirmYesDialog.vue";

import type { Agent } from "../types";

defineProps<{
  agent: Agent;
}>();

// setup dropdowns
const { favoriteScriptOptions } = useScriptDropdown();

// setup quasar
const $q = useQuasar();

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

function showSendCommand(agent: Agent) {
  $q.dialog({
    component: SendCommand,
    componentProps: {
      agent: agent,
    },
  });
}

function showRunScript(agent: Agent, script: number | undefined = undefined) {
  $q.dialog({
    component: RunScript,
    componentProps: {
      agent,
      script,
    },
  });
}

function toggleMaintenance(agent: Agent) {
  const data = {
    maintenance_mode: !agent.maintenance_mode,
  };
  void updateAgent(agent.agent_id, data);
}

function runPatchStatusScan(agent: Agent) {
  void runAgentUpdateScan(agent.agent_id);
}

function installPatches(agent: Agent) {
  void runAgentUpdateInstall(agent.agent_id);
}

function runChecks(agent: Agent) {
  void runAgentChecks(agent.agent_id);
}

function wakeUp(agent: Agent) {
  void wakeUpWOL(agent.agent_id);
}

function showRebootLaterModal(agent: Agent) {
  $q.dialog({
    component: RebootLater,
    componentProps: {
      agent: agent,
    },
  });
}

function launchWebVNC(agentId: string) {
  $q.dialog({
    title: "VNC Server Port",
    message: "Enter the VNC server port:",
    prompt: {
      model: "5900",
      type: "text",
    },
    cancel: true,
    ok: { label: "Launch", color: "primary" },
    noBackdropDismiss: true,
  }).onOk((port) => {
    runWebVNC(agentId, port);
  });
}

function rebootNow(agent: Agent) {
  $q.dialog({
    title: "Are you sure?",
    message: `Reboot ${agent.hostname} now`,
    cancel: true,
    noBackdropDismiss: true,
  }).onOk(() => {
    void agentRebootNow(agent.agent_id);
  });
}

function shutdown(agent: Agent) {
  $q.dialog({
    component: ConfirmYesDialog,
    componentProps: {
      hostname: agent.hostname,
      actionVerb: "shutdown",
      title: "Confirm Shutdown",
      okLabel: "Shutdown",
      okColor: "negative",
    },
  }).onOk(() => {
    void agentShutdown(agent.agent_id);
  });
}

function showPolicyAdd(agent: Agent) {
  $q.dialog({
    component: PolicyAdd,
    componentProps: {
      type: "agent",
      object: agent,
    },
  });
}

function showAgentRecovery(agent: Agent) {
  $q.dialog({
    component: AgentRecovery,
    componentProps: {
      agent: agent,
    },
  });
}

async function pingAgent(agent: Agent) {
  const result = await sendAgentPing(agent.agent_id);
  if (result === "offline") {
    $q.dialog({
      title: "Agent offline",
      message: `${agent.hostname} cannot be contacted.
                  Would you like to continue with the uninstall?
                  If so, the agent will need to be manually uninstalled from the computer.`,
      cancel: { label: "No", color: "negative" },
      ok: { label: "Yes", color: "positive" },
      noBackdropDismiss: true,
    })
      .onOk(() => deleteAgent(agent))
      .onCancel(() => {
        return;
      });
  } else if (result === "online") {
    deleteAgent(agent);
  }
}

function deleteAgent(agent: Agent) {
  $q.dialog({
    component: ConfirmYesDialog,
    componentProps: {
      hostname: agent.hostname,
      actionVerb: "deletion",
      title: "Confirm Deletion",
      okLabel: "Uninstall",
      okColor: "negative",
    },
  }).onOk(() => {
    void removeAgent(agent.agent_id);
  });
}

onMounted(() => {
  getURLActions();
});
</script>
