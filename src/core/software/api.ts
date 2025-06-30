import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export interface ChocoSoftware {
  id: number;
  name: string;
}

export const useChocosStore = defineStore(
  "chocos",
  () => {
    const chocos = ref<ChocoSoftware[]>([]);
    const isLoading = ref(false);
    const isError = ref(false);

    async function getChocosSoftware() {
      isLoading.value = true;
      isError.value = false;
      try {
        const { data } = await axios.get<ChocoSoftware[]>(`/software/chocos/`);
        chocos.value = data;
      } catch {
        isError.value = true;
      } finally {
        isLoading.value = false;
      }
    }

    return {
      chocos,
      isLoading,
      isError,
      getChocosSoftware,
    };
  },
  {
    cache: {
      getChocosSoftware: {
        duration: 60 * 60 * 1000,
      },
    },
  },
);
