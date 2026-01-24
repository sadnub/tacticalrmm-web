import { defineBoot } from "#q-app/wrappers";
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";
import TruncateText from "src/core/dashboard/ui/TruncateText.vue";
import TacticalDropdown from "src/core/dashboard/ui/TacticalDropdown.vue";
import TacticalTableExport from "src/core/dashboard/ui/TacticalTableExport.vue";
import DialogWrapper from "src/core/dashboard/ui/DialogWrapper.vue";
import type { DialogWrapperOptions } from "src/typings";

export default defineBoot(({ app }) => {
  app.component("TacticalTable", TacticalTable);
  app.component("TacticalTableExport", TacticalTableExport);
  app.component("TruncateText", TruncateText);
  app.component("TacticalDropdown", TacticalDropdown);

  // Extend the Quasar instance with our custom dialogWrapper method
  const q = app.config.globalProperties.$q;
  q.dialogWrapper = function (options: DialogWrapperOptions) {
    const { component, props, title, width, noCard, ...dialogOptions } = options;

    return q.dialog({
      ...dialogOptions,
      component: DialogWrapper,
      componentProps: {
        vuecomponent: component,
        componentProps: props,
        title,
        width,
        noCard,
      },
    });
  };
});
