import { ref, computed } from "vue";
import axios from "axios";
import { notifySuccess } from "src/utils/notify";
import { useDashboardStore } from "src/stores/dashboard";
import { useCachedAction } from "../dashboard/composables";

import type { User, UserSession, Role } from "./types";

export function useUserStore() {
  const users = ref<User[]>([]);
  const userSessions = ref<UserSession[]>([]);

  const isLoading = ref(false);
  const isError = ref(false);

  const userCount = computed(() => users.value.length);

  const dashStore = useDashboardStore();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _getUsers(_args?: { force: boolean }) {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<User[]>("/accounts/users/")
      .then(({ data }) => {
        users.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getUsers = useCachedAction(_getUsers, { key: "getUsers", duration: 1 * 30 * 1000 });

  async function addUser(payload: Omit<User, "id">) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<User>("/accounts/users/", payload);
      users.value.unshift(data);
      notifySuccess("User was added successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateUser(userId: number, payload: Partial<User>) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<User>(`/accounts/${userId}/users/`, payload);
      const index = users.value.findIndex((user) => user.id === userId);
      if (index !== -1) {
        users.value[index] = data;
      }
      notifySuccess("User was modified successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateUserPreferences(payload: Partial<User>) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<User>(`/accounts/users/ui/`, payload);
      const index = users.value.findIndex((user) => user.id === data.id);
      if (index !== -1) {
        users.value[index] = data;
      }
      void dashStore.getDashInfo({ force: true });
      dashStore.refreshDashboard();
      notifySuccess("User was modified successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeUser(userId: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/accounts/${userId}/users/`);
      const index = users.value.findIndex((user) => user.id === userId);
      if (index !== -1) {
        users.value.splice(index, 1);
      }
      notifySuccess("User was deleted successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function resetUserPassword(password: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.put("/accounts/resetpw/", { password });
      notifySuccess("Password was reset successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function adminPasswordReset(id: number, password: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.put("/accounts/users/reset/", { id, password });
      notifySuccess("Password was reset successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function userResetMFA() {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.put("/accounts/reset2fa/");
      notifySuccess("MFA authentication was reset successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function adminResetMFA(user: User) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.put("/accounts/users/reset2fa/", user);
      notifySuccess(`MFA authentication was reset successfully for ${user.username}`);
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  function _getSessionsForUser(userId: number) {
    isLoading.value = true;
    isError.value = false;
    userSessions.value = [];
    axios
      .get<UserSession[]>(`/accounts/users/${userId}/sessions/`)
      .then(({ data }) => {
        userSessions.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getSessionsForUser = useCachedAction(_getSessionsForUser, {
    key: "getSessionsForUser",
    duration: 1 * 30 * 1000,
  });

  async function removeAllUserSessions(userId: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/accounts/users/${userId}/sessions/`);
      userSessions.value = [];
      notifySuccess("All user sessions have been deleted");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeSession(sessionId: string) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/accounts/sessions/${sessionId}/`);
      const index = userSessions.value.findIndex((session) => session.digest === sessionId);
      if (index !== -1) {
        userSessions.value.splice(index, 1);
      }
      notifySuccess("Session was deleted successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    users,
    userSessions,
    isLoading,
    isError,
    userCount,
    getUsers,
    addUser,
    updateUser,
    updateUserPreferences,
    removeUser,
    resetUserPassword,
    userResetMFA,
    adminResetMFA,
    adminPasswordReset,
    getSessionsForUser,
    removeAllUserSessions,
    removeSession,
  };
}

export function useRoleStore() {
  const roles = ref<Role[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function _getRoles(_args?: { force: boolean }) {
    isLoading.value = true;
    isError.value = false;
    axios
      .get<Role[]>("/accounts/roles/")
      .then(({ data }) => {
        roles.value = data;
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  const getRoles = useCachedAction(_getRoles, { key: "getRoles", duration: 1 * 30 * 1000 });

  async function addRole(role: Omit<Role, "id">) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.post<Role>("/accounts/roles/", role);
      roles.value.push(data);
      notifySuccess("Role was added successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateRole(id: number, role: Role) {
    isLoading.value = true;
    isError.value = false;

    try {
      const { data } = await axios.put<Role>(`/accounts/roles/${id}/`, role);
      const index = roles.value.findIndex((r) => r.id === role.id);
      if (index !== -1) {
        roles.value[index] = data;
      }
      notifySuccess("Role was modified successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeRole(id: number) {
    isLoading.value = true;
    isError.value = false;

    try {
      await axios.delete(`/accounts/roles/${id}/`);

      roles.value = roles.value.filter((role) => role.id !== id);
      notifySuccess("Role was deleted successfully");
    } catch {
      isError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    roles,
    isLoading,
    isError,
    getRoles,
    addRole,
    updateRole,
    removeRole,
  };
}
