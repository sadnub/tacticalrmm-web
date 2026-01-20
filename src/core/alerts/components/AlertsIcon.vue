<template>
  <q-btn dense flat icon="notifications">
    <q-badge v-if="trayAlertsCount > 0" :color="badgeColor" floating transparent>{{
      alertsCountText()
    }}</q-badge>
    <q-menu :style="{ 'max-height': `${$q.screen.height - 100}px` }">
      <q-list separator>
        <q-item v-if="trayAlertsCount === 0">No New Alerts</q-item>
        <q-item v-for="alert in trayAlerts" :key="alert.id">
          <q-item-section>
            <q-item-label overline
              ><router-link :to="`/agents/${alert.agent_id}`"
                >{{ alert.client }} - {{ alert.site }} - {{ alert.hostname }}</router-link
              ></q-item-label
            >
            <q-item-label lines="1">
              <q-icon
                size="xs"
                :class="`text-${alertIconColor(alert.severity)}`"
                :name="alert.severity"
              ></q-icon>
              {{ alert.message }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <q-item-label caption>{{ getTimeLapse(Number(date.formatDate(alert.alert_time, "X"))) }}</q-item-label>
            <q-item-label>
              <q-icon
                v-close-popup
                name="snooze"
                size="xs"
                class="cursor-pointer"
                @click="snoozeAlert(alert)"
              >
                <q-tooltip>Snooze alert</q-tooltip>
              </q-icon>
              <q-icon
                v-close-popup
                name="flag"
                size="xs"
                class="cursor-pointer"
                @click="resolveAlert(alert)"
              >
                <q-tooltip>Resolve alert</q-tooltip>
              </q-icon>
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-close-popup clickable @click="showOverview"
          >View All Alerts ({{ trayAlertsCount }})</q-item
        >
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import { onMounted, computed } from "vue";
import { useQuasar, date } from "quasar";
import { useInterval } from "@vueuse/core";
import AlertsOverview from "src/core/alerts/components/AlertsOverview.vue";
import { getTimeLapse } from "src/utils/format";
import { useAlertsStore, useDashboardStore } from "src/stores/api";

const alertsStore = useAlertsStore();
const dashboardStore = useDashboardStore();
import type { Alert } from "src/core/alerts/types";

const $q = useQuasar();

const { trayAlerts, trayAlertsCount } = alertsStore;

const badgeColor = computed(() => {
  const severities = trayAlerts.value.map((a) => a.severity);
  if (severities.includes("error")) return dashboardStore.dashboardSettings.dashNegativeColor;
  else if (severities.includes("warning")) return dashboardStore.dashboardSettings.dashWarningColor;
  else return dashboardStore.dashboardSettings.dashInfoColor;
});

function getAlerts() {
  void alertsStore.getTrayAlerts();
}

function showOverview() {
  $q.dialog({ component: AlertsOverview });
}

function snoozeAlert(alert: Alert) {
  $q.dialog({
    title: "Snooze Alert",
    message: "How many days to snooze alert?",
    prompt: {
      model: "",
      type: "number",
      isValid: (val: string) => !!val && Number(val) > 0 && Number(val) < 9999,
    },
    cancel: true,
  }).onOk((days: number) => {
    void alertsStore.snoozeAlert(alert.id, days);
  });
}

function resolveAlert(alert: Alert) {
  void alertsStore.resolveAlert(alert.id);
}

function alertIconColor(severity: string) {
  if (severity === "error") return dashboardStore.dashboardSettings.dashNegativeColor;
  else if (severity === "warning") return dashboardStore.dashboardSettings.dashWarningColor;
  else return dashboardStore.dashboardSettings.dashInfoColor;
}

function alertsCountText() {
  if (trayAlertsCount.value > 99) return "99+";
  else return trayAlertsCount.value;
}

useInterval(60 * 1000, {
  callback: () => {
    getAlerts();
  },
});

onMounted(() => {
  getAlerts();
});
</script>
