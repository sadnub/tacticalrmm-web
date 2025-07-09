import { computed, onMounted } from "vue";

import { usePolicyStore } from "./api";
import type { Option } from "../dashboard/types";

// dropdown options
export function usePolicyDropdown() {
  const policyStore = usePolicyStore();

  const policyOptions = computed(() => {
    return policyStore.policies.map(
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
  };
}
