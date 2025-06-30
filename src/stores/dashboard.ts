import { defineStore } from "pinia";
import { ref, reactive, watch, onMounted, computed } from "vue";
import axios from "axios";
import { useLocalStorage } from "@vueuse/core";
import { formatDate as formatDateUtil } from "src/utils/format";
import { Dark, LoadingBar, Screen } from "quasar";
import { useDashWSConnection } from "src/websocket/websocket";
import { useAgentStore } from "src/core/agents/api";
import { useClientStore } from "src/core/clients/api";

import type { AgentDblClickAction, ClientTreeSort, AgentTableTab } from "src/core/accounts/types";

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
  clientTreeSplitter: number;
  dashPositiveColor: string;
  dashNegativeColor: string;
  dashWarningColor: string;
  dashInfoColor: string;
  darkMode: boolean;
  loadingBarColor: string;
  dateFormat: string;
}

export const useDashboardStore = defineStore(
  "dashboard",
  () => {
    // updated by dashboard.agentcount event
    const serverCount = ref(0);
    const serverOfflineCount = ref(0);
    const workstationCount = ref(0);
    const workstationOfflineCount = ref(0);
    const daysUntilCertExpires = ref(180);
    const rmmVersion = useLocalStorage<string | null>("rmmVersion", null);

    const agentStore = useAgentStore();
    const clientStore = useClientStore();

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
      clientTreeSplitter: 20,
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
      tableHeight.value = Screen.height - 50 - 40 - 90 - val;

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

    const selectedClientSiteNode = ref<string | null>(null);

    watch(
      () => dashboardSettings.darkMode,
      (newValue) => {
        Dark.set(newValue);
      },
    );

    watch(
      () => dashboardSettings.loadingBarColor,
      (newValue) => {
        LoadingBar.setDefaults({ color: newValue });
      },
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async function getDashInfo(_args?: { force: boolean }) {
      const { data } = await axios.get("/core/dashinfo/");
      dashboardSettings.currentTRMMVersion = data.trmm_version;
      dashboardSettings.latestTRMMVersion = data.latest_trmm_ver;
      dashboardSettings.agentUrlAction = data.url_action;
      dashboardSettings.agentDblClickAction = data.dbl_click_action;
      dashboardSettings.showCommunityScripts = data.show_community_scripts;
      dashboardSettings.hosted = data.hosted;
      dashboardSettings.tokenExpired = data.token_is_expired;
      dashboardSettings.openAIIntegrationStatus = data.open_ai_integration_enabled;
      dashboardSettings.runCmdPlaceholderText = data.run_cmd_placeholder_text;
      dashboardSettings.serverScriptsEnabled = data.server_scripts_enabled;
      dashboardSettings.webTerminalEnabled = data.web_terminal_enabled;
      dashboardSettings.blockLocalUserLogon = data.block_local_user_logon;
      dashboardSettings.clearSearchWhenSwitching = data.clear_search_when_switching;
      dashboardSettings.defaultAgentTblTab = data.default_agent_tbl_tab;
      dashboardSettings.clientTreeSort = data.client_tree_sort;
      dashboardSettings.clientTreeSplitter = data.client_tree_splitter;
      dashboardSettings.dashPositiveColor = data.dash_positive_color;
      dashboardSettings.dashNegativeColor = data.dash_negative_color;
      dashboardSettings.dashWarningColor = data.dash_warning_color;
      dashboardSettings.dashInfoColor = data.dash_info_color;
      dashboardSettings.loadingBarColor = data.loading_bar_color;
      dashboardSettings.darkMode = data.dark_mode;

      if (data.date_format) dashboardSettings.dateFormat = data.date_format;
    }

    function formatDate(date: string) {
      return formatDateUtil(date, dashboardSettings.dateFormat);
    }

    const updateAvailable = computed(() => {
      if (
        dashboardSettings.latestTRMMVersion === "error" ||
        dashboardSettings.hosted ||
        dashboardSettings.currentTRMMVersion?.includes("-dev")
      )
        return false;
      return dashboardSettings.currentTRMMVersion !== dashboardSettings.latestTRMMVersion;
    });

    function reload() {
      rmmVersion.value = null;
      location.reload();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function refreshDashboard(_args?: { force: boolean }) {
      clientStore.getClients({ force: true });
      agentStore.getAgents({ force: true });
    }

    const reloadNeeded = ref(false);

    function checkRmmVersion() {
      axios
        .get("/core/version/")
        .then(({ data }) => {
          const version = data;

          if (rmmVersion.value) {
            if (rmmVersion.value === version) {
              return;
            } else {
              rmmVersion.value = "0.0.1";
              reloadNeeded.value = true;
            }
          } else {
            rmmVersion.value = version;
            return;
          }
        })
        .catch(() => {});
    }

    onMounted(getDashInfo);

    return {
      serverCount,
      serverOfflineCount,
      workstationCount,
      workstationOfflineCount,
      daysUntilCertExpires,
      updateAvailable,
      reload,
      reloadNeeded,
      checkRmmVersion,
      refreshDashboard,

      tableHeight,
      tabHeight,
      setTableHeight,
      selectedClientSiteNode,

      dashboardSettings,
      formatDate,
      getDashInfo,
    };
  },
  {
    cache: {
      getDashInfo: {
        duration: 1 * 60 * 1000,
      },
    },
  },
);
