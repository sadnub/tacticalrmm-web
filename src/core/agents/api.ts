import { ref, computed, watch } from "vue";
import { openURL } from "quasar";
import { router } from "src/router";
import axios from "axios";
import { notifySuccess } from "src/utils/notify";
import { useCachedAction } from "../dashboard/composables";
import type {
  Agent,
  AgentNote,
  AgentHistory,
  AgentSoftware,
  Software,
  WindowsUpdate,
  AgentEventLog,
  AgentProcess,
  AgentService,
  AgentServiceStartType,
  WebVNCUrl,
  MeshUrls,
  TerminalDefaults,
  AgentRecoveryMode,
  RunBulkActionRequest,
  RunScriptRequest,
  AgentVersionsResponse,
  AgentCommandRequest,
  AgentSearchParams,
  AgentSearchResponse,
} from "./types";
import type { ScriptResult } from "../scripts/types";

// Lazy singleton instances
let agentStoreInstance: ReturnType<typeof createAgentStore> | null = null;
let agentSoftwareStoreInstance: ReturnType<typeof createAgentSoftwareStore> | null = null;
let agentNoteStoreInstance: ReturnType<typeof createAgentNoteStore> | null = null;
let windowsUpdateStoreInstance: ReturnType<typeof createWindowsUpdateStore> | null = null;

export function useAgentStore() {
  if (!agentStoreInstance) {
    agentStoreInstance = createAgentStore();
  }
  return agentStoreInstance;
}

export function useAgentSoftwareStore() {
  if (!agentSoftwareStoreInstance) {
    agentSoftwareStoreInstance = createAgentSoftwareStore();
  }
  return agentSoftwareStoreInstance;
}

export function useAgentNoteStore() {
  if (!agentNoteStoreInstance) {
    agentNoteStoreInstance = createAgentNoteStore();
  }
  return agentNoteStoreInstance;
}

export function useWindowsUpdateStore() {
  if (!windowsUpdateStoreInstance) {
    windowsUpdateStoreInstance = createWindowsUpdateStore();
  }
  return windowsUpdateStoreInstance;
}

function createAgentStore() {
  const agents = ref<Agent[]>([]);
  const dropdownAgents = ref<Agent[]>([]); // Separate array for dropdown use
  const selectedAgentIds = ref<string[]>([]);
  const selectedAgent = ref<Agent | null>(null);

  // Computed: single selected agent_id (for tabs that need single selection)
  const selectedAgentId = computed(() =>
    selectedAgentIds.value.length === 1 ? (selectedAgentIds.value[0] ?? null) : null,
  );

  // Computed: platform of single selected agent
  const selectedAgentPlatform = computed(() => {
    if (selectedAgentIds.value.length !== 1) return undefined;
    const agent = agents.value.find((a) => a.agent_id === selectedAgentIds.value[0]);
    return agent?.plat;
  });

  const agentHistory = ref<AgentHistory[]>([]);
  const agentProcesses = ref<AgentProcess[]>([]);
  const agentEventLog = ref<AgentEventLog[]>([]);
  const agentServices = ref<AgentService[]>([]);

  function clearSelectedAgent() {
    selectedAgentIds.value = [];
    selectedAgent.value = null;
    agentHistory.value = [];
    agentProcesses.value = [];
    agentEventLog.value = [];
    agentServices.value = [];
  }

  const isLoading = ref(false);
  const isError = ref(false);
  const rowsNumber = ref(0);
  const lastSearchParams = ref<AgentSearchParams>({});

  const agentCount = computed(() => agents.value.length);
  const agentEventLogCount = computed(() => agentEventLog.value.length);

  function searchAgents(params: AgentSearchParams) {
    isLoading.value = true;
    isError.value = false;
    lastSearchParams.value = { ...params };
    clearSelectedAgent();

    axios
      .patch<AgentSearchResponse>("/agents/v2/", params)
      .then(({ data: { agents: agentsData, total } }) => {
        agents.value = agentsData;
        rowsNumber.value = total;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function refreshAgentSearch() {
    searchAgents(lastSearchParams.value);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _getAgents(_args?: { force: boolean }) {
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

  const getAgents = useCachedAction(_getAgents, { key: "getAgents", duration: 5 * 60 * 1000 });

  // Separate function for dropdown agents - doesn't affect table pagination
  const isDropdownLoading = ref(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _getDropdownAgents(_args?: { force: boolean }) {
    isDropdownLoading.value = true;

    axios
      .get<Agent[]>("/agents/")
      .then(({ data }) => {
        dropdownAgents.value = data;
      })
      .catch(() => {
        // Silent fail for dropdown
      })
      .finally(() => {
        isDropdownLoading.value = false;
      });
  }

  const getDropdownAgents = useCachedAction(_getDropdownAgents, {
    key: "getDropdownAgents",
    duration: 5 * 60 * 1000,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _getAgent(agent_id: string, _args?: { force: boolean }) {
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

  const getAgent = useCachedAction(_getAgent, { key: "getAgent", duration: 1 * 60 * 1000 });

  // When single agent is selected, fetch full details
  watch(selectedAgentId, (newValue, oldValue) => {
    if (newValue) {
      // Force refresh if coming from multi-select (oldValue was null)
      getAgent(newValue, { force: oldValue === null });
    } else {
      selectedAgent.value = null;
      agentHistory.value = [];
      agentProcesses.value = [];
      agentEventLog.value = [];
      agentServices.value = [];
    }
  });

  async function updateAgent(agentId: string, payload: Partial<Agent>) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<Agent>(`/agents/${agentId}/`, payload);

      const index = agents.value.findIndex((agent) => agent.agent_id === agentId);
      if (index !== -1) {
        agents.value[index] = data;
      }

      if (selectedAgentId.value === agentId) selectedAgent.value = data;

      notifySuccess("Agent was modified successfully");
      return data;
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeAgent(agentId: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/agents/${agentId}/`);
      const index = agents.value.findIndex((agent) => agent.agent_id === agentId);
      if (index !== -1) {
        agents.value.splice(index, 1);
      }

      clearSelectedAgent();
      notifySuccess("Agent was deleted successfully");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
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
    const url = router.resolve(`/remotebackground/${agent_id}?agentPlatform=${agentPlatform}`).href;
    openURL(url, undefined, { popup: true, width: 1280, height: 900 });
  }

  async function getAgentMeshCentralUrls(agentId: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.get<MeshUrls>(`/agents/${agentId}/meshcentral/`);
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function getAgentTerminalDefaults(agentId: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.get<TerminalDefaults>(`/agents/${agentId}/terminal-defaults/`);
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function getAgentWebVNCUrl(agentId: string, port: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.get<WebVNCUrl>(`/agents/${agentId}/${port}/webvnc/`);
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _getAgentHistory(agent_id: string, _args?: { force: boolean }) {
    isLoading.value = true;
    isError.value = false;
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

  const getAgentHistory = useCachedAction(_getAgentHistory, {
    key: "getAgentHistory",
    duration: 30 * 1000,
  });

  function getAgentProcesses(agent_id: string) {
    isLoading.value = true;
    isError.value = false;
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

  async function sendAgentCommand(agent_id: string, payload: AgentCommandRequest) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<string>(`/agents/${agent_id}/cmd/`, payload);
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function runScript(
    agent_id: string,
    payload: RunScriptRequest,
  ): Promise<ScriptResult | string | void> {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<ScriptResult | string>(
        `/agents/${agent_id}/runscript/`,
        payload,
      );
      return data;
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function agentRebootNow(agent_id: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/agents/${agent_id}/reboot/`);
      notifySuccess("Agent reboot command sent.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function agentShutdown(agent_id: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/agents/${agent_id}/shutdown/`);
      notifySuccess("Agent shutdown command sent.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function wakeUpWOL(agent_id: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/agents/${agent_id}/wol/`);
      notifySuccess("Wake-on-LAN packet sent.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function sendAgentRecovery(agent_id: string, mode: AgentRecoveryMode) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/agents/${agent_id}/recover/`, { mode });
      notifySuccess("Recovery action sent.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function refreshAgentWMI(agent_id: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/agents/${agent_id}/wmi/`);
      notifySuccess("WMI refresh command sent.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function sendAgentRebootNow(agentId: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/agents/${agentId}/reboot/`);
      notifySuccess("Agent reboot command sent");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function sendAgentShutdown(agentId: string) {
    try {
      await axios.post(`/agents/${agentId}/shutdown/`);
      notifySuccess("Agent shutdown command sent");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function sendAgentRecoverMesh(agentId: string) {
    try {
      await axios.post(`/agents/${agentId}/meshcentral/recover/`);
      const result = await getAgentMeshCentralUrls(agentId);
      notifySuccess("Mesh recovery command sent successfully");
      return result;
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  type AgentPingResponse = "online" | "offline";
  async function sendAgentPing(agentId: string) {
    try {
      const { data } = await axios.get<AgentPingResponse>(`/agents/${agentId}/ping/`);
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function scheduleAgentReboot(agent_id: string, payload: { datetime: string }) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.patch(`/agents/${agent_id}/reboot/`, payload);
      notifySuccess("Reboot has been scheduled.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function runBulkAction(payload: RunBulkActionRequest) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/agents/actions/bulk/`, payload);
      notifySuccess("Bulk action initiated.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function killAgentProcess(agent_id: string, pid: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.delete(`/agents/${agent_id}/processes/${pid}/`);
      const index = agentProcesses.value.findIndex((p) => p.pid === pid);
      if (index !== -1) {
        agentProcesses.value.splice(index, 1);
      }
      notifySuccess(`Process ${pid} was terminated.`);
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  function getAgentServices(agentId: string) {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<AgentService[]>(`/services/${agentId}/`)
      .then(({ data }) => {
        agentServices.value = data;
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  async function getAgentServiceDetails(agentId: string, svcname: string) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.get<AgentService>(`/services/${agentId}/${svcname}/`);
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function sendAgentServiceAction(
    agentId: string,
    svcname: string,
    action: "start" | "stop" | "restart",
  ) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.post(`/services/${agentId}/${svcname}/`, { sv_action: action });

      // update service in the list
      const service = await getAgentServiceDetails(agentId, svcname);
      const index = agentServices.value.findIndex((s) => s.name === svcname);
      if (index !== -1 && service) {
        agentServices.value[index] = service;
      }
      notifySuccess("Service action sent successfully");

      return service;
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateAgentService(
    agentId: string,
    svcname: string,
    startType: AgentServiceStartType,
  ) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.put(`/services/${agentId}/${svcname}/`, {
        startType: startType,
      });

      // update service in the list
      const service = await getAgentServiceDetails(agentId, svcname);
      const index = agentServices.value.findIndex((s) => s.name === svcname);
      if (index !== -1 && service) {
        agentServices.value[index] = service;
      }
      notifySuccess("The service was updated successfully");

      return service;
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function getAgentVersions() {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.get<AgentVersionsResponse>("/agents/versions/");
      return data;
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateAgentVersions(agentIds: string[]) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post("/agents/update/", { agent_ids: agentIds });
      notifySuccess("Agents will now be updated");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function bulkAgentRecovery() {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.get("/agents/bulkrecovery/");
      notifySuccess("Agents will now be recovered");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }
  return {
    agents,
    dropdownAgents,
    selectedAgentIds,
    selectedAgent,
    selectedAgentId,
    selectedAgentPlatform,
    clearSelectedAgent,
    agentHistory,
    agentProcesses,
    agentServices,
    agentEventLog,
    agentEventLogCount,
    isLoading,
    isDropdownLoading,
    isError,
    agentCount,
    rowsNumber,
    searchAgents,
    refreshAgentSearch,
    runTakeControl,
    runWebVNC,
    getAgentMeshCentralUrls,
    getAgentTerminalDefaults,
    getAgentWebVNCUrl,
    openAgentWindow,
    runRemoteBackground,
    getAgents,
    getDropdownAgents,
    getAgent,
    updateAgent,
    removeAgent,
    getAgentHistory,
    getAgentProcesses,
    getAgentEventLog,
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
    getAgentServices,
    getAgentServiceDetails,
    updateAgentService,
    sendAgentServiceAction,
    getAgentVersions,
    updateAgentVersions,
    bulkAgentRecovery,
  };
}

function createAgentSoftwareStore() {
  const isLoading = ref(true);
  const isError = ref(false);

  const agentSoftware = ref<Software[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _getAgentSoftware(agent_id: string, _args?: { force: boolean }) {
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

  const getAgentSoftware = useCachedAction(_getAgentSoftware, {
    key: "getAgentSoftware",
    duration: 30 * 1000,
  });

  interface InstallSoftwareRequest {
    name: string;
  }

  async function installAgentSoftware(agent_id: string, payload: InstallSoftwareRequest) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/software/${agent_id}/`, payload);
      notifySuccess("The software install was initiated successfully");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  interface UninstallSoftwareRequest {
    name: string;
    command: string;
    run_as_user: boolean;
    timeout: number;
  }

  async function uninstallAgentSoftware(agent_id: string, payload: UninstallSoftwareRequest) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete<string>(`/software/${agent_id}/`, { data: payload });
      notifySuccess("Uninstall command was sent successfully");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    agentSoftware,
    isLoading,
    isError,
    getAgentSoftware,
    installAgentSoftware,
    uninstallAgentSoftware,
  };
}

function createAgentNoteStore() {
  const isLoading = ref(true);
  const isError = ref(false);

  const agentNotes = ref<AgentNote[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _getAgentNotes(agent_id: string, _args?: { force: boolean }) {
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

  const getAgentNotes = useCachedAction(_getAgentNotes, {
    key: "getAgentNotes",
    duration: 30 * 1000,
  });
  interface AddAgentNoteRequest {
    note: string;
    agent_id: string;
  }

  async function addAgentNote(payload: AddAgentNoteRequest) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<AgentNote>(`/agents/notes/`, payload);
      agentNotes.value.unshift(data);
      notifySuccess("Note added successfully.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateAgentNote(id: number, payload: Partial<AgentNote>) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<AgentNote>(`/agents/notes/${id}/`, payload);
      const index = agentNotes.value.findIndex((note) => note.id === id);
      if (index !== -1) {
        agentNotes.value[index] = data;
      }
      notifySuccess("Note updated successfully.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeAgentNote(id: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/agents/notes/${id}/`);
      const index = agentNotes.value.findIndex((note) => note.id === id);
      if (index !== -1) {
        agentNotes.value.splice(index, 1);
      }
      notifySuccess("Note removed successfully.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    agentNotes,
    getAgentNotes,
    addAgentNote,
    updateAgentNote,
    removeAgentNote,
  };
}

function createWindowsUpdateStore() {
  const isLoading = ref(false);
  const isError = ref(false);

  const updates = ref<WindowsUpdate[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _getAgentUpdates(agent_id: string, _args?: { force: boolean }) {
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

  const getAgentUpdates = useCachedAction(_getAgentUpdates, {
    key: "getAgentUpdates",
    duration: 30 * 1000,
  });

  async function runAgentUpdateScan(agent_id: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/winupdate/${agent_id}/scan/`);
      notifySuccess("Update scan initiated successfully.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function runAgentUpdateInstall(agent_id: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.post(`/winupdate/${agent_id}/install/`);
      notifySuccess("Update installation process started.");
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateAgentUpdate(id: number, payload: Partial<WindowsUpdate>) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data: updatedUpdate } = await axios.put<WindowsUpdate>(`/winupdate/${id}/`, payload);
      const index = updates.value.findIndex((update) => update.id === id);
      if (index !== -1) {
        updates.value[index] = updatedUpdate;
      }
      notifySuccess(`Update was modified successfully.`);
      return updatedUpdate;
    } catch (e) {
      isError.value = true;
      throw e;
    } finally {
      isLoading.value = false;
    }
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
}

// Registry API functions (standalone, not store-based)
export async function fetchAgentRegistry(
  agent_id: string,
  path: string,
  page = 1,
  hiveSearch = false,
) {
  const { data } = await axios.get(`/agents/${agent_id}/registry/`, {
    params: { path: `${path}`, page, page_size: hiveSearch ? 100000 : 400 },
  });
  return data;
}

export async function deleteRegistryKey(agent_id: string, path: string) {
  const { data } = await axios.delete(`/agents/${agent_id}/registry/delete-key/`, {
    params: { path: `${path}` },
  });
  return data;
}

export async function createRegistryKey(agent_id: string, path: string) {
  const { data } = await axios.post(`/agents/${agent_id}/registry/create-key/`, { path });
  return data;
}

export async function renameRegistryKey(agent_id: string, old_path: string, new_path: string) {
  const { data } = await axios.post(`/agents/${agent_id}/registry/rename-key/`, {
    old_path,
    new_path,
  });
  return data;
}

export async function deleteRegistryValue(agent_id: string, path: string, name: string) {
  const { data } = await axios.delete(`/agents/${agent_id}/registry/delete-value/`, {
    params: { path, name },
  });
  return data;
}

export async function renameRegistryValue(
  agentId: string,
  path: string,
  oldName: string,
  newName: string,
) {
  const { data } = await axios.post(`/agents/${agentId}/registry/rename-value/`, {
    path,
    old_name: oldName,
    new_name: newName,
  });
  return data;
}

export async function modifyRegistryValue(
  agentId: string,
  path: string,
  name: string,
  type: string,
  dataValue: string,
) {
  const { data } = await axios.post(`/agents/${agentId}/registry/modify-value/`, {
    path,
    name,
    type,
    data: dataValue,
  });
  return data;
}

export async function createRegistryValue(
  agentId: string,
  path: string,
  name: string,
  type: string,
  dataValue: string,
) {
  const formData = new FormData();
  formData.append("path", path);
  formData.append("name", name);
  formData.append("type", type);
  formData.append("data", dataValue);
  const { data } = await axios.post(`/agents/${agentId}/registry/create-value/`, formData);
  return data;
}
