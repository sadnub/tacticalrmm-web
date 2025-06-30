import { defineStore } from "#q-app/wrappers";
import { createPinia, type PiniaPluginContext } from "pinia";
import { type Ref, ref, unref } from "vue";

/*
 * When adding new properties to stores, you should also
 * extend the `PiniaCustomProperties` interface.
 * @see https://pinia.vuejs.org/core-concepts/plugins.html#typing-new-store-properties
 */
declare module "pinia" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface DefineStoreOptionsBase<S, Store> {
    cache?: {
      [actionName: string]: {
        duration?: number;
      };
    };
  }

  export interface PiniaCustomProperties {
    _cacheTimestamps: Ref<Record<string, number>>;
  }
}

// adds a caching mechanism to pinia stores
export const cachePlugin = ({ store, options }: PiniaPluginContext): void => {
  store._cacheTimestamps = ref({});
  if (!options.cache) {
    return;
  }

  const cachedActionNames = Object.keys(options.cache);

  for (const actionName of cachedActionNames) {
    const originalAction = store[actionName];

    if (typeof originalAction !== "function") {
      console.warn(
        `[Pinia Cache Plugin] Attempted to cache "${actionName}", which is not a function on the store. It may not be an action.`,
      );
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    store[actionName] = async function (...args: any[]) {
      const now = Date.now();
      const lastFetch = unref(store._cacheTimestamps)[actionName] || 0;
      const cacheConfig = options.cache![actionName];
      const duration = cacheConfig?.duration ?? 5 * 60 * 1000;
      const force = typeof args[0] === "object" && args[0] !== null && args[0].force === true;

      if (!force && lastFetch && now - lastFetch < duration) {
        return;
      }

      const result = await originalAction.apply(store, args);
      unref(store._cacheTimestamps)[actionName] = Date.now();
      return result;
    };
  }
};

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default defineStore((/* { ssrContext } */) => {
  const pinia = createPinia();

  // You can add Pinia plugins here
  pinia.use(cachePlugin);

  return pinia;
});
