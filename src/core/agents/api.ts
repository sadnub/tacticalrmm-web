import { ref, computed } from "vue";
import { openURL } from "quasar";
import { useRouter } from "vue-router";
import { defineStore } from "pinia";
import axios from "axios";
import { notifySuccess } from "src/utils/notify";
import type {
  Agent,
  AgentNote,
  AgentHistory,
  AgentSoftware,
  Software,
  WindowsUpdate,
  AgentPlat,
  AgentMonitoringType,
  AgentEventLog,
  AgentProcess,
  AgentService,
  AgentServiceStartType,
  WebVNCUrl,
  MeshUrls,
} from "./types";
import type { Check } from "../checks/types";
import type { AutomatedTask } from "../tasks/types";

export const useAgentStore = defineStore(
  "agents",
  () => {
    const agents = ref<Agent[]>([]);
    const selectedAgent = ref<Agent | null>(null);
    const selectedAgentId = ref<string | null>(null);
    const selectedAgentPlatform = computed(() => selectedAgent.value?.plat);

    const agentHistory = ref<AgentHistory[]>([]);
    const agentChecks = ref<Check[]>([]);
    const agentTasks = ref<AutomatedTask[]>([]);
    const agentProcesses = ref<AgentProcess[]>([]);
    const agentEventLog = ref<AgentEventLog[]>([]);
    const agentNotes = ref<AgentNote[]>([]);
    const agentSoftware = ref<Software[]>([]);
    const agentService = ref<AgentService | null>(null);
    const meshCentralURLs = ref<MeshUrls>({ client: "", site: "", hostname: "" });
    const webVNCUrl = ref<WebVNCUrl>({ client: "", site: "", hostname: "" });

    function clearSelectedAgent() {
      selectedAgent.value = null;
      selectedAgentId.value = null;
    }

    const router = useRouter();

    const isLoading = ref(false);
    const isError = ref(false);

    const agentCount = computed(() => agents.value.length);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function getAgents(_args?: { force: true }) {
      isLoading.value = true;
      isError.value = false;

      axios
        .get<Agent[]>("/agents/")
        .then(({ data }) => {
          agents.value = data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function getAgent(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      axios
        .get<Agent>(`/agents/${agent_id}/`)
        .then(({ data }) => {
          selectedAgent.value = data;
        })
        .catch(() => {
          isError.value = true;
          selectedAgent.value = null;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function updateAgent(agentId: string, payload: Partial<Agent>) {
      isLoading.value = true;
      isError.value = false;
      axios
        .put<Agent>(`/agents/${agentId}/`, payload)
        .then(({ data: updatedAgent }) => {
          const index = agents.value.findIndex((agent) => agent.agent_id === agentId);
          if (index !== -1) {
            agents.value[index] = updatedAgent;
          }
          notifySuccess("Agent was modified successfully");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function removeAgent(agentId: string) {
      isLoading.value = true;
      isError.value = false;

      axios
        .delete(`/agents/${agentId}/`)
        .then(() => {
          const index = agents.value.findIndex((agent) => agent.agent_id === agentId);
          if (index !== -1) {
            agents.value.splice(index, 1);
          }
          notifySuccess("Agent was deleted successfully");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function runTakeControl(agent_id: string) {
      const url = router.resolve(`/takecontrol/${agent_id}`).href;
      openURL(url, undefined, { popup: true, width: 1600, height: 900 });
    }

    function runWebVNC(agent_id: string, port: number) {
      const url = router.resolve(`/webvnc/${agent_id}/${port}`).href;
      openURL(url, undefined, { popup: true, width: 1600, height: 900 });
    }

    function openAgentWindow(agent_id: string) {
      const url = router.resolve(`/agents/${agent_id}`).href;
      openURL(url, undefined, { popup: true, width: 1600, height: 900 });
    }

    function runRemoteBackground(agent_id: string, agentPlatform: string) {
      const url = router.resolve(
        `/remotebackground/${agent_id}?agentPlatform=${agentPlatform}`,
      ).href;
      openURL(url, undefined, { popup: true, width: 1280, height: 900 });
    }

    function getAgentMeshCentralUrls(agentId: string) {
      isLoading.value = true;
      isError.value = false;
      meshCentralURLs.value = { client: "", site: "", hostname: "" };
      axios
        .get<MeshUrls>(`/agents/${agentId}/meshcentral/`)
        .then(({ data }) => {
          meshCentralURLs.value = data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function getAgentWebVNCUrl(agentId: string, port: number) {
      isLoading.value = true;
      isError.value = false;
      webVNCUrl.value = { client: "", site: "", hostname: "" };
      axios
        .get<WebVNCUrl>(`/agents/${agentId}/${port}/webvnc/`)
        .then(({ data }) => {
          webVNCUrl.value = data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function getAgentHistory(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      agentHistory.value = [];
      axios
        .get(`/agents/${agent_id}/history/`)
        .then(({ data }) => {
          agentHistory.value = data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function getAgentChecks(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      agentChecks.value = [];
      axios
        .get<Check[]>(`/agents/${agent_id}/checks/`)
        .then(({ data }) => {
          agentChecks.value = data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function resetAllAgentChecks(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      axios
        .get(`/agents/${agent_id}/resetall/`)
        .then(() => {
          agentChecks.value.forEach((check) => {
            if (check.check_result) check.check_result.status = "passing";
          });
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function runAgentChecks(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      axios
        .get(`/agents/${agent_id}/run/`)
        .then(() => {
          notifySuccess("Agent checks will be run shortly");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function getAgentTasks(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      agentTasks.value = [];
      axios
        .get<AutomatedTask[]>(`/agents/${agent_id}/tasks/`)
        .then(({ data }) => {
          agentTasks.value = data.filter(
            (task) => task.task_result?.sync_status !== "pendingdeletion",
          );
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function getAgentProcesses(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      agentProcesses.value = [];
      axios
        .get<AgentProcess[]>(`/agents/${agent_id}/processes/`)
        .then(({ data }) => {
          agentProcesses.value = data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function getAgentEventLog(agent_id: string, logType: string, days: number) {
      isLoading.value = true;
      isError.value = false;
      agentEventLog.value = [];
      axios
        .get<AgentEventLog[]>(`/agents/${agent_id}/eventlog/${logType}/${days}/`)
        .then(({ data }) => {
          agentEventLog.value = data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function getAgentNotes(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      agentNotes.value = [];
      axios
        .get<AgentNote[]>(`/agents/${agent_id}/notes/`)
        .then(({ data }) => {
          agentNotes.value = data;
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    interface AgentCommandRequest {
      cmd: string;
      timeout: number;
    }

    function sendAgentCommand(agent_id: string, payload: AgentCommandRequest) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post(`/agents/${agent_id}/cmd/`, payload)
        .then(() => notifySuccess("Command sent successfully."))
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    interface RunScriptRequest {
      output: "wait" | "forget" | "email" | "collector" | "note";
      emails: string[];
      emailMode: string;
      custom_field: number | null;
      save_all_output: boolean;
      script: number;
      args: string[];
      env_vars: string[];
      timeout: number;
      run_as_user: boolean;
      run_on_server: boolean;
    }

    function runScript(agent_id: string, payload: RunScriptRequest) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post(`/agents/${agent_id}/runscript/`, payload)
        .then(() => notifySuccess("Script execution started."))
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function agentRebootNow(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post(`/agents/${agent_id}/reboot/`)
        .then(() => notifySuccess("Agent reboot command sent."))
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function agentShutdown(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post(`/agents/${agent_id}/shutdown/`)
        .then(() => notifySuccess("Agent shutdown command sent."))
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function wakeUpWOL(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post(`/agents/${agent_id}/wol/`)
        .then(() => notifySuccess("Wake-on-LAN packet sent."))
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    type AgentRecoveryMode = "tacagent" | "mesh";

    function sendAgentRecovery(agent_id: string, payload: { mode: AgentRecoveryMode }) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post(`/agents/${agent_id}/recover/`, payload)
        .then(() => notifySuccess("Recovery action sent."))
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function refreshAgentWMI(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post(`/agents/${agent_id}/wmi/`)
        .then(() => notifySuccess("WMI refresh command sent."))
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function sendAgentRebootNow(agentId: string) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post(`/agents/${agentId}/reboot/`)
        .then(() => notifySuccess("Agent reboot command sent"))
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function sendAgentShutdown(agentId: string) {
      axios
        .post(`/agents/${agentId}/shutdown/`)
        .then(() => notifySuccess("Agent shutdown command sent"))
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function sendAgentRecoverMesh(agentId: string) {
      axios
        .post(`/agents/${agentId}/meshcentral/recover/`)
        .then(() => {
          getAgentMeshCentralUrls(agentId);
          notifySuccess("Mesh recovery command sent successfully");
        })
        .catch(() => {
          isError.value = true;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    type AgentPingResponse = "online" | "offline";
    function sendAgentPing(agentId: string): Promise<AgentPingResponse> {
      return axios
        .get<AgentPingResponse>(`/agents/${agentId}/ping/`)
        .then(({ data }) => {
          return data;
        })
        .catch((error) => {
          isError.value = true;
          throw error;
        })
        .finally(() => {
          isLoading.value = false;
        });
    }

    function scheduleAgentReboot(agent_id: string, payload: { datetime: string }) {
      isLoading.value = true;
      isError.value = false;
      axios
        .patch(`/agents/${agent_id}/reboot/`, payload)
        .then(() => notifySuccess("Reboot has been scheduled."))
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    type BulkActionMode = "script" | "command" | "patch";

    interface RunBulkActionRequest {
      mode: BulkActionMode;
      target: "client" | "site" | "agent" | "all";
      monType: AgentMonitoringType | "all";
      osType: AgentPlat;
      cmd: string;
      shell: "cmd" | "powershell" | "/bin/bash" | "custom";
      custom_shell: string;
      custom_field: number;
      collector_all_output: boolean;
      save_to_agent_note: boolean;
      patchMode: "scan" | "install";
      offlineAgents: boolean;
      client: number;
      site: number;
      agents: string[];
      script: number;
      timeout: number;
      args: string[];
      env_vars: string[];
      run_as_user: boolean;
    }
    function runBulkAction(payload: RunBulkActionRequest) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post(`/agents/actions/bulk/`, payload)
        .then(() => notifySuccess("Bulk action initiated."))
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    function killAgentProcess(agent_id: string, pid: number) {
      isLoading.value = true;
      isError.value = false;
      axios
        .delete(`/agents/${agent_id}/processes/${pid}/`)
        .then(() => {
          const index = agentProcesses.value.findIndex((p) => p.pid === pid);
          if (index !== -1) {
            agentProcesses.value.splice(index, 1);
          }
          notifySuccess(`Process ${pid} was terminated.`);
        })
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    interface AddAgentNoteRequest {
      note: string;
      agent_id: string;
    }

    function addAgentNote(payload: AddAgentNoteRequest) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post<AgentNote>(`/agents/notes/`, payload)
        .then(({ data: newNote }) => {
          agentNotes.value.unshift(newNote);
          notifySuccess("Note added successfully.");
        })
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    function updateAgentNote(id: number, payload: Partial<AgentNote>) {
      isLoading.value = true;
      isError.value = false;
      axios
        .put<AgentNote>(`/agents/notes/${id}/`, payload)
        .then(({ data: updatedNote }) => {
          const index = agentNotes.value.findIndex((note) => note.id === id);
          if (index !== -1) {
            agentNotes.value[index] = updatedNote;
          }
          notifySuccess("Note updated successfully.");
        })
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    function removeAgentNote(id: number) {
      isLoading.value = true;
      isError.value = false;
      axios
        .delete(`/agents/notes/${id}/`)
        .then(() => {
          const index = agentNotes.value.findIndex((note) => note.id === id);
          if (index !== -1) {
            agentNotes.value.splice(index, 1);
          }
          notifySuccess("Note removed successfully.");
        })
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    function getAgentSoftware(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      agentSoftware.value = [];
      axios
        .get<AgentSoftware>(`/software/${agent_id}/`)
        .then(({ data }) => {
          agentSoftware.value = data.software;
        })
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    interface InstallSoftwareRequest {
      name: string;
    }

    function installAgentSoftware(agent_id: string, payload: InstallSoftwareRequest) {
      isLoading.value = true;
      isError.value = false;
      axios
        .post(`/software/${agent_id}/`, payload)
        .then(() => {
          notifySuccess("The software install was initiated successfully");
        })
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    function refreshAgentSoftware(agent_id: string) {
      isLoading.value = true;
      isError.value = false;
      axios
        .put(`/software/${agent_id}/`)
        .then(() => {
          getAgentSoftware(agent_id);
          notifySuccess("Software was successfully refreshed");
        })
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    function getAgentServices(agentId: string) {
      isLoading.value = true;
      isError.value = false;
      axios
        .get<AgentService[]>(`/services/${agentId}/`)
        .then(({ data }) => {
          if (selectedAgent.value) selectedAgent.value.services = data;
          else {
            getAgent(agentId);
            selectedAgentId.value = agentId;
            getAgentServices(agentId);
          }
        })
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    function getAgentServiceDetails(agent_id: string, svcname: string) {
      isLoading.value = true;
      isError.value = false;
      agentService.value = null;
      axios
        .get<AgentService>(`/services/${agent_id}/${svcname}/`)
        .then(({ data }) => {
          agentService.value = data;
        })
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    function sendAgentServiceAction(
      agent_id: string,
      svcname: string,
      action: "start" | "stop" | "restart",
    ) {
      axios
        .put(`/services/${agent_id}/${svcname}/`, { sv_action: action })
        .then(() => {
          // TODO: fix this need to get the new service details and update the services list
        })
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    function updateAgentService(
      agent_id: string,
      svcname: string,
      startType: AgentServiceStartType,
    ) {
      axios
        .post(`/services/${agent_id}/${svcname}/`, { start_type: startType })
        .then(() => {
          // TODO: fix this need to get the new service details and update the services list
        })
        .catch(() => (isError.value = true))
        .finally(() => (isLoading.value = false));
    }

    return {
      agents,
      selectedAgent,
      selectedAgentId,
      selectedAgentPlatform,
      clearSelectedAgent,
      agentHistory,
      agentChecks,
      agentTasks,
      agentProcesses,
      agentEventLog,
      agentNotes,
      agentSoftware,
      meshCentralURLs,
      webVNCUrl,
      isLoading,
      isError,
      agentCount,
      runTakeControl,
      runWebVNC,
      getAgentMeshCentralUrls,
      getAgentWebVNCUrl,
      openAgentWindow,
      runRemoteBackground,
      getAgents,
      getAgent,
      updateAgent,
      removeAgent,
      getAgentHistory,
      getAgentChecks,
      resetAllAgentChecks,
      runAgentChecks,
      getAgentTasks,
      getAgentProcesses,
      getAgentEventLog,
      getAgentNotes,
      sendAgentCommand,
      runScript,
      agentRebootNow,
      agentShutdown,
      wakeUpWOL,
      sendAgentPing,
      sendAgentRebootNow,
      sendAgentShutdown,
      sendAgentRecoverMesh,
      sendAgentRecovery,
      refreshAgentWMI,
      scheduleAgentReboot,
      runBulkAction,
      killAgentProcess,
      addAgentNote,
      updateAgentNote,
      removeAgentNote,
      getAgentSoftware,
      installAgentSoftware,
      refreshAgentSoftware,
      getAgentServices,
      getAgentServiceDetails,
      updateAgentService,
      sendAgentServiceAction,
    };
  },
  {
    cache: {
      getAgents: {
        duration: 5 * 60 * 1000,
      },
      getAgent: {
        duration: 10 * 1000,
      },
    },
  },
);

export const useWinUpdateStore = defineStore("winUpdates", () => {
  const updates = ref<WindowsUpdate[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getAgentUpdates(agent_id: string) {
    isLoading.value = true;
    isError.value = false;
    updates.value = [];

    axios
      .get<WindowsUpdate[]>(`/winupdate/${agent_id}/`)
      .then(({ data }) => {
        updates.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function runAgentUpdateScan(agent_id: string) {
    isLoading.value = true;
    isError.value = false;

    axios
      .post(`/winupdate/${agent_id}/scan/`)
      .then(() => {
        notifySuccess("Update scan initiated successfully.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function runAgentUpdateInstall(agent_id: string) {
    isLoading.value = true;
    isError.value = false;

    axios
      .post(`/winupdate/${agent_id}/install/`)
      .then(() => {
        notifySuccess("Update installation process started.");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateAgentUpdate(id: number, payload: Partial<WindowsUpdate>) {
    isLoading.value = true;
    isError.value = false;

    axios
      .put<WindowsUpdate>(`/winupdate/${id}/`, payload)
      .then(({ data: updatedUpdate }) => {
        const index = updates.value.findIndex((update) => update.id === id);
        if (index !== -1) {
          updates.value[index] = updatedUpdate;
        }
        notifySuccess(`Update was modified successfully.`);
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  return {
    updates,
    isLoading,
    isError,
    getAgentUpdates,
    runAgentUpdateScan,
    runAgentUpdateInstall,
    updateAgentUpdate,
  };
});
