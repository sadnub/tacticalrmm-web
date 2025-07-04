import { onMounted, computed } from "vue";
import { useUserStore, useRoleStore } from "./api";

import type { Option } from "../dashboard/types";

export function useUserDropdown() {
  const userStore = useUserStore();

  const isLoading = computed(() => userStore.isLoading);

  const userOptions = computed(() => {
    return userStore.users.map(
      (user) =>
        ({
          label: user.username,
          value: user.id,
        }) as Option,
    );
  });

  const userOptionsFlat = computed(() => {
    return userStore.users.map((user) => user.username);
  });

  onMounted(userStore.getUsers);

  return {
    isLoading,
    userOptions,
    userOptionsFlat,
  };
}

export function useRoleDropdown() {
  const roleStore = useRoleStore();

  const isLoading = computed(() => roleStore.isLoading);

  const roleOptions = computed(() => {
    return roleStore.roles.map(
      (role) =>
        ({
          label: role.name,
          value: role.id,
        }) as Option,
    );
  });

  onMounted(roleStore.getRoles);

  return {
    roleOptions,
    isLoading,
  };
}
