import { ref } from "vue";
import axios from "axios";
import type {
  AlertTemplate,
  Alert,
  AlertSearchParams,
  AlertSearchResponse,
  BulkActionRequest,
  AlertActionRequest,
  AlertTemplateRelated,
  TopAlertsResponse,
} from "./types";
import { notifySuccess } from "src/utils/notify";
import { useCachedAction } from "../dashboard/composables";

// Lazy singletons
let alertTemplateStoreInstance: ReturnType<typeof createAlertTemplateStore> | null = null;
let alertsStoreInstance: ReturnType<typeof createAlertsStore> | null = null;

export function useAlertTemplateStore() {
  if (!alertTemplateStoreInstance) {
    alertTemplateStoreInstance = createAlertTemplateStore();
  }
  return alertTemplateStoreInstance;
}

export function useAlertsStore() {
  if (!alertsStoreInstance) {
    alertsStoreInstance = createAlertsStore();
  }
  return alertsStoreInstance;
}

function createAlertTemplateStore() {
  const alertTemplates = ref<AlertTemplate[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function _getAlertTemplates() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<AlertTemplate[]>("/alerts/templates/")
      .then(({ data }) => {
        alertTemplates.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getAlertTemplates = useCachedAction(_getAlertTemplates, {
    key: "getAlertTemplates",
    duration: 1 * 30 * 1000, // 30 seconds cache
  });

  async function addAlertTemplate(payload: AlertTemplate) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.post<AlertTemplate>("alerts/templates/", payload);
      alertTemplates.value.unshift(data);
      notifySuccess("Alert template was created successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateAlertTemplate(id: number, payload: AlertTemplate) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.put<AlertTemplate>(`alerts/templates/${id}/`, payload);
      const index = alertTemplates.value.findIndex((a) => a.id === id);
      if (index !== -1) alertTemplates.value[index] = data;
      notifySuccess("Alert template was updated successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeAlertTemplate(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      await axios.delete(`alerts/templates/${id}/`);
      const index = alertTemplates.value.findIndex((a) => a.id === id);
      if (index !== -1) alertTemplates.value.splice(index, 1);
      notifySuccess("Alert template was removed successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function getAlertTemplateRelated(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.get<AlertTemplateRelated>(`/alerts/templates/${id}/related/`);
      return data;
    } catch {
      isError.value = true;
      return {
        policies: [],
        clients: [],
        sites: [],
      };
    } finally {
      isLoading.value = false;
    }
  }

  return {
    alertTemplates,
    isLoading,
    isError,
    getAlertTemplates,
    addAlertTemplate,
    updateAlertTemplate,
    removeAlertTemplate,
    getAlertTemplateRelated,
  };
}

function createAlertsStore() {
  const alerts = ref<Alert[]>([]);
  const selected = ref<Alert[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);
  const alertsCount = ref(0);
  const rowsNumber = ref(0);
  const lastSearchParams = ref<AlertSearchParams>({});

  // Tray alerts for the notification icon (separate from main alerts list)
  const trayAlerts = ref<Alert[]>([]);
  const trayAlertsCount = ref(0);

  function searchAlerts(params: AlertSearchParams) {
    isLoading.value = true;
    isError.value = false;
    // Save the search parameters for later use
    lastSearchParams.value = { ...params };
    axios
      .patch<AlertSearchResponse>("/alerts/v2/", params)
      .then(({ data: { alerts: alertsData, total } }) => {
        alerts.value = alertsData;
        rowsNumber.value = total;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function refreshSearch() {
    searchAlerts(lastSearchParams.value);
  }

  function getTrayAlerts() {
    axios
      .patch<TopAlertsResponse>("/alerts/", { top: 10 })
      .then(({ data }) => {
        trayAlerts.value = data.alerts;
        trayAlertsCount.value = data.alerts_count;
      })
      .catch(() => {
        //
      });
  }

  async function snoozeAlert(id: number, days: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      const payload: AlertActionRequest = { id, type: "snooze", snooze_days: days };
      await axios.put(`/alerts/${id}/`, payload);
      // Update local alerts array
      const alertIndex = alerts.value.findIndex((alert) => alert.id === id);
      if (alertIndex !== -1) {
        const alert = alerts.value[alertIndex];
        if (alert) {
          alert.snoozed = true;
          alert.snoozed_until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        }
      }
      notifySuccess("Alert snoozed successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function unsnoozeAlert(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      const payload: AlertActionRequest = { id, type: "unsnooze" };
      await axios.put(`/alerts/${id}/`, payload);
      // Update local alerts array
      const alertIndex = alerts.value.findIndex((alert) => alert.id === id);
      if (alertIndex !== -1) {
        const alert = alerts.value[alertIndex];
        if (alert) {
          alert.snoozed = false;
          alert.snoozed_until = null;
        }
      }
      notifySuccess("Alert unsnoozed successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function resolveAlert(id: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      const payload: AlertActionRequest = { id, type: "resolve" };
      await axios.put(`/alerts/${id}/`, payload);
      // Update local alerts array
      const alertIndex = alerts.value.findIndex((alert) => alert.id === id);
      if (alertIndex !== -1) {
        const alert = alerts.value[alertIndex];
        if (alert) {
          alert.resolved = true;
          alert.resolved_on = new Date().toISOString();
        }
      }
      notifySuccess("Alert resolved successfully.");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function bulkResolveAlerts(ids: number[]) {
    isLoading.value = true;
    isError.value = false;
    try {
      const payload: BulkActionRequest = { alerts: ids, bulk_action: "resolve" };
      await axios.post("/alerts/bulk/", payload);
      // Update local alerts array for all resolved alerts
      const resolvedTime = new Date().toISOString();
      ids.forEach((id) => {
        const alertIndex = alerts.value.findIndex((alert) => alert.id === id);
        if (alertIndex !== -1) {
          const alert = alerts.value[alertIndex];
          if (alert) {
            alert.resolved = true;
            alert.resolved_on = resolvedTime;
          }
        }
      });
      notifySuccess(`${ids.length} alerts resolved successfully.`);
      // Refresh search to update the view
      refreshSearch();
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function bulkSnoozeAlerts(ids: number[], days: number) {
    isLoading.value = true;
    isError.value = false;
    try {
      const payload: BulkActionRequest = { alerts: ids, bulk_action: "snooze", snooze_days: days };
      await axios.post("/alerts/bulk/", payload);
      // Update local alerts array for all snoozed alerts
      const snoozedUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      ids.forEach((id) => {
        const alertIndex = alerts.value.findIndex((alert) => alert.id === id);
        if (alertIndex !== -1) {
          const alert = alerts.value[alertIndex];
          if (alert) {
            alert.snoozed = true;
            alert.snoozed_until = snoozedUntil;
          }
        }
      });
      notifySuccess(`${ids.length} alerts snoozed successfully.`);
      // Refresh search to update the view
      refreshSearch();
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    alerts,
    selected,
    alertsCount,
    rowsNumber,
    isLoading,
    isError,
    trayAlerts,
    trayAlertsCount,
    searchAlerts,
    refreshSearch,
    getTrayAlerts,
    snoozeAlert,
    unsnoozeAlert,
    resolveAlert,
    bulkResolveAlerts,
    bulkSnoozeAlerts,
  };
}
