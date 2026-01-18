import { onMounted, computed } from "vue";
import { useUserStore, useRoleStore } from "src/stores/api";
import type { Option } from "../dashboard/types";

const userStore = useUserStore();
const roleStore = useRoleStore();

export function useUserDropdown() {
  const { users } = userStore;

  const isLoading = computed(() => userStore.isLoading);

  const userOptions = computed(() => {
    return users.value.map(
      (user) =>
        ({
          type: "option",
          label: user.username,
          value: user.id,
        }) as Option,
    );
  });

  const userOptionsFlat = computed(() => {
    return users.value.map((user) => user.username);
  });

  onMounted(userStore.getUsers);

  return {
    isLoading,
    userOptions,
    userOptionsFlat,
  };
}

export function useRoleDropdown() {
  const { isLoading, roles } = roleStore;

  const roleOptions = computed(() => {
    return roles.value.map(
      (role) =>
        ({
          type: "option",
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
