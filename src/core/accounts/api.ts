import { ref, computed } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import { notifySuccess } from "src/utils/notify";
import type { User, UserSession, Role } from "./types";

export const useUserStore = defineStore("users", () => {
  const users = ref<User[]>([]);
  const userSessions = ref<UserSession[]>([]);

  const isLoading = ref(false);
  const isError = ref(false);

  const userCount = computed(() => users.value.length);

  function getUsers() {
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

  function addUser(payload: Omit<User, "id">) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post<User>("/accounts/users/", payload)
      .then(({ data: newUser }) => {
        users.value.unshift(newUser);
        notifySuccess("User was added successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateUser(userId: number, payload: Partial<User>) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put<User>(`/accounts/users/${userId}/`, payload)
      .then(({ data: updatedUser }) => {
        const index = users.value.findIndex((user) => user.id === userId);
        if (index !== -1) {
          users.value[index] = updatedUser;
        }
        notifySuccess("User was modified successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateUserPreferences(userId: number, payload: Partial<User>) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put<User>(`/accounts/users/ui/`, payload)
      .then(({ data: updatedUser }) => {
        const index = users.value.findIndex((user) => user.id === userId);
        if (index !== -1) {
          users.value[index] = updatedUser;
        }

        // TODO: Update dashboard store values here
        notifySuccess("User was modified successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function removeUser(userId: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`/accounts/users/${userId}/`)
      .then(() => {
        const index = users.value.findIndex((user) => user.id === userId);
        if (index !== -1) {
          users.value.splice(index, 1);
        }
        notifySuccess("User was deleted successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function resetUserPassword(password: string) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put("/accounts/resetpw/", { password })
      .then(() => {
        notifySuccess("Password was reset successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function adminPasswordReset(id: number, password: string) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put("/accounts/users/reset/", { id, password })
      .then(() => {
        notifySuccess("Password was reset successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function userResetMFA() {
    isLoading.value = true;
    isError.value = false;
    axios
      .put("/accounts/reset2fa/")
      .then(() => {
        notifySuccess("MFA authentication was reset successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function adminResetMFA(user: User) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put("/accounts/users/reset_totp/", user)
      .then(() => {
        notifySuccess(`MFA authentication was reset successfully for ${user.username}`);
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function getSessionsForUser(userId: number) {
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

  function removeAllUserSessions(userId: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`/accounts/users/${userId}/sessions/`)
      .then(() => {
        if (userSessions.value.length > 0 && userSessions.value[0]?.user === userId) {
          userSessions.value = [];
        }
        notifySuccess("All user sessions have been deleted");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function removeSession(sessionId: string) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`/accounts/sessions/${sessionId}/`)
      .then(() => {
        const index = userSessions.value.findIndex((session) => session.digest === sessionId);
        if (index !== -1) {
          userSessions.value.splice(index, 1);
        }
        notifySuccess("Session was deleted successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
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
});

export const useRoleStore = defineStore("roles", () => {
  const roles = ref<Role[]>([]);
  const isLoading = ref(false);
  const isError = ref(false);

  function getRoles() {
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

  function addRole(role: Omit<Role, "id">) {
    isLoading.value = true;
    isError.value = false;
    axios
      .post<Role>("/accounts/roles/", role)
      .then(({ data: newRole }) => {
        roles.value.push(newRole);
        notifySuccess("Role was added successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function updateRole(id: number, role: Role) {
    isLoading.value = true;
    isError.value = false;
    axios
      .put<Role>(`/accounts/roles/${role.id}/`, role)
      .then(({ data: updatedRole }) => {
        const index = roles.value.findIndex((r) => r.id === role.id);
        if (index !== -1) {
          roles.value[index] = updatedRole;
        }
        notifySuccess("Role was modified successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  function removeRole(id: number) {
    isLoading.value = true;
    isError.value = false;
    axios
      .delete(`/accounts/roles/${id}/`)
      .then(() => {
        roles.value = roles.value.filter((role) => role.id !== id);
        notifySuccess("Role was deleted successfully");
      })
      .catch(() => {
        isError.value = true;
      })
      .finally(() => {
        isLoading.value = false;
      });
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
});
