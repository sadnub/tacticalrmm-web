import { ref } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import type { AlertTemplate } from "./types";
import { notifySuccess } from "src/utils/notify";

export const useAlertTemplateStore = defineStore("alertTemplates", () => {
  const alertTemplates = ref<AlertTemplate[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getAlertTemplates() {
    isLoading.value = true;
    isError.value = true;

    axios
      .get<AlertTemplate[]>("/alerts/templates/")
      .then(({ data }) => {
        alertTemplates.value = data;
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function updateAlertTemplate(id: number, payload: AlertTemplate) {
    axios
      .put(`alerts/templates/${id}/`, payload)
      .then(({ data }) => {
        const index = alertTemplates.value.findIndex((a) => a.id === id);
        if (index !== -1) {
          alertTemplates.value[index] = data;
        }
        notifySuccess("Alert template was updated successfully.");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function addAlertTemplate(payload: AlertTemplate) {
    axios
      .post("alerts/templates/", payload)
      .then(({ data }) => {
        alertTemplates.value.unshift(data);
        notifySuccess("Alert template was created successfully.");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  function removeAlertTemplate(id: number) {
    axios
      .delete(`alerts/templates/${id}/`)
      .then(() => {
        const index = alertTemplates.value.findIndex((a) => a.id === id);
        if (index !== -1) {
          alertTemplates.value.splice(index, 1);
        }
        notifySuccess("Alert template was removed successfully.");
      })
      .catch(() => (isError.value = true))
      .finally(() => (isLoading.value = false));
  }

  return {
    alertTemplates,
    getAlertTemplates,
    updateAlertTemplate,
    addAlertTemplate,
    removeAlertTemplate,
    isLoading,
    isError,
  };
});
