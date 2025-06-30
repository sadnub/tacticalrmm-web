<template>
  <q-list dense style="min-width: 200px">
    <!-- edit agent -->
    <q-item clickable v-close-popup @click="showEditAgent(agent.agent_id)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-edit" />
      </q-item-section>
      <q-item-section>Edit {{ agent.hostname }}</q-item-section>
    </q-item>
    <!-- agent pending actions -->
    <q-item clickable v-close-popup @click="showPendingActionsModal(agent)">
      <q-item-section side>
        <q-icon size="xs" name="far fa-clock" />
      </q-item-section>
      <q-item-section>Pending Agent Actions</q-item-section>
    </q-item>
    <!-- take control -->
    <q-item clickable v-ripple v-close-popup @click="agentStore.runTakeControl(agent.agent_id)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-desktop" />
      </q-item-section>

      <q-item-section>Take Control</q-item-section>
    </q-item>

    <!-- vnc -->
    <q-item clickable v-ripple v-close-popup @click="launchWebVNC(agent.agent_id)">
      <q-item-section side>
        <q-icon size="xs" name="screen_share" />
      </q-item-section>

      <q-item-section>VNC</q-item-section>
    </q-item>

    <q-item clickable v-ripple @click="actionStore.getURLActions">
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
            v-for="action in actionStore.webActions"
            :key="action.id"
            dense
            clickable
            v-close-popup
            @click="actionStore.runURLAction(action.id, 'agent', agent.agent_id)"
          >
            {{ action.name }}
          </q-item>
        </q-list>
      </q-menu>
    </q-item>

    <q-item clickable v-ripple v-close-popup @click="showSendCommand(agent)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-terminal" />
      </q-item-section>
      <q-item-section>Send Command</q-item-section>
    </q-item>

    <q-item clickable v-ripple v-close-popup @click="showRunScript(agent)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-terminal" />
      </q-item-section>
      <q-item-section>Run Script</q-item-section>
    </q-item>

    <q-item clickable v-ripple>
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
            dense
            clickable
            v-close-popup
            @click="showRunScript(agent, script)"
          >
            {{ script.label }}
          </q-item>
        </q-list>
      </q-menu>
    </q-item>

    <q-item
      clickable
      v-close-popup
      @click="agentStore.runRemoteBackground(agent.agent_id, agent.plat)"
    >
      <q-item-section side>
        <q-icon size="xs" name="terminal" />
      </q-item-section>
      <q-item-section>Remote Background</q-item-section>
    </q-item>

    <!-- maintenance mode -->
    <q-item clickable v-close-popup @click="toggleMaintenance(agent)">
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
          <q-item clickable v-ripple @click="runPatchStatusScan(agent)">
            <q-item-section>Run Patch Status Scan</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="installPatches(agent)">
            <q-item-section>Install Patches Now</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-item>

    <q-item clickable v-close-popup @click="runChecks(agent)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-check-double" />
      </q-item-section>
      <q-item-section>Run Checks</q-item-section>
    </q-item>

    <q-item clickable v-close-popup @click="wakeUp(agent)">
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
          <q-item clickable v-ripple @click="rebootNow(agent)">
            <q-item-section>Now</q-item-section>
          </q-item>
          <!-- reboot later -->
          <q-item clickable v-ripple @click="showRebootLaterModal(agent)">
            <q-item-section>Later</q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-item>

    <q-item clickable v-close-popup @click="shutdown(agent)">
      <q-item-section side>
        <q-icon size="xs" name="power" />
      </q-item-section>
      <q-item-section>Shutdown</q-item-section>
    </q-item>

    <q-item clickable v-close-popup @click="showPolicyAdd(agent)">
      <q-item-section side>
        <q-icon size="xs" name="policy" />
      </q-item-section>
      <q-item-section>Assign Automation Policy</q-item-section>
    </q-item>

    <q-item
      clickable
      v-if="
        $integrations &&
        $integrations.agentMenuIntegrations &&
        $integrations.agentMenuIntegrations.length > 0
      "
    >
      <q-item-section side>
        <q-icon size="xs" name="analytics" />
      </q-item-section>
      <q-item-section>Reporting</q-item-section>
      <q-item-section side>
        <q-icon name="keyboard_arrow_right" />
      </q-item-section>
      <integrations-context-menu type="agent" :id="agent.agent_id" />
    </q-item>

    <q-item clickable v-close-popup @click="showAgentRecovery(agent)">
      <q-item-section side>
        <q-icon size="xs" name="fas fa-first-aid" />
      </q-item-section>
      <q-item-section>Agent Recovery</q-item-section>
    </q-item>

    <q-item clickable v-close-popup @click="pingAgent(agent)">
      <q-item-section side>
        <q-icon size="xs" name="delete" />
      </q-item-section>
      <q-item-section>Remove Agent</q-item-section>
    </q-item>

    <q-separator />
    <q-item clickable v-close-popup>
      <q-item-section>Close</q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts" setup>
// composition imports
import { useQuasar } from "quasar";
import { useURLActionStore } from "src/core/settings/api";
import { useAgentStore } from "../api";
import { useScriptDropdown } from "src/core/scripts/composables";
import { useWinUpdateStore } from "../api";

// ui imports
import PendingActions from "src/core/logs/components/PendingActions.vue";
import AgentRecovery from "src/components/modals/agents/AgentRecovery.vue";
import PolicyAdd from "src/components/automation/modals/PolicyAdd.vue";
import RebootLater from "src/components/modals/agents/RebootLater.vue";
import EditAgent from "src/components/modals/agents/EditAgent.vue";
import SendCommand from "src/components/modals/agents/SendCommand.vue";
import RunScript from "src/components/modals/agents/RunScript.vue";
import IntegrationsContextMenu from "src/components/ui/IntegrationsContextMenu.vue";

import DOMPurify from "dompurify";
import type { Agent } from "../types";
import type { Script } from "src/core/scripts/types";

defineProps<{
  agent: Agent;
}>();

// setup stores
const agentStore = useAgentStore();
const actionStore = useURLActionStore();
const updateStore = useWinUpdateStore();

// setup dropdowns
const { favoriteScriptOptions } = useScriptDropdown();

// setup quasar
const $q = useQuasar();

function showEditAgent(agent_id: string) {
  $q.dialog({
    component: EditAgent,
    componentProps: {
      agent_id: agent_id,
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

function showRunScript(agent: Agent, script: Script | undefined = undefined) {
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
  agentStore.updateAgent(agent.agent_id, data);
}

function runPatchStatusScan(agent: Agent) {
  updateStore.runAgentUpdateScan(agent.agent_id);
}

function installPatches(agent: Agent) {
  updateStore.runAgentUpdateInstall(agent.agent_id);
}

function runChecks(agent: Agent) {
  agentStore.runAgentChecks(agent.agent_id);
}

function wakeUp(agent: Agent) {
  agentStore.wakeUpWOL(agent.agent_id);
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
    persistent: true,
  }).onOk((port) => {
    agentStore.runWebVNC(agentId, port);
  });
}

function rebootNow(agent: Agent) {
  $q.dialog({
    title: "Are you sure?",
    message: `Reboot ${agent.hostname} now`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    agentStore.agentRebootNow(agent.agent_id);
  });
}

function shutdown(agent: Agent) {
  const clean = DOMPurify.sanitize(agent.hostname);
  $q.dialog({
    title: `Please type <code style="color:red">yes</code> in the box below to confirm shutdown of <span style="color:red">${clean}</span>.`,
    prompt: {
      model: "",
      type: "text",
      isValid: (val) => val === "yes",
    },
    cancel: true,
    ok: { label: "Shutdown", color: "negative" },
    persistent: true,
    html: true,
  }).onOk(() => {
    agentStore.agentShutdown(agent.agent_id);
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
  const result = await agentStore.sendAgentPing(agent.agent_id);
  if (result === "offline") {
    $q.dialog({
      title: "Agent offline",
      message: `${agent.hostname} cannot be contacted.
                  Would you like to continue with the uninstall?
                  If so, the agent will need to be manually uninstalled from the computer.`,
      cancel: { label: "No", color: "negative" },
      ok: { label: "Yes", color: "positive" },
      persistent: true,
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
  const clean = DOMPurify.sanitize(agent.hostname);
  $q.dialog({
    title: `Please type <code style="color:red">yes</code> in the box below to confirm deletion of <span style="color:red">${clean}</span>.`,
    prompt: {
      model: "",
      type: "text",
      isValid: (val) => val === "yes",
    },
    cancel: true,
    ok: { label: "Uninstall", color: "negative" },
    persistent: true,
    html: true,
  }).onOk(() => {
    agentStore.removeAgent(agent.agent_id);
  });
}
</script>
