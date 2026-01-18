import { computed, onMounted } from "vue";

import { usePolicyStore } from "src/stores/api";
import type { Option } from "../dashboard/types";

const policyStore = usePolicyStore();

// dropdown options
export function usePolicyDropdown() {
  const { policies, isLoading } = policyStore;

  const policyOptions = computed(() => {
    return policies.value.map(
      (policy) =>
        ({
          type: "option",
          label: policy.name,
          value: policy.id,
        }) as Option,
    );
  });

  onMounted(policyStore.getPolicies);

  return {
    policyOptions,
    isLoading,
  };
}
