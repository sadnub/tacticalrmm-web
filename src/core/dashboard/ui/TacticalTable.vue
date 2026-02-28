<template>
  <q-table
    ref="tacticalTable"
    :rows="rows"
    :columns="localColumns"
    :visible-columns="visibleColumns"
    :selected="selected"
    :table-class="{
      'table-bgcolor': !$q.dark.isActive,
      'table-bgcolor-dark': $q.dark.isActive,
      'column-bgcolor-dark': $q.dark.isActive && columnSelect,
      'column-bgcolor': !$q.dark.isActive && columnSelect,
      'sticky-header-right-column': columnSelect,
      'tbl-sticky': !columnSelect,
      'tactical-table--dense': true,
    }"
    v-bind="$attrs"
    @update:selected="$emit('update:selected', $event)"
  >
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>

    <template #header-cell-columnSelect>
      <q-th auto-width>
        <q-btn dense flat icon="more_horiz">
          <q-menu>
            <q-option-group v-model="visibleColumns" :options="columnOptions" type="checkbox" />
          </q-menu>
        </q-btn>
      </q-th>
    </template>
  </q-table>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { type TableExportFunction, tableExportKey, type TacticalColumn } from "../types";
export default defineComponent({
  inheritAttrs: false,
});
</script>

<script setup lang="ts">
import { ref, computed, useTemplateRef, provide } from "vue";
import { useStorage } from "@vueuse/core";
import type { QTable, QTableProps } from "quasar";
import { exportToCsv } from "src/utils/csv";

const props = withDefaults(
  defineProps<{
    rows: QTableProps["rows"];
    columns: TacticalColumn[];
    columnSelect?: boolean;
    storageKey?: string;
    selected?: unknown[];
  }>(),
  { columnSelect: false, storageKey: "", selected: () => [] },
);

defineEmits<{
  "update:selected": [value: readonly unknown[]];
}>();

const columnSelectCol: TacticalColumn = {
  name: "columnSelect",
  label: "Column Select",
  field: "columnSelect",
  required: true,
  sortable: false,
};

const localColumns = computed(() =>
  props.columnSelect ? [...props.columns, columnSelectCol] : [...props.columns],
);

const storedNames = props.storageKey
  ? useStorage<string[]>(`${props.storageKey}-columns`, [])
  : ref<string[]>([]);

const defaultNames = computed(() =>
  localColumns.value.filter((c) => !c.hiddenByDefault).map((c) => c.name),
);

const visibleColumns = computed<string[]>({
  get() {
    const valid = storedNames.value.filter((n) => localColumns.value.some((c) => c.name === n));
    return valid.length ? valid : defaultNames.value;
  },
  set(v) {
    storedNames.value = v;
  },
});

// exclude 'required' columns from the columnOptions
const columnOptions = computed(() =>
  localColumns.value.filter((col) => !col.required).map((c) => ({ label: c.label, value: c.name })),
);

const tacticalTable = useTemplateRef<QTable>("tacticalTable");

function handleExportCsv() {
  if (!tacticalTable.value) {
    console.error("Table reference is not available.");
    return;
  }

  const visibleCols = localColumns.value.filter(
    (col) => visibleColumns.value.includes(col.name) && col.name !== "columnSelect",
  );

  const rowsToExport = tacticalTable.value.filteredSortedRows;

  exportToCsv(visibleCols, rowsToExport, "table-export");
}

// expose handleExportCsv on the tactical table instance and to child components
provide<TableExportFunction>(tableExportKey, handleExportCsv);
defineExpose({
  exportTable: handleExportCsv,
});
</script>

<style lang="sass">

.column-bgcolor-dark
  td:last-child
    /* bg color is important for td; just specify one */
    background-color: #1d1d1d

.column-bgcolor
  td:last-child
    /* bg color is important for td; just specify one */
    background-color: #ffffff

.sticky-header-right-column
  tr th
    position: sticky
    /* higher than z-index for td below */
    z-index: 2
  /* this will be the loading indicator */
  thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
    /* highest z-index */
    z-index: 3
  thead tr:first-child th
    top: 0
    z-index: 1
  tr:last-child th:last-child
    /* highest z-index */
    z-index: 3
  th:last-child
    position: sticky
    right: 0
  /* prevent scrolling behind sticky top row on focus */
  tbody
    /* height of all previous header rows */
    scroll-margin-top: 48px

.tactical-table--dense
  .q-table th,
  .q-table td
    padding: 4px 4px
  .q-table th:first-child,
  .q-table td:first-child
    padding-left: 4px
  .q-table th:last-child,
  .q-table td:last-child
    padding-right: 4px
</style>
