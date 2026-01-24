import type { DialogWrapperOptions } from "src/typings";

declare module "quasar" {
  interface QVueGlobals {
    dialogWrapper(options: DialogWrapperOptions): ReturnType<QVueGlobals["dialog"]>;
  }
}
