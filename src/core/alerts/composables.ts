import { computed, onMounted } from "vue";

import { alertTemplateStore } from "src/stores/api";
import type { Option } from "../dashboard/types";

// dropdown options
export function useAlertTemplateDropdown() {
  const { alertTemplates, isLoading } = alertTemplateStore;
  const alertTemplateOptions = computed(() => {
    return alertTemplates.value.map(
      (template) =>
        ({
          type: "option",
          label: template.name,
          value: template.id,
        }) as Option,
    );
  });

  onMounted(alertTemplateStore.getAlertTemplates);

  return {
    alertTemplateOptions,
    isLoading,
  };
}
