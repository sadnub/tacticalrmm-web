import { ref, watch } from "vue";
import { type UseWebSocketReturn, useWebSocket } from "@vueuse/core";
import { getBaseUrl } from "src/boot/axios";
import { useAuthStore } from "src/core/dashboard/api";

export function getWSUrl(path: string, token: string | null) {
  const url = getBaseUrl().split("://")[1];

  const proto = process.env.NODE_ENV === "production" || process.env.DOCKER_BUILD ? "wss" : "ws";
  return `${proto}://${url}/ws/${path}/?access_token=${token}`;
}

interface WSReturn {
  action: string;
  data: unknown;
}

let WSConnection: UseWebSocketReturn<string> | undefined = undefined;
export function useDashWSConnection() {
  const { token } = useAuthStore();

  if (WSConnection === undefined) {
    const url = getWSUrl("dashinfo", token.value);
    WSConnection = useWebSocket(url, {
      autoReconnect: true,
    });
  }

  const { status, data, send, open, close } = WSConnection;
  const parsedData = ref<WSReturn>({ action: "", data: {} });

  watch(data, (newValue) => {
    if (newValue) parsedData.value = JSON.parse(newValue);
  });

  function closeConnection() {
    WSConnection = undefined;
    close();
  }

  return {
    status,
    data: parsedData,
    send,
    open,
    close: closeConnection,
  };
}

let WSCliConnection: UseWebSocketReturn<string> | undefined = undefined;
export function useCliWSConnection() {
  const { token } = useAuthStore();

  if (WSCliConnection === undefined) {
    const url = getWSUrl("trmmcli", token.value);
    WSCliConnection = useWebSocket(url);
  }

  const { status, data, send, open, close } = WSCliConnection;
  const parsedData = ref<WSReturn>({ action: "", data: {} });

  watch(data, (newValue) => {
    if (newValue) parsedData.value = JSON.parse(newValue);
  });

  function closeConnection() {
    WSCliConnection = undefined;
    close();
  }

  return {
    status,
    data: parsedData,
    send,
    open,
    close: closeConnection,
  };
}
