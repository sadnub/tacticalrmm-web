import { ref, watch } from "vue";
import { type UseWebSocketReturn, useWebSocket } from "@vueuse/core";
import { getBaseUrl } from "src/boot/axios";
import { useAuthStore } from "src/core/dashboard/api";
import { Notify } from "quasar";

export function getWSUrl(path: string, token: string | null) {
  const url = getBaseUrl().split("://")[1];

  const proto = process.env.NODE_ENV === "production" || process.env.DOCKER_BUILD ? "wss" : "ws";
  return `${proto}://${url}/ws/${path}/?access_token=${token}`;
}

interface CmdMessage {
  cmd_id: string;
  output?: string;
  done?: boolean;
  exit_code?: number;
  error?: string;
  status?: number;
  [key: string]: unknown;
}

export function useAgentCmdWSConnection(agentId: string, cmdId: string) {
  const { token } = useAuthStore();
  const lines = ref<CmdMessage[]>([]);
  const url = getWSUrl(`agent/${agentId}/cmd`, token.value);
  const ws = useWebSocket(url, {
    autoReconnect: false,
    onMessage(_, ev) {
      try {
        const parsed = JSON.parse(ev.data) as CmdMessage;
        if (parsed?.error) {
          const msg = `${parsed.error ? parsed.error : "Unknown WebSocket error"}`;
          const caption = parsed.status ? `${parsed.status}: Forbidden` : "Error";
          Notify.create({
            message: msg,
            color: "negative",
            position: "top",
            caption,
            timeout: 4000,
          });
          ws.close();
          return;
        }
        if (parsed?.cmd_id !== cmdId) return;
        if (
          parsed?.output != null &&
          !((lines.value.length === 0 || lines.value.length === 1) && parsed.output.trim() === "")
        ) {
          lines.value.push(parsed);
        }
      } catch {
        lines.value.push({
          cmd_id: cmdId,
          output: "[Error] Unable to parse server output",
        });
      }
    },
  });

  function reset() {
    lines.value = [];
  }

  function closeConnection() {
    ws.close();
    lines.value = [];
  }

  return {
    status: ws.status,
    data: lines,
    send: ws.send,
    open: ws.open,
    reset,
    close: closeConnection,
  };
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
