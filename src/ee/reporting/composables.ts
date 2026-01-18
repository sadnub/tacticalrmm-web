/*
Copyright (c) 2023-present Amidaware Inc.
This file is subject to the EE License Agreement.
For details, see: https://license.tacticalrmm.com/ee
*/

import { computed, onMounted } from "vue";
import { useSharedReportTemplates } from "./api/reporting";

export function useReportTemplateDropdown() {
  const { reportTemplates, getReportTemplates } = useSharedReportTemplates;

  const reportTemplateOptions = computed(() =>
    reportTemplates.value.map((template) => ({
      label: template.name,
      value: template.id,
    })),
  );

  onMounted(getReportTemplates);

  return {
    reportTemplateOptions,
  };
}
