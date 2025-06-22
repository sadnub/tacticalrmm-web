import { defineStore } from "pinia";
import { ref, reactive, watch, onMounted } from "vue";
import axios from "axios";
import { formatDate as formatDateUtil } from "src/utils/format";
import { Screen } from "quasar";
import { useDashWSConnection } from "src/websocket/websocket";
import type { AgentDblClickAction, ClientTreeSort, AgentTableTab } from "src/core/accounts/types";
import type { AgentPlat } from "src/core/agents/types";

export interface WSAgentCount {
  total_server_count: number;
  total_server_offline_count: number;
  total_workstation_count: number;
  total_workstation_offline_count: number;
  days_until_cert_expires: number;
}

export interface DashboardSettings {
  currentTRMMVersion: string | null;
  latestTRMMVersion: string | null;
  agentUrlAction: number | null;
  agentDblClickAction: AgentDblClickAction;
  showCommunityScripts: boolean;
  hosted: boolean;
  tokenExpired: boolean;
  openAIIntegrationStatus: boolean;
  runCmdPlaceholderText: {
    cmd: string;
    powershell: string;
    shell: string;
  };
  serverScriptsEnabled: boolean;
  webTerminalEnabled: boolean;
  blockLocalUserLogon: boolean;
  clearSearchWhenSwitching: boolean;
  defaultAgentTblTab: AgentTableTab;
  clientTreeSort: ClientTreeSort;
  clientTreeSpliter: number;
  dashPositiveColor: string;
  dashNegativeColor: string;
  dashWarningColor: string;
  dashInfoColor: string;
  darkMode: boolean;
  loadingBarColor: string;
  dateFormat: string;
}

export const useDashboardStore = defineStore("dashboard", () => {
  // updated by dashboard.agentcount event
  const serverCount = ref(0);
  const serverOfflineCount = ref(0);
  const workstationCount = ref(0);
  const workstationOfflineCount = ref(0);
  const daysUntilCertExpires = ref(180);

  const dashboardSettings = reactive<DashboardSettings>({
    currentTRMMVersion: null,
    latestTRMMVersion: null,
    agentUrlAction: null,
    agentDblClickAction: "editagent",
    showCommunityScripts: false,
    hosted: false,
    tokenExpired: false,
    openAIIntegrationStatus: false,
    runCmdPlaceholderText: {
      cmd: "rmdir /S /Q C:\\Windows\\System32",
      powershell: "Remove-Item -Recurse -Force C:\\Windows\\System32",
      shell: "rm -rf --no-preserve-root /",
    },
    serverScriptsEnabled: true,
    webTerminalEnabled: true,
    blockLocalUserLogon: false,
    clearSearchWhenSwitching: false,
    defaultAgentTblTab: "mixed",
    clientTreeSort: "alphafail",
    clientTreeSpliter: 20,
    dashPositiveColor: "positive",
    dashNegativeColor: "negative",
    dashWarningColor: "warning",
    dashInfoColor: "info",
    loadingBarColor: "",
    darkMode: false,
    dateFormat: "MMM-DD-YYYY - HH:mm",
  });

  const tabHeight = ref(300);
  const tableHeight = ref(300);

  function setTableHeight(val: number) {
    // top toolbar is 50px. Filebar is 40px and agent filter tabs are 44px
    tableHeight.value = Screen.height - 50 - 40 - 78 - val;

    // q-tabs are 37px
    tabHeight.value = val - 37;
  }

  const { data } = useDashWSConnection();

  // watch for data ws data
  watch(data, (newValue) => {
    if (newValue.action === "dashboard.agentcount") {
      const incomingData = newValue.data as WSAgentCount;

      serverCount.value = incomingData.total_server_count;
      serverOfflineCount.value = incomingData.total_server_offline_count;
      workstationCount.value = incomingData.total_workstation_count;
      workstationOfflineCount.value = incomingData.total_workstation_offline_count;
      daysUntilCertExpires.value = incomingData.days_until_cert_expires;
    }
  });

  async function getDashInfo() {
    const { data } = await axios.get<DashboardSettings>("/core/dashinfo/");
    Object.assign(dashboardSettings, data);
  }

  function formatDate(date: string) {
    return formatDateUtil(date, dashboardSettings.dateFormat);
  }

  onMounted(getDashInfo);

  return {
    serverCount,
    serverOfflineCount,
    workstationCount,
    workstationOfflineCount,
    daysUntilCertExpires,

    tableHeight,
    tabHeight,
    setTableHeight,

    dashboardSettings,
    formatDate,
    getDashInfo,
  };
});
