import { computed, onMounted } from "vue";
import { customFieldStore } from "src/stores/api";
import { useURLActionStore } from "./api";
import type { CustomField, URLActionType } from "./types";
import { type SelectableOption, type Option } from "../dashboard/types";

export function useCustomFieldDropdown() {
  const { customFields, isLoading } = customFieldStore;

  const customFieldOptions = computed(() => {
    return _formatCustomFieldOptions(customFields.value);
  });

  onMounted(customFieldStore.getCustomFields);

  return {
    customFieldOptions,
    isLoading,
  };
}

export function _formatCustomFieldOptions(data: CustomField[]): Option[] {
  const categories = ["Client", "Site", "Agent"];
  const options: Option[] = [];

  categories.forEach((cat) => {
    options.push({ type: "header", label: cat, value: `header_${cat}` });

    const matchingFields = data
      .filter((custom_field) => custom_field.model === cat.toLowerCase())
      .map(
        (custom_field) =>
          ({
            type: "option",
            label: custom_field.name,
            value: custom_field.id,
            category: cat,
          }) as SelectableOption,
      );

    const sortedFields = matchingFields.sort((a, b) => a.label.localeCompare(b.label));
    options.push(...sortedFields);
  });

  return options;
}

export interface URLActionOption extends SelectableOption {
  action_type: URLActionType;
}

export function useURLActionDropdown() {
  const actionStore = useURLActionStore();

  const isLoading = computed(() => actionStore.isLoading);

  const urlActionOptions = computed(() => {
    return actionStore.urlActions.map(
      (action) =>
        ({
          type: "option",
          label: action.name,
          value: action.id,
          action_type: action.action_type,
        }) as URLActionOption,
    );
  });

  const webActionOptions = computed(() =>
    urlActionOptions.value.filter((action) => action.action_type === "web"),
  );

  const restActionOptions = computed(() =>
    urlActionOptions.value.filter((action) => action.action_type === "rest"),
  );

  onMounted(actionStore.getURLActions);

  return {
    urlActionOptions,
    webActionOptions,
    restActionOptions,
    isLoading,
  };
}
