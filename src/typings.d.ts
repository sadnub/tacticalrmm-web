import type { QVueGlobals } from "quasar";
import type { Router, RouteLocationNormalizedLoaded } from "vue-router";

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*?worker" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: any;
  export default content;
}

export interface Window {
  _env_: {
    PROD_URL: string;
  };
}

export interface Integrations {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
}

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $integrations: Integrations;
    $q: QVueGlobals;
    $router: Router;
    $route: RouteLocationNormalizedLoaded;
  }
}

export {};
