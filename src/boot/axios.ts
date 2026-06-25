import { defineBoot } from "#q-app/wrappers";
import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "src/core/dashboard/api";
import { Notify } from "quasar";

interface ApiErrorDetail {
  detail: string;
}

interface ApiNonFieldErrors {
  non_field_errors: string[];
}

interface ApiFieldErrors {
  [key: string]: string[];
}

export const getBaseUrl = (): string => {
  if (process.env.NODE_ENV === "production") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any)._env_.PROD_URL;
  } else {
    // Use local backend for development
    return "http://localhost:8000";
  }
};

export function setErrorMessage(data: unknown, message: string): (() => string)[] {
  return [() => message];
}

export default defineBoot(({ app, router }) => {
  app.config.globalProperties.$axios = axios;
  axios.defaults.withCredentials = true;

  axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const { token } = useAuthStore();
      config.baseURL = getBaseUrl();

      if (token.value) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Token ${token.value}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    },
  );

  axios.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      if (!axios.isAxiosError(error)) {
        Notify.create({
          color: "negative",
          message: "An unexpected error occurred.",
        });
        return Promise.reject(error as Error);
      }

      if (error.code === "ERR_NETWORK") {
        Notify.create({
          color: "negative",
          message: "Backend is offline (network error)",
          caption: "Open your browser dev tools and check the console for more details",
          timeout: 5000,
        });
        return Promise.reject(error);
      }

      let text: string | undefined;

      if (!error.response) {
        text = error.message;
      } else if (error.response.status === 401) {
        void router.push({ path: "/expired" });
      } else if (error.response.status === 403) {
        if (
          error.config?.method === "get" ||
          error.config?.method === "patch" ||
          error.config?.url === "accounts/ssoproviders/token/"
        ) {
          return Promise.reject(error);
        }
        text = (error.response.data as ApiErrorDetail)?.detail;
      } else if (
        error.response.status >= 400 &&
        error.response.status < 500 &&
        error.response.status !== 423
      ) {
        if (error.config?.responseType === "blob") {
          text = (await (error.response.data as Blob).text()).replace(/^"|"$/g, "");
        } else {
          const data = error.response.data;
          if (typeof data === "string") {
            text = data;
          } else if (data && (data as ApiNonFieldErrors).non_field_errors) {
            text = (data as ApiNonFieldErrors).non_field_errors[0];
          } else if (data && typeof data === "object") {
            const entries = Object.entries(data as ApiFieldErrors);

            if (entries.length > 0 && entries[0]) {
              const [key, value] = entries[0];
              if (key && Array.isArray(value) && value.length > 0) {
                text = `${key}: ${value[0]}`;
              } else if (key && value != null) {
                text = `${key}: ${String(value)}`;
              }
            }
          }
        }
      }

      if (text) {
        Notify.create({
          color: "negative",
          message: text,
          caption: `${error.response?.status ?? ""}: ${error.response?.statusText ?? ""}`,
          timeout: 2500,
        });
      }

      return Promise.reject(error);
    },
  );
});
