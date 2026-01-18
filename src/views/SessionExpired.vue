<template>
  <div class="fixed-center text-center">
    <p class="text-faded">Your session has expired</p>
    <q-btn color="secondary" style="width: 200px" to="/login">Login</q-btn>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useAuthStore } from "src/stores/api";
import { useDashWSConnection } from "src/websocket/websocket";

// setup store
const { logout } = useAuthStore();

// setup websocket
const { close } = useDashWSConnection();

onMounted(async () => {
  await logout();
  close();
});
</script>
