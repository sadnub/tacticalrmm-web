<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-grey-9 text-white">
      <q-banner
        v-if="dashboardStore.reloadNeeded"
        inline-actions
        class="bg-red text-white text-center"
      >
        You are viewing an outdated version of this page.
        <q-btn color="dark" icon="refresh" label="Refresh" @click="dashboardStore.reload" />
      </q-banner>
      <q-banner
        v-if="!hosted && tokenExpired"
        inline-actions
        class="bg-yellow text-black text-center"
      >
        <q-icon size="xl" name="warning" />
        <span
          ><br />Your license is currently inactive, usually due to a payment issue.<br /><br />To
          restore access, please update your payment method.<br /><br />
          If you’ve intentionally cancelled your sponsorship, you can remove your license key to
          stop seeing this message.<br /><br />
          If you need help, please contact our support team at
          <a
            href="https://support.amidaware.com"
            target="_blank"
            rel="noopener"
            class="text-primary"
            >https://support.amidaware.com</a
          ><br /><br
        /></span>
        <q-btn color="dark" icon="refresh" label="Refresh" @click="dashboardStore.reload" />
      </q-banner>
      <q-toolbar>
        <q-btn
          v-if="$route.name === 'Dashboard'"
          dense
          flat
          icon="refresh"
          @click="dashboardStore.refreshDashboard()"
        />
        <q-btn v-else dense flat icon="dashboard" @click="$router.push({ name: 'Dashboard' })">
          <q-tooltip>Back to Dashboard</q-tooltip>
        </q-btn>
        <q-toolbar-title>
          Tactical RMM<span class="text-overline q-ml-sm">v{{ currentTRMMVersion }}</span>
          <!-- update check -->
          <q-chip
            v-if="dashboardStore.updateAvailable"
            class="text-overline q-ml-sm"
            :color="dashWarningColor"
            icon="update"
            dense
            ><a :href="latestReleaseURL" target="_blank"
              >v{{ latestTRMMVersion }} available</a
            ></q-chip
          >
          <!-- cert expiring soon check -->
          <q-chip
            v-if="daysUntilCertExpires <= 15"
            dense
            :color="dashNegativeColor"
            text-color="black"
            icon="warning"
            >SSL certificate expires in {{ daysUntilCertExpires }} days</q-chip
          >
        </q-toolbar-title>
        <!-- temp dark mode toggle -->
        <q-toggle
          v-model="dashboardStore.dashboardSettings.darkMode"
          class="q-mr-sm"
          checked-icon="nights_stay"
          unchecked-icon="wb_sunny"
        />
        <!-- web terminal button -->
        <q-btn
          v-if="!hosted"
          label=">_"
          dense
          flat
          class="q-mr-sm"
          style="font-size: 16px"
          @click="openWebTerm"
        />
        <!-- Devices Chip -->
        <q-chip class="cursor-pointer">
          <q-avatar size="md" icon="devices" color="primary" />
          <q-tooltip :delay="600" anchor="top middle" self="top middle">Agent Count</q-tooltip>
          {{ serverCount + workstationCount }}
          <q-menu>
            <q-list dense>
              <q-item-label header>Servers</q-item-label>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="dns" size="sm" color="primary" />
                </q-item-section>

                <q-item-section no-wrap>
                  <q-item-label>Total: {{ serverCount }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="power_off" size="sm" :color="dashNegativeColor" />
                </q-item-section>

                <q-item-section no-wrap>
                  <q-item-label>Offline: {{ serverOfflineCount }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item-label header>Workstations</q-item-label>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="computer" size="sm" color="primary" />
                </q-item-section>

                <q-item-section no-wrap>
                  <q-item-label>Total: {{ workstationCount }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="power_off" size="sm" :color="dashNegativeColor" />
                </q-item-section>

                <q-item-section no-wrap>
                  <q-item-label>Offline: {{ workstationOfflineCount }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-chip>

        <AlertsIcon />

        <q-btn-dropdown flat no-caps stretch :label="displayName || ''">
          <q-list>
            <q-item v-ripple v-close-popup clickable @click="showUserPreferences">
              <q-item-section>
                <q-item-label>Preferences</q-item-label>
              </q-item-section>
            </q-item>
            <q-item clickable>
              <q-item-section>Account</q-item-section>
              <q-item-section side>
                <q-icon name="keyboard_arrow_right" />
              </q-item-section>

              <q-menu anchor="top end" self="top start">
                <q-list>
                  <q-item v-ripple v-close-popup clickable @click="resetPassword">
                    <q-item-section>
                      <q-item-label>Reset Password</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item v-ripple v-close-popup clickable @click="reset2FA">
                    <q-item-section>
                      <q-item-label>Reset 2FA</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-item>
            <q-item to="/expired" exact>
              <q-item-section>
                <q-item-label>Logout</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
<script setup lang="ts">
// composition imports
import { computed } from "vue";
import { useQuasar } from "quasar";
import { useIntervalFn } from "@vueuse/shared";
import { useDashboardStore } from "src/stores/dashboard";
import { useAuthStore } from "src/stores/auth";
import { useUserStore } from "src/core/accounts/api";
import { storeToRefs } from "pinia";
import { notifyError } from "src/utils/notify";

// webtermn
import { checkWebTermPerms, openWebTerminal } from "src/core/settings/api";

// ui imports
import AlertsIcon from "src/core/alerts/components/AlertsIcon.vue";
import UserPreferences from "src/core/accounts/components/UserPreferences.vue";
import ResetPass from "src/core/accounts/components/ResetPass.vue";

const $q = useQuasar();

// setup stores
const dashboardStore = useDashboardStore();
const userStore = useUserStore();

const {
  serverCount,
  serverOfflineCount,
  workstationCount,
  workstationOfflineCount,
  daysUntilCertExpires,
} = storeToRefs(dashboardStore);

const { displayName } = storeToRefs(useAuthStore());

const currentTRMMVersion = computed(() => dashboardStore.dashboardSettings.currentTRMMVersion);
const latestTRMMVersion = computed(() => dashboardStore.dashboardSettings.latestTRMMVersion);
const hosted = computed(() => dashboardStore.dashboardSettings.hosted);
const tokenExpired = computed(() => dashboardStore.dashboardSettings.tokenExpired);
const dashWarningColor = computed(() => dashboardStore.dashboardSettings.dashWarningColor);
const dashNegativeColor = computed(() => dashboardStore.dashboardSettings.dashNegativeColor);

const latestReleaseURL = computed(() => {
  return latestTRMMVersion.value
    ? `https://github.com/amidaware/tacticalrmm/releases/tag/v${latestTRMMVersion.value}`
    : "";
});

function showUserPreferences() {
  $q.dialog({
    component: UserPreferences,
  });
}

function resetPassword() {
  $q.dialog({
    component: ResetPass,
  });
}

function reset2FA() {
  $q.dialog({
    title: "Reset 2FA",
    message: "Are you sure you would like to reset your 2FA token?",
    cancel: true,
    persistent: true,
  }).onOk(() => userStore.userResetMFA());
}

async function openWebTerm() {
  try {
    const { message, status } = await checkWebTermPerms();
    if (status === 412) {
      notifyError(message);
    } else {
      openWebTerminal();
    }
  } catch (e) {
    console.error(e);
  }
}

useIntervalFn(
  () => {
    dashboardStore.checkRmmVersion();
    void dashboardStore.getDashInfo();
  },
  60 * 4 * 1000,
  { immediate: true },
);
</script>
