import { computed, onMounted } from "vue";

import { useAlertTemplateStore } from "./api";
import type { Option } from "../dashboard/types";

// dropdown options
export function useAlertTemplateDropdown() {
  const templateStore = useAlertTemplateStore();

  const alertTemplateOptions = computed(() => {
    return templateStore.alertTemplates.map(
      (template) =>
        ({
          type: "option",
          label: template.name,
          value: template.id,
        }) as Option,
    );
  });

  onMounted(templateStore.getAlertTemplates);

  return {
    alertTemplateOptions,
    isLoading: computed(() => templateStore.isLoading),
  };
}
