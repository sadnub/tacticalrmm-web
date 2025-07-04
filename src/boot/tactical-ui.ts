import { defineBoot } from "#q-app/wrappers";
import TacticalTable from "src/core/dashboard/ui/TacticalTable.vue";
import TruncateText from "src/core/dashboard/ui/TruncateText.vue";
import TacticalDropdown from "src/core/dashboard/ui/TacticalDropdown.vue";
import TacticalTableExport from "src/core/dashboard/ui/TacticalTableExport.vue";

export default defineBoot(({ app }) => {
  app.component("TacticalTable", TacticalTable);
  app.component("TacticalTableExport", TacticalTableExport);
  app.component("TruncateText", TruncateText);
  app.component("TacticalDropdown", TacticalDropdown);
});
