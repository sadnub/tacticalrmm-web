import { ref } from "vue";
import axios from "axios";
import { useCachedAction } from "../dashboard/composables";

export interface ChocoSoftware {
  id: number;
  name: string;
}

// Lazy singleton
let chocosStoreInstance: ReturnType<typeof createChocosStore> | null = null;

export function useChocosStore() {
  if (!chocosStoreInstance) {
    chocosStoreInstance = createChocosStore();
  }
  return chocosStoreInstance;
}

function createChocosStore() {
  const chocos = ref<readonly ChocoSoftware[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function _getChocosSoftware() {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<ChocoSoftware[]>(`/software/chocos/`)
      .then(({ data }) => {
        chocos.value = Object.freeze(data);
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getChocosSoftware = useCachedAction(_getChocosSoftware, {
    key: "getChocosSoftware",
    duration: 60 * 60 * 1000, // 1 hour cache
  });

  return {
    chocos,
    isLoading,
    isError,
    getChocosSoftware,
  };
}
