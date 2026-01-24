import type { QVueGlobals } from "quasar";
import type { Router, RouteLocationNormalizedLoaded } from "vue-router";
import type { Component } from "vue";

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

// DialogWrapper options type
export interface DialogWrapperOptions {
  component: Component;
  props?: Record<string, unknown>;
  title?: string;
  width?: string;
  noCard?: boolean;
  // All other QDialogOptions
  [key: string]: unknown;
}

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $integrations: Integrations;
    $q: QVueGlobals & {
      dialogWrapper(
        options: DialogWrapperOptions,
      ): ReturnType<QVueGlobals["dialog"]>;
    };
    $router: Router;
    $route: RouteLocationNormalizedLoaded;
  }
}

export {};
