/* eslint-disable @typescript-eslint/no-unused-vars */

import type { QVueGlobals } from "quasar";
import type { Router, RouteLocationNormalizedLoaded } from "vue-router";

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    VUE_ROUTER_MODE: "hash" | "history" | "abstract" | undefined;
    VUE_ROUTER_BASE: string | undefined;
  }
}

export {};
