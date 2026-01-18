import type { Ref } from "vue";
import { ref, reactive, watch, computed } from "vue";
import axios from "axios";
import { useLocalStorage, useStorage } from "@vueuse/core";
import { formatDate as formatDateUtil } from "src/utils/format";
import { Dark, LoadingBar, Screen } from "quasar";
import { useDashWSConnection } from "src/websocket/websocket";
import { useAgentStore } from "src/core/agents/api";
import { useClientStore } from "src/core/clients/api";
import { useCachedAction } from "src/core/dashboard/composables";

import type { AgentDblClickAction, ClientTreeSort, AgentTableTab } from "src/core/accounts/types";

// ============================================================================
// Dashboard Store
// ============================================================================

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
  clientTreeSplitter: Ref<number>;
  dashPositiveColor: string;
  dashNegativeColor: string;
  dashWarningColor: string;
  dashInfoColor: string;
  darkMode: Ref<boolean>;
  loadingBarColor: string;
  dateFormat: string;
  timezoneOptions: string[];
}

// Lazy singleton
let dashboardStoreInstance: ReturnType<typeof createDashboardStore> | null = null;

export function useDashboardStore() {
  if (!dashboardStoreInstance) {
    dashboardStoreInstance = createDashboardStore();
  }
  return dashboardStoreInstance;
}

function createDashboardStore() {
  // State - Agent Counts (updated via websocket)
  const serverCount = ref(0);
  const serverOfflineCount = ref(0);
  const workstationCount = ref(0);
  const workstationOfflineCount = ref(0);
  const daysUntilCertExpires = ref(180);

  // State - Dashboard Settings
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
    clientTreeSplitter: useStorage("clientTreeSplitter", 20),
    dashPositiveColor: "positive",
    dashNegativeColor: "negative",
    dashWarningColor: "warning",
    dashInfoColor: "info",
    loadingBarColor: "",
    darkMode: useStorage("darkMode", false),
    dateFormat: "MMM-DD-YYYY - HH:mm",
    timezoneOptions: [],
  });

  // State - UI Layout
  const tabHeight = ref(300);
  const tableHeight = ref(300);
  const selectedClientSiteNode = ref<string | null>(null);

  // State - Version Management
  const rmmVersion = useLocalStorage<string | undefined>("rmmVersion", undefined);
  const reloadNeeded = ref(false);

  const updateAvailable = computed(() => {
    if (
      dashboardSettings.latestTRMMVersion === "error" ||
      dashboardSettings.hosted ||
      dashboardSettings.currentTRMMVersion?.includes("-dev")
    )
      return false;
    return dashboardSettings.currentTRMMVersion !== dashboardSettings.latestTRMMVersion;
  });

  // Websocket - Dashboard Agent Count Updates
  const { data } = useDashWSConnection();

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

  // Watchers - UI Settings Sync
  // Sync loading bar color with Quasar
  watch(
    () => dashboardSettings.loadingBarColor,
    (newValue) => {
      LoadingBar.setDefaults({ color: newValue });
    },
  );

  // Sync dark mode with Quasar and persist to server
  watch(
    () => dashboardSettings.darkMode,
    (newValue) => {
      Dark.set(newValue);
      setDarkMode(newValue);
    },
  );

  // Initialize dark mode from local storage
  Dark.set(dashboardSettings.darkMode);

  // API Actions - Fetch Dashboard Info
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function _getDashInfo(_args?: { force: boolean }) {
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
    dashboardSettings.timezoneOptions = data.timezone_options;

    if (data.date_format) dashboardSettings.dateFormat = data.date_format;
  }

  const getDashInfo = useCachedAction(_getDashInfo, { key: "getDashInfo", duration: 1 * 60 * 1000 });

  function refreshDashboard() {
    const clientStore = useClientStore();
    const agentStore = useAgentStore();
    clientStore.getClients({ force: true });
    agentStore.getAgents({ force: true });
  }

  // API Actions - Version Management
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

  function reload() {
    rmmVersion.value = null;
    location.reload();
  }

  // API Actions - User Preferences
  function setShowCommunityScripts(show: boolean) {
    axios
      .patch("/accounts/users/ui/", { show_community_scripts: show })
      .then(() => {
        dashboardSettings.showCommunityScripts = show;
      })
      .catch(() => {});
  }

  function setDarkMode(value: boolean) {
    axios
      .patch("/accounts/users/ui/", { dark_mode: value })
      .then(() => {})
      .catch(() => {});
  }

  function setClientTreeSplitter(value: number) {
    dashboardSettings.clientTreeSplitter = value;
    axios
      .patch("/accounts/users/ui/", { client_tree_splitter: value })
      .then(() => {})
      .catch(() => {});
  }

  // Utilities
  function setTableHeight(val: number) {
    // top toolbar is 50px, filebar is 40px, agent filter tabs are 44px
    tableHeight.value = Math.floor(Screen.height - 50 - 40 - 90 - val);

    // q-tabs are 37px
    tabHeight.value = Math.floor(val - 37);
  }

  function formatDate(date: string) {
    return formatDateUtil(date, dashboardSettings.dateFormat);
  }

  return {
    // State - Agent Counts
    serverCount,
    serverOfflineCount,
    workstationCount,
    workstationOfflineCount,
    daysUntilCertExpires,

    // State - Dashboard Settings
    dashboardSettings,

    // State - UI Layout
    tableHeight,
    tabHeight,
    selectedClientSiteNode,

    // State - Version Management
    updateAvailable,
    reloadNeeded,

    // API Actions - Dashboard
    getDashInfo,
    refreshDashboard,

    // API Actions - Version Management
    checkRmmVersion,
    reload,

    // API Actions - User Preferences
    setShowCommunityScripts,
    setDarkMode,
    setClientTreeSplitter,

    // Utilities
    setTableHeight,
    formatDate,
  };
}

// ============================================================================
// Auth Store
// ============================================================================

interface CheckCredentialsRequest {
  username: string;
  password: string;
}

interface LoginRequest {
  username: string;
  password: string;
  twofactor: string;
}

interface CheckCredentialsResponse {
  token: string;
  username: string;
  totp?: boolean;
}

interface TOTPSetupResponse {
  qr_url: string;
  totp_key: string;
}

// Lazy singleton
let authStoreInstance: ReturnType<typeof createAuthStore> | null = null;

export function useAuthStore() {
  if (!authStoreInstance) {
    authStoreInstance = createAuthStore();
  }
  return authStoreInstance;
}

function createAuthStore() {
  // State
  const username = useStorage<string | null>("user_name", null);
  const name = useStorage<string | null>("name", null);
  const token = useStorage<string | null>("access_token", null);
  const ssoLoginProvider = useStorage<string | null>("sso_provider", null);
  const provider_id = useStorage<string | null>("provider_id", null);
  const next = useStorage<string | null>("next", null);

  // Getters
  const loggedIn = computed(() => token.value !== null);
  const displayName = computed(() => (name.value ? name.value : username.value));

  // Actions
  async function checkCredentials(
    credentials: CheckCredentialsRequest,
  ): Promise<CheckCredentialsResponse> {
    const { data } = await axios.post("/v2/checkcreds/", credentials);

    if (!data.totp) {
      token.value = data.token;
      username.value = data.username;
      name.value = data.name;
    }
    return data;
  }

  async function login(credentials: LoginRequest) {
    const { data } = await axios.post("/v2/login/", credentials);
    username.value = data.username;
    name.value = data.name;
    token.value = data.token;
    ssoLoginProvider.value = null;

    return data;
  }

  async function logout() {
    if (token.value !== null) {
      try {
        await axios.post("/logout/");
      } catch {
        /* empty */
      }
    }
    token.value = null;
    username.value = null;
    name.value = null;
    ssoLoginProvider.value = null;
    provider_id.value = null;
  }

  async function setupTotp(): Promise<TOTPSetupResponse | false> {
    const { data } = await axios.post("/accounts/users/setup_totp/");
    return data;
  }

  return {
    // State
    username,
    name,
    token,
    ssoLoginProvider,
    provider_id,
    next,

    // Getters
    loggedIn,
    displayName,

    // Actions
    checkCredentials,
    login,
    logout,
    setupTotp,
  };
}
