import { ref } from "vue";
import axios from "axios";
import type { AlertTemplate, Alert, AlertSearchParams } from "./types";
import { notifySuccess } from "src/utils/notify";
import { useCachedAction } from "../dashboard/composables";

// Type definitions for API responses
type AlertTemplateResponse = AlertTemplate;
type AlertResponse = Alert;
interface BulkActionRequest {
  alerts: number[];
  bulk_action: "resolve" | "snooze";
  snooze_days?: number;
}
interface AlertActionRequest {
  id: number;
  type: "snooze" | "unsnooze" | "resolve";
  snooze_days?: number;
}
interface AlertTemplateRelated {
  policies: Array<{ id: number; name: string }>;
  clients: Array<{ id: number; name: string }>;
  sites: Array<{ id: number; name: string }>;
}

// Alert Templates store (plain composable, mirrors checks api style)
export function useAlertTemplateStore() {
  const alertTemplates = ref<AlertTemplate[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getAlertTemplates() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<AlertTemplateResponse[]>("/alerts/templates/")
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

  async function addAlertTemplate(payload: AlertTemplate) {
    isLoading.value = true;
    isError.value = false;
    try {
      const { data } = await axios.post<AlertTemplateResponse>("alerts/templates/", payload);
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
      const { data } = await axios.put<AlertTemplateResponse>(`alerts/templates/${id}/`, payload);
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

// Alerts store (plain composable, mirrors checks api style)
export function useAlertsStore() {
  const alerts = ref<Alert[]>([]);
  const selected = ref<Alert[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);
  const alertsCount = ref(0);

  async function getTopAlerts(limit = 10) {
    searchAlerts({});

    // Small delay to allow cached action to potentially complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    const topAlerts = alerts.value.slice(0, limit);
    alertsCount.value = alerts.value.length;
    return {
      alerts_count: alerts.value.length,
      alerts: topAlerts,
    };
  }

  function _searchAlerts(params: AlertSearchParams) {
    isLoading.value = true;
    isError.value = false;
    axios
      .patch<AlertResponse[]>("/alerts/", params)
      .then(({ data }) => {
        alerts.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const searchAlerts = useCachedAction(_searchAlerts, {
    key: "searchAlerts",
    duration: 1 * 30 * 1000, // 30 seconds cache
  });

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
    isLoading,
    isError,
    getTopAlerts,
    searchAlerts,
    snoozeAlert,
    unsnoozeAlert,
    resolveAlert,
    bulkResolveAlerts,
    bulkSnoozeAlerts,
  };
}
