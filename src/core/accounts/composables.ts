import { onMounted, computed } from "vue";
import { useUserStore, useRoleStore } from "./api";

export function useUserDropdown() {
  const userStore = useUserStore();

  const userOptions = computed(() => {
    return userStore.users.map((user) => ({
      label: user.username,
      value: user.id,
    }));
  });

  const userOptionsFlat = computed(() => {
    return userStore.users.map((user) => user.username);
  });

  onMounted(userStore.getUsers);

  return {
    userOptions,
    userOptionsFlat,
  };
}

export function useRoleDropdown() {
  const roleStore = useRoleStore();

  const roleOptions = computed(() => {
    return roleStore.roles.map((role) => ({
      label: role.name,
      value: role.id,
    }));
  });

  onMounted(roleStore.getRoles);

  return {
    roleOptions,
  };
}
